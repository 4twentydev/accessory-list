import { getDb } from "@/lib/db";
import type { Part, PartAttribute, SystemField } from "@/types";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const db = getDb();
	const systemId = req.nextUrl.searchParams.get("system_id");
	const search = req.nextUrl.searchParams.get("search");
	const fieldKey = req.nextUrl.searchParams.get("field_key");
	const partId = req.nextUrl.searchParams.get("id");

	if (partId) {
		const part = db
			.prepare("SELECT * FROM parts WHERE id = ?")
			.get(Number(partId)) as Part | undefined;
		if (!part)
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		const attrs = db
			.prepare(
				`SELECT pa.*, sf.field_key, sf.field_label FROM part_attributes pa
			 JOIN system_fields sf ON pa.field_id = sf.id
			 WHERE pa.part_id = ?`,
			)
			.all(part.id) as (PartAttribute & {
			field_key: string;
			field_label: string;
		})[];
		return NextResponse.json({ part, attributes: attrs });
	}

	// Get distinct values for a specific field (for populating dropdowns)
	if (systemId && fieldKey) {
		const field = db
			.prepare(
				"SELECT id FROM system_fields WHERE system_id = ? AND field_key = ?",
			)
			.get(Number(systemId), fieldKey) as { id: number } | undefined;

		if (field) {
			const values = db
				.prepare(
					`SELECT DISTINCT pa.value FROM part_attributes pa
				 JOIN parts p ON pa.part_id = p.id
				 WHERE pa.field_id = ? AND p.active = 1 AND pa.value IS NOT NULL AND pa.value != ''
				 ORDER BY pa.value`,
				)
				.all(field.id) as { value: string }[];
			return NextResponse.json({ values: values.map((v) => v.value) });
		}
		return NextResponse.json({ values: [] });
	}

	let parts: Part[];
	if (systemId) {
		if (search) {
			parts = db
				.prepare(
					"SELECT * FROM parts WHERE system_id = ? AND active = 1 AND (name LIKE ? OR part_number LIKE ?) ORDER BY name",
				)
				.all(Number(systemId), `%${search}%`, `%${search}%`) as Part[];
		} else {
			parts = db
				.prepare(
					"SELECT * FROM parts WHERE system_id = ? AND active = 1 ORDER BY name",
				)
				.all(Number(systemId)) as Part[];
		}
	} else if (search) {
		parts = db
			.prepare(
				"SELECT * FROM parts WHERE active = 1 AND (name LIKE ? OR part_number LIKE ?) ORDER BY name LIMIT 50",
			)
			.all(`%${search}%`, `%${search}%`) as Part[];
	} else {
		parts = db
			.prepare("SELECT * FROM parts WHERE active = 1 ORDER BY name LIMIT 100")
			.all() as Part[];
	}

	return NextResponse.json({ parts });
}

export async function POST(req: NextRequest) {
	const db = getDb();
	const body = await req.json();
	const { system_id, part_number, name, description, image_path, attributes } =
		body;

	if (!system_id || !name) {
		return NextResponse.json(
			{ error: "system_id and name required" },
			{ status: 400 },
		);
	}

	const result = db
		.prepare(
			"INSERT INTO parts (system_id, part_number, name, description, image_path) VALUES (?, ?, ?, ?, ?)",
		)
		.run(
			system_id,
			part_number || null,
			name,
			description || null,
			image_path || null,
		);

	const partId = result.lastInsertRowid as number;

	if (attributes && typeof attributes === "object") {
		const fields = db
			.prepare("SELECT * FROM system_fields WHERE system_id = ?")
			.all(system_id) as SystemField[];
		const insertAttr = db.prepare(
			"INSERT INTO part_attributes (part_id, field_id, value) VALUES (?, ?, ?)",
		);
		for (const field of fields) {
			if (attributes[field.field_key] !== undefined) {
				insertAttr.run(partId, field.id, String(attributes[field.field_key]));
			}
		}
	}

	return NextResponse.json({ id: partId }, { status: 201 });
}

export async function PUT(req: NextRequest) {
	const db = getDb();
	const body = await req.json();
	const {
		id,
		part_number,
		name,
		description,
		image_path,
		active,
		attributes,
		system_id,
	} = body;

	if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

	db.prepare(
		"UPDATE parts SET part_number = ?, name = ?, description = ?, image_path = ?, active = ?, updated_at = datetime('now') WHERE id = ?",
	).run(
		part_number || null,
		name,
		description || null,
		image_path || null,
		active ?? 1,
		id,
	);

	if (attributes && system_id) {
		db.prepare("DELETE FROM part_attributes WHERE part_id = ?").run(id);
		const fields = db
			.prepare("SELECT * FROM system_fields WHERE system_id = ?")
			.all(system_id) as SystemField[];
		const insertAttr = db.prepare(
			"INSERT INTO part_attributes (part_id, field_id, value) VALUES (?, ?, ?)",
		);
		for (const field of fields) {
			if (attributes[field.field_key] !== undefined) {
				insertAttr.run(id, field.id, String(attributes[field.field_key]));
			}
		}
	}

	return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
	const db = getDb();
	const { id } = await req.json();
	if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

	db.prepare(
		"UPDATE parts SET active = 0, updated_at = datetime('now') WHERE id = ?",
	).run(id);
	return NextResponse.json({ success: true });
}
