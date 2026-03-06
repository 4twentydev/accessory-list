import type { User } from "@/types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getDb } from "./db";

const JWT_SECRET =
	process.env.JWT_SECRET || "elward-accessory-list-secret-change-me";
const SESSION_COOKIE = "accessory_session";

export async function verifyPin(pin: string): Promise<User | null> {
	const db = getDb();
	const users = db
		.prepare("SELECT * FROM users WHERE active = 1")
		.all() as User[];

	for (const user of users) {
		if (bcrypt.compareSync(pin, user.pin_hash)) {
			return user;
		}
	}
	return null;
}

export function createSession(user: User): string {
	return jwt.sign(
		{ userId: user.id, name: user.name, role: user.role },
		JWT_SECRET,
		{ expiresIn: "12h" },
	);
}

export async function getSession(): Promise<{
	userId: number;
	name: string;
	role: string;
} | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get(SESSION_COOKIE)?.value;
	if (!token) return null;

	try {
		const payload = jwt.verify(token, JWT_SECRET) as {
			userId: number;
			name: string;
			role: string;
		};
		return payload;
	} catch {
		return null;
	}
}

export function hashPin(pin: string): string {
	return bcrypt.hashSync(pin, 10);
}
