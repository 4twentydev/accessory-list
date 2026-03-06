import { getDb } from "@/lib/db";
import { generatePackingListPdf } from "@/lib/pdf";
import { seedSystems } from "@/lib/schema";
import type { AccessoryList, AccessoryListItem } from "@/types";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const db = getDb();
	seedSystems(db);
	const listId = req.nextUrl.searchParams.get("id");

	if (!listId) {
		return NextResponse.json({ error: "List ID required" }, { status: 400 });
	}

	const list = db
		.prepare(
			`SELECT al.*, s.display_name as system_name FROM accessory_lists al
		 JOIN systems s ON al.system_id = s.id WHERE al.id = ?`,
		)
		.get(Number(listId)) as
		| (AccessoryList & { system_name: string })
		| undefined;

	if (!list) {
		return NextResponse.json({ error: "List not found" }, { status: 404 });
	}

	const items = db
		.prepare(
			`SELECT ali.*, p.name as part_name, p.description as part_description
		 FROM accessory_list_items ali
		 LEFT JOIN parts p ON ali.part_id = p.id
		 WHERE ali.list_id = ?
		 ORDER BY ali.sort_order`,
		)
		.all(list.id) as (AccessoryListItem & {
		part_name: string;
		part_description: string;
	})[];

	const pdfBuffer = generatePackingListPdf({
		jobNumber: list.job_number,
		customerName: list.customer_name || "",
		shipToAddress: list.ship_to_address || "",
		pmName: list.created_by,
		date: new Date(list.created_at).toLocaleDateString(),
		notes: list.notes || undefined,
		items: items.map((item) => {
			let fieldValues: Record<string, string> = {};
			if (item.field_values) {
				try {
					fieldValues = JSON.parse(item.field_values);
				} catch {}
			}
			return {
				partName:
					item.part_name ||
					fieldValues.name ||
					fieldValues.part_name ||
					"Custom Item",
				description: item.part_description || undefined,
				systemName: list.system_name,
				quantity: item.quantity,
				notes: item.notes || undefined,
				fieldValues,
			};
		}),
	});

	// Mark as printed
	db.prepare(
		"UPDATE accessory_lists SET status = 'printed', updated_at = datetime('now') WHERE id = ? AND status != 'shipped'",
	).run(list.id);

	return new Response(pdfBuffer.buffer as ArrayBuffer, {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `inline; filename="packing-list-${list.job_number}.pdf"`,
		},
	});
}

export async function POST(req: NextRequest) {
	// Generate PDF from inline data (without saving to DB first)
	const body = await req.json();
	const { jobNumber, customerName, shipToAddress, pmName, date, items } = body;

	if (!jobNumber || !items?.length) {
		return NextResponse.json(
			{ error: "jobNumber and items required" },
			{ status: 400 },
		);
	}

	const pdfBuffer = generatePackingListPdf({
		jobNumber,
		customerName: customerName || "",
		shipToAddress: shipToAddress || "",
		pmName: pmName || "",
		date: date || new Date().toLocaleDateString(),
		items: items.map(
			(item: {
				partName: string;
				description?: string;
				systemName: string;
				quantity: number;
				unit?: string;
				notes?: string;
				fieldValues?: Record<string, string>;
			}) => ({
				partName: item.partName,
				description: item.description,
				systemName: item.systemName,
				quantity: item.quantity,
				unit: item.unit,
				notes: item.notes,
				fieldValues: item.fieldValues,
			}),
		),
	});

	return new Response(pdfBuffer.buffer as ArrayBuffer, {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `inline; filename="packing-list-${jobNumber}.pdf"`,
		},
	});
}
