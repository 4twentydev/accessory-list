import { getDb } from "@/lib/db";
import type { SystemField } from "@/types";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const db = getDb();
	const body = await req.json();
	const { system_id, rows, column_mapping } = body;

	if (!system_id || !rows || !Array.isArray(rows)) {
		return NextResponse.json(
			{ error: "system_id and rows required" },
			{ status: 400 },
		);
	}

	const fields = db
		.prepare("SELECT * FROM system_fields WHERE system_id = ?")
		.all(system_id) as SystemField[];

	const insertPart = db.prepare(
		"INSERT INTO parts (system_id, part_number, name, description) VALUES (?, ?, ?, ?)",
	);
	const insertAttr = db.prepare(
		"INSERT INTO part_attributes (part_id, field_id, value) VALUES (?, ?, ?)",
	);

	let imported = 0;

	const transaction = db.transaction(() => {
		for (const row of rows) {
			const mappedRow: Record<string, string> = {};
			if (column_mapping) {
				for (const [csvCol, fieldKey] of Object.entries(column_mapping)) {
					mappedRow[fieldKey as string] = row[csvCol] || "";
				}
			} else {
				Object.assign(mappedRow, row);
			}

			const name =
				mappedRow.name ||
				mappedRow.part_name ||
				mappedRow.product ||
				Object.values(mappedRow)[0] ||
				"Unknown";
			const partNumber = mappedRow.part_number || mappedRow.partNumber || null;
			const description = mappedRow.description || null;

			const result = insertPart.run(
				system_id,
				partNumber,
				String(name),
				description,
			);
			const partId = result.lastInsertRowid as number;

			for (const field of fields) {
				const value = mappedRow[field.field_key];
				if (value !== undefined && value !== "") {
					insertAttr.run(partId, field.id, String(value));
				}
			}
			imported++;
		}
	});

	transaction();

	return NextResponse.json({ imported });
}
