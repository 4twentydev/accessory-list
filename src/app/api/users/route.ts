import { getSession, hashPin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { seedDefaultAdmin } from "@/lib/schema";
import { type NextRequest, NextResponse } from "next/server";

export async function GET() {
	const session = await getSession();
	if (!session || session.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const db = getDb();
	seedDefaultAdmin(db);
	const users = db
		.prepare("SELECT id, name, role, active FROM users ORDER BY name")
		.all();
	return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
	const session = await getSession();
	if (!session || session.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const db = getDb();
	const { name, pin, role } = await req.json();

	if (!name || !pin) {
		return NextResponse.json(
			{ error: "Name and PIN required" },
			{ status: 400 },
		);
	}

	const pinHash = hashPin(pin);
	const result = db
		.prepare("INSERT INTO users (name, pin_hash, role) VALUES (?, ?, ?)")
		.run(name, pinHash, role || "pm");

	return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}

export async function PUT(req: NextRequest) {
	const session = await getSession();
	if (!session || session.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const db = getDb();
	const { id, name, pin, role, active } = await req.json();

	if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

	if (pin) {
		const pinHash = hashPin(pin);
		db.prepare(
			"UPDATE users SET name = ?, pin_hash = ?, role = ?, active = ? WHERE id = ?",
		).run(name, pinHash, role || "pm", active ?? 1, id);
	} else {
		db.prepare(
			"UPDATE users SET name = ?, role = ?, active = ? WHERE id = ?",
		).run(name, role || "pm", active ?? 1, id);
	}

	return NextResponse.json({ success: true });
}
