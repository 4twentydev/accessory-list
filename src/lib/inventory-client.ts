const INVENTORY_API_URL =
	process.env.INVENTORY_API_URL || "https://shop-inventory.4twenty.dev";

interface DeductItem {
	partId: number;
	quantity: number;
	jobNumber: string;
}

export async function checkStock(
	category: string,
	partName: string,
): Promise<{ available: number } | null> {
	try {
		const res = await fetch(
			`${INVENTORY_API_URL}/api/inventory?category=${encodeURIComponent(category)}&partName=${encodeURIComponent(partName)}`,
			{ next: { revalidate: 0 } },
		);
		if (!res.ok) return null;
		return res.json();
	} catch {
		return null;
	}
}

export async function deductStock(
	items: DeductItem[],
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch(`${INVENTORY_API_URL}/api/inventory/deduct`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ items }),
		});
		if (!res.ok) {
			const text = await res.text();
			return { success: false, error: text };
		}
		return { success: true };
	} catch (e) {
		return { success: false, error: `Inventory API unreachable: ${e}` };
	}
}

export async function searchParts(
	query: string,
): Promise<Array<{ id: number; name: string }>> {
	try {
		const res = await fetch(
			`${INVENTORY_API_URL}/api/inventory/search?q=${encodeURIComponent(query)}`,
		);
		if (!res.ok) return [];
		return res.json();
	} catch {
		return [];
	}
}
