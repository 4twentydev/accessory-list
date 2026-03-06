import { checkStock, deductStock, searchParts } from "@/lib/inventory-client";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	const category = req.nextUrl.searchParams.get("category");
	const partName = req.nextUrl.searchParams.get("partName");
	const search = req.nextUrl.searchParams.get("search");

	if (search) {
		const results = await searchParts(search);
		return NextResponse.json({ results });
	}

	if (category && partName) {
		const stock = await checkStock(category, partName);
		return NextResponse.json({ stock });
	}

	return NextResponse.json(
		{ error: "Provide category+partName or search" },
		{ status: 400 },
	);
}

export async function POST(req: NextRequest) {
	const body = await req.json();
	const { items } = body;

	if (!items || !Array.isArray(items)) {
		return NextResponse.json(
			{ error: "items array required" },
			{ status: 400 },
		);
	}

	const result = await deductStock(items);
	return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
