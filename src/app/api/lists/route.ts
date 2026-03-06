import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { deductStock } from "@/lib/inventory-client";
import { seedSystems } from "@/lib/schema";
import type { AccessoryList, AccessoryListItem } from "@/types";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const db = getDb();
	seedSystems(db);
	const listId = req.nextUrl.searchParams.get("id");

	if (listId) {
		const list = db
			.prepare(
				`SELECT al.*, s.display_name as system_name FROM accessory_lists al
			 JOIN systems s ON al.system_id = s.id
			 WHERE al.id = ?`,
			)
			.get(Number(listId)) as
			| (AccessoryList & { system_name: string })
			| undefined;
		if (!list)
			return NextResponse.json({ error: "Not found" }, { status: 404 });

		const items = db
			.prepare(
				`SELECT ali.*, p.name as part_name, p.description as part_description, p.part_number
			 FROM accessory_list_items ali
			 LEFT JOIN parts p ON ali.part_id = p.id
			 WHERE ali.list_id = ?
			 ORDER BY ali.sort_order`,
			)
			.all(list.id) as (AccessoryListItem & {
			part_name: string;
			part_description: string;
			part_number: string;
		})[];

		return NextResponse.json({ list, items });
	}

	const lists = db
		.prepare(
			`SELECT al.*, s.display_name as system_name FROM accessory_lists al
		 JOIN systems s ON al.system_id = s.id
		 ORDER BY al.created_at DESC`,
		)
		.all() as (AccessoryList & { system_name: string })[];

	return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
	const db = getDb();
	const session = await getSession();
	const body = await req.json();
	const {
		job_number,
		customer_name,
		ship_to_address,
		system_id,
		notes,
		items,
		status,
	} = body;

	if (!job_number || !system_id) {
		return NextResponse.json(
			{ error: "job_number and system_id required" },
			{ status: 400 },
		);
	}

	const createdBy = session?.name || "Unknown";

	const result = db
		.prepare(
			`INSERT INTO accessory_lists (job_number, customer_name, ship_to_address, system_id, created_by, status, notes)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			job_number,
			customer_name || null,
			ship_to_address || null,
			system_id,
			createdBy,
			status || "draft",
			notes || null,
		);

	const listId = result.lastInsertRowid as number;

	if (items && Array.isArray(items)) {
		const insertItem = db.prepare(
			`INSERT INTO accessory_list_items (list_id, part_id, quantity, notes, sort_order, field_values)
			 VALUES (?, ?, ?, ?, ?, ?)`,
		);
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			insertItem.run(
				listId,
				item.part_id || null,
				item.quantity || 1,
				item.notes || null,
				i,
				item.field_values ? JSON.stringify(item.field_values) : null,
			);
		}
	}

	// If submitting, attempt inventory deduction
	if (status === "submitted" && items?.length) {
		const deductItems = items
			.filter((item: { part_id?: number; quantity?: number }) => item.part_id)
			.map((item: { part_id: number; quantity: number }) => ({
				partId: item.part_id,
				quantity: item.quantity || 1,
				jobNumber: job_number,
			}));

		if (deductItems.length > 0) {
			const result = await deductStock(deductItems);
			if (!result.success) {
				// Still save the list, but note the inventory failure
				db.prepare(
					"UPDATE accessory_lists SET notes = COALESCE(notes, '') || ? WHERE id = ?",
				).run(`\n[Inventory deduction failed: ${result.error}]`, listId);
			}
		}
	}

	return NextResponse.json({ id: listId }, { status: 201 });
}

export async function PUT(req: NextRequest) {
	const db = getDb();
	const body = await req.json();
	const { id, status, notes } = body;

	if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

	if (status) {
		db.prepare(
			"UPDATE accessory_lists SET status = ?, updated_at = datetime('now') WHERE id = ?",
		).run(status, id);
	}
	if (notes !== undefined) {
		db.prepare(
			"UPDATE accessory_lists SET notes = ?, updated_at = datetime('now') WHERE id = ?",
		).run(notes, id);
	}

	return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
	const db = getDb();
	const { id } = await req.json();
	if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
	db.prepare("DELETE FROM accessory_lists WHERE id = ?").run(id);
	return NextResponse.json({ success: true });
}
