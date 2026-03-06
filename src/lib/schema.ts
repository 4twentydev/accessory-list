import type Database from "better-sqlite3";

export function initSchema(db: Database.Database) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS systems (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			display_name TEXT NOT NULL,
			description TEXT,
			sort_order INTEGER DEFAULT 0,
			active INTEGER DEFAULT 1
		);

		CREATE TABLE IF NOT EXISTS system_fields (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			system_id INTEGER NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
			field_key TEXT NOT NULL,
			field_label TEXT NOT NULL,
			field_type TEXT NOT NULL,
			required INTEGER DEFAULT 0,
			sort_order INTEGER DEFAULT 0,
			options TEXT,
			default_value TEXT,
			include_on_pdf INTEGER DEFAULT 1,
			include_image INTEGER DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS parts (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			system_id INTEGER NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
			part_number TEXT,
			name TEXT NOT NULL,
			description TEXT,
			image_path TEXT,
			active INTEGER DEFAULT 1,
			created_at TEXT DEFAULT (datetime('now')),
			updated_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS part_attributes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
			field_id INTEGER NOT NULL REFERENCES system_fields(id) ON DELETE CASCADE,
			value TEXT
		);

		CREATE TABLE IF NOT EXISTS accessory_lists (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			job_number TEXT NOT NULL,
			customer_name TEXT,
			ship_to_address TEXT,
			system_id INTEGER NOT NULL REFERENCES systems(id),
			created_by TEXT NOT NULL,
			status TEXT DEFAULT 'draft',
			notes TEXT,
			created_at TEXT DEFAULT (datetime('now')),
			updated_at TEXT DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS accessory_list_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			list_id INTEGER NOT NULL REFERENCES accessory_lists(id) ON DELETE CASCADE,
			part_id INTEGER,
			quantity INTEGER NOT NULL DEFAULT 1,
			notes TEXT,
			sort_order INTEGER DEFAULT 0,
			field_values TEXT
		);

		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			pin_hash TEXT NOT NULL,
			role TEXT DEFAULT 'pm',
			active INTEGER DEFAULT 1
		);
	`);
}

export function seedSystems(db: Database.Database) {
	const existing = db.prepare("SELECT COUNT(*) as cnt FROM systems").get() as {
		cnt: number;
	};
	if (existing.cnt > 0) return;

	const insertSystem = db.prepare(
		"INSERT INTO systems (name, display_name, description, sort_order) VALUES (?, ?, ?, ?)",
	);
	const insertField = db.prepare(
		"INSERT INTO system_fields (system_id, field_key, field_label, field_type, required, sort_order, options, default_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
	);

	const systems: Array<{
		name: string;
		display_name: string;
		description: string;
		fields: Array<{
			key: string;
			label: string;
			type: string;
			required?: boolean;
			options?: string[];
			default_value?: string;
		}>;
	}> = [
		{
			name: "ACM",
			display_name: "ACM Panels",
			description: "Aluminum Composite Material panels",
			fields: [
				{
					key: "brand",
					label: "Brand",
					type: "select",
					options: ["Alucobond", "Alpolic", "Reynobond", "Other"],
				},
				{ key: "color_finish", label: "Color/Finish", type: "autocomplete" },
				{ key: "size", label: "Size", type: "select" },
				{
					key: "gauge",
					label: "Gauge",
					type: "select",
					options: [".125", ".157", ".187", "Other"],
				},
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
		{
			name: "SPL",
			display_name: "SwissPearl Panels",
			description: "SwissPearl fiber cement panels",
			fields: [
				{ key: "color_finish", label: "Color/Finish", type: "autocomplete" },
				{ key: "size", label: "Size", type: "select" },
				{
					key: "thickness",
					label: "Thickness",
					type: "select",
					options: ["8mm", "12mm", "Other"],
				},
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
		{
			name: "HPL",
			display_name: "Trespa Panels",
			description: "Trespa high-pressure laminate panels",
			fields: [
				{ key: "color_finish", label: "Color/Finish", type: "autocomplete" },
				{ key: "size", label: "Size", type: "select" },
				{ key: "thickness", label: "Thickness", type: "select" },
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
		{
			name: "DRY",
			display_name: "DRY Extrusions",
			description: "DRY system extrusions",
			fields: [
				{
					key: "extrusion_profile",
					label: "Extrusion Profile",
					type: "select",
				},
				{
					key: "color",
					label: "Color",
					type: "select",
					options: ["Black", "Silver", "Mill", "Custom"],
				},
				{ key: "length", label: "Length", type: "text" },
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
		{
			name: "PER",
			display_name: "PER Extrusions",
			description: "PER system extrusions",
			fields: [
				{
					key: "extrusion_profile",
					label: "Extrusion Profile",
					type: "select",
				},
				{
					key: "color",
					label: "Color",
					type: "select",
					options: ["Black", "Silver", "Mill", "Custom"],
				},
				{ key: "length", label: "Length", type: "text" },
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
		{
			name: "SRS",
			display_name: "SRS Extrusions",
			description: "SRS system extrusions",
			fields: [
				{
					key: "extrusion_profile",
					label: "Extrusion Profile",
					type: "select",
				},
				{ key: "length", label: "Length", type: "text" },
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
		{
			name: "WET",
			display_name: "WET Extrusions",
			description: "WET system extrusions",
			fields: [
				{
					key: "extrusion_profile",
					label: "Extrusion Profile",
					type: "select",
				},
				{ key: "length", label: "Length", type: "text" },
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
		{
			name: "HARDWARE",
			display_name: "Hardware",
			description: "Fasteners, brackets, and hardware",
			fields: [
				{ key: "part_name", label: "Part Name", type: "autocomplete" },
				{ key: "size", label: "Size", type: "select" },
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{
					key: "unit",
					label: "Unit",
					type: "select",
					options: ["EA", "BOX", "BAG", "LB"],
				},
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
		{
			name: "SEALANTS",
			display_name: "Sealants / Adhesives",
			description: "Sealants, adhesives, and tapes",
			fields: [
				{ key: "product", label: "Product", type: "autocomplete" },
				{ key: "color", label: "Color", type: "select" },
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{
					key: "unit",
					label: "Unit",
					type: "select",
					options: ["TUBE", "CASE", "PAIL", "EA"],
				},
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
		{
			name: "RIVETS",
			display_name: "Rivets",
			description: "Rivets and fasteners",
			fields: [
				{ key: "color", label: "Color", type: "select" },
				{ key: "size", label: "Size", type: "select" },
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
		{
			name: "MISC",
			display_name: "Miscellaneous",
			description: "Miscellaneous items",
			fields: [
				{ key: "category", label: "Category", type: "text" },
				{ key: "name", label: "Name", type: "autocomplete" },
				{ key: "size", label: "Size", type: "text" },
				{ key: "color", label: "Color", type: "text" },
				{ key: "quantity", label: "Quantity", type: "number", required: true },
				{
					key: "unit",
					label: "Unit",
					type: "select",
					options: ["EA", "FT", "LF", "SF", "BOX"],
				},
				{ key: "notes", label: "Notes", type: "textarea" },
			],
		},
	];

	const transaction = db.transaction(() => {
		for (let i = 0; i < systems.length; i++) {
			const sys = systems[i];
			const result = insertSystem.run(
				sys.name,
				sys.display_name,
				sys.description,
				i,
			);
			const systemId = result.lastInsertRowid as number;

			for (let j = 0; j < sys.fields.length; j++) {
				const field = sys.fields[j];
				insertField.run(
					systemId,
					field.key,
					field.label,
					field.type,
					field.required ? 1 : 0,
					j,
					field.options ? JSON.stringify(field.options) : null,
					field.default_value ?? null,
				);
			}
		}
	});

	transaction();
}

export function seedDefaultAdmin(db: Database.Database) {
	const existing = db.prepare("SELECT COUNT(*) as cnt FROM users").get() as {
		cnt: number;
	};
	if (existing.cnt > 0) return;

	// Default admin PIN: 1234 (bcrypt hash)
	const bcrypt = require("bcryptjs");
	const hash = bcrypt.hashSync("1234", 10);
	db.prepare("INSERT INTO users (name, pin_hash, role) VALUES (?, ?, ?)").run(
		"Admin",
		hash,
		"admin",
	);
}
