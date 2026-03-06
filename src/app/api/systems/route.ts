import { getDb } from "@/lib/db";
import { seedSystems } from "@/lib/schema";
import type { System, SystemField } from "@/types";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const db = getDb();
	seedSystems(db);

	const systemId = req.nextUrl.searchParams.get("id");

	if (systemId) {
		const system = db
			.prepare("SELECT * FROM systems WHERE id = ? AND active = 1")
			.get(Number(systemId)) as System | undefined;
		if (!system) {
			return NextResponse.json({ error: "System not found" }, { status: 404 });
		}
		const fields = db
			.prepare(
				"SELECT * FROM system_fields WHERE system_id = ? ORDER BY sort_order",
			)
			.all(system.id) as SystemField[];
		return NextResponse.json({ system, fields });
	}

	const systems = db
		.prepare("SELECT * FROM systems WHERE active = 1 ORDER BY sort_order")
		.all() as System[];
	return NextResponse.json({ systems });
}

export async function POST(req: NextRequest) {
	const db = getDb();
	const body = await req.json();
	const { name, display_name, description } = body;

	if (!name || !display_name) {
		return NextResponse.json(
			{ error: "Name and display_name required" },
			{ status: 400 },
		);
	}

	const maxOrder = db
		.prepare("SELECT MAX(sort_order) as max_order FROM systems")
		.get() as { max_order: number | null };
	const sortOrder = (maxOrder.max_order ?? -1) + 1;

	const result = db
		.prepare(
			"INSERT INTO systems (name, display_name, description, sort_order) VALUES (?, ?, ?, ?)",
		)
		.run(name, display_name, description || null, sortOrder);

	return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

export async function PUT(req: NextRequest) {
	const db = getDb();
	const body = await req.json();
	const { id, name, display_name, description, active, fields } = body;

	if (!id) {
		return NextResponse.json({ error: "ID required" }, { status: 400 });
	}

	db.prepare(
		"UPDATE systems SET name = ?, display_name = ?, description = ?, active = ? WHERE id = ?",
	).run(name, display_name, description || null, active ?? 1, id);

	if (fields && Array.isArray(fields)) {
		db.prepare("DELETE FROM system_fields WHERE system_id = ?").run(id);
		const insertField = db.prepare(
			"INSERT INTO system_fields (system_id, field_key, field_label, field_type, required, sort_order, options, default_value, include_on_pdf, include_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		);
		for (let i = 0; i < fields.length; i++) {
			const f = fields[i];
			insertField.run(
				id,
				f.field_key,
				f.field_label,
				f.field_type,
				f.required ? 1 : 0,
				i,
				f.options
					? typeof f.options === "string"
						? f.options
						: JSON.stringify(f.options)
					: null,
				f.default_value || null,
				f.include_on_pdf ?? 1,
				f.include_image ?? 0,
			);
		}
	}

	return NextResponse.json({ success: true });
}
