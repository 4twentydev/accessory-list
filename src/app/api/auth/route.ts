import { createSession, getSession, verifyPin } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	const { pin } = await req.json();
	if (!pin || typeof pin !== "string") {
		return NextResponse.json({ error: "PIN required" }, { status: 400 });
	}

	const user = await verifyPin(pin);
	if (!user) {
		return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
	}

	const token = createSession(user);
	const response = NextResponse.json({
		user: { id: user.id, name: user.name, role: user.role },
	});

	response.cookies.set("accessory_session", token, {
		httpOnly: true,
		sameSite: "lax",
		maxAge: 60 * 60 * 12, // 12 hours
		path: "/",
	});

	return response;
}

export async function GET() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ user: null }, { status: 401 });
	}
	return NextResponse.json({ user: session });
}

export async function DELETE() {
	const response = NextResponse.json({ success: true });
	response.cookies.delete("accessory_session");
	return response;
}
