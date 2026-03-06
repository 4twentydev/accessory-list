"use client";

import type { AccessoryList, AccessoryListItem } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ListDetail = AccessoryList & { system_name: string };
type ItemDetail = AccessoryListItem & {
	part_name: string;
	part_description: string;
	part_number: string;
};

export default function ListDetailPage() {
	const router = useRouter();
	const params = useParams();
	const [list, setList] = useState<ListDetail | null>(null);
	const [items, setItems] = useState<ItemDetail[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/auth")
			.then((r) => r.json())
			.then((data) => {
				if (!data.user) router.push("/lock");
			})
			.catch(() => router.push("/lock"));
	}, [router]);

	useEffect(() => {
		if (!params.id) return;
		fetch(`/api/lists?id=${params.id}`)
			.then((r) => r.json())
			.then((data) => {
				setList(data.list || null);
				setItems(data.items || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [params.id]);

	const handlePdf = () => {
		window.open(`/api/pdf?id=${params.id}`, "_blank");
	};

	const handleUpdateStatus = async (status: string) => {
		await fetch("/api/lists", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: Number(params.id), status }),
		});
		setList((prev) =>
			prev ? { ...prev, status: status as AccessoryList["status"] } : null,
		);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-400">Loading...</div>
			</div>
		);
	}

	if (!list) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-400">List not found</div>
			</div>
		);
	}

	const statusColor: Record<string, string> = {
		draft: "bg-yellow-100 text-yellow-800",
		submitted: "bg-blue-100 text-blue-800",
		printed: "bg-green-100 text-green-800",
		shipped: "bg-gray-100 text-gray-800",
	};

	return (
		<div className="min-h-screen">
			<header className="bg-[var(--elward-navy)] text-white px-6 py-3 flex items-center justify-between">
				<div>
					<h1 className="text-lg font-bold">
						List #{list.id} - {list.job_number}
					</h1>
					<p className="text-xs text-gray-300">{list.system_name}</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={handlePdf}
						className="btn-primary bg-white text-[var(--elward-navy)]"
					>
						Download PDF
					</button>
					<a href="/lists" className="text-sm text-gray-300 hover:text-white">
						&larr; All Lists
					</a>
				</div>
			</header>

			<main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
				{/* Job Info */}
				<section className="card">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						<div>
							<div className="text-gray-500">Job Number</div>
							<div className="font-bold">{list.job_number}</div>
						</div>
						<div>
							<div className="text-gray-500">Customer</div>
							<div className="font-medium">{list.customer_name || "N/A"}</div>
						</div>
						<div>
							<div className="text-gray-500">Created By</div>
							<div className="font-medium">{list.created_by}</div>
						</div>
						<div>
							<div className="text-gray-500">Status</div>
							<div>
								<span
									className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[list.status] || ""}`}
								>
									{list.status}
								</span>
							</div>
						</div>
						{list.ship_to_address && (
							<div className="col-span-2">
								<div className="text-gray-500">Ship To</div>
								<div className="font-medium whitespace-pre-line">
									{list.ship_to_address}
								</div>
							</div>
						)}
						<div>
							<div className="text-gray-500">Created</div>
							<div className="font-medium">
								{new Date(list.created_at).toLocaleString()}
							</div>
						</div>
					</div>

					<div className="flex gap-2 mt-4 pt-4 border-t">
						{list.status === "draft" && (
							<button
								type="button"
								className="btn-success"
								onClick={() => handleUpdateStatus("submitted")}
							>
								Submit to Shop
							</button>
						)}
						{list.status === "submitted" && (
							<button
								type="button"
								className="btn-primary"
								onClick={() => handleUpdateStatus("shipped")}
							>
								Mark Shipped
							</button>
						)}
					</div>
				</section>

				{/* Items */}
				<section className="card">
					<h2 className="text-lg font-bold mb-4">Items ({items.length})</h2>
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b-2 border-gray-200">
								<th className="text-left py-2 px-2">#</th>
								<th className="text-left py-2 px-2">Part</th>
								<th className="text-left py-2 px-2">Details</th>
								<th className="text-center py-2 px-2">Qty</th>
								<th className="text-left py-2 px-2">Notes</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item, idx) => {
								let fieldValues: Record<string, string> = {};
								if (item.field_values) {
									try {
										fieldValues = JSON.parse(item.field_values);
									} catch {}
								}
								const details = Object.entries(fieldValues)
									.filter(([k, v]) => v && k !== "quantity" && k !== "notes")
									.map(([k, v]) => `${k}: ${v}`)
									.join(", ");

								return (
									<tr key={item.id} className="border-b border-gray-100">
										<td className="py-2 px-2 text-gray-400">{idx + 1}</td>
										<td className="py-2 px-2 font-medium">
											{item.part_name ||
												fieldValues.name ||
												fieldValues.part_name ||
												"Custom Item"}
											{item.part_number && (
												<span className="text-gray-400 text-xs ml-1">
													({item.part_number})
												</span>
											)}
										</td>
										<td className="py-2 px-2 text-gray-500 text-xs">
											{details}
										</td>
										<td className="py-2 px-2 text-center font-medium">
											{item.quantity}
										</td>
										<td className="py-2 px-2 text-gray-500 text-xs">
											{item.notes}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</section>

				{list.notes && (
					<section className="card">
						<h2 className="text-lg font-bold mb-2">Notes</h2>
						<p className="text-sm text-gray-600 whitespace-pre-line">
							{list.notes}
						</p>
					</section>
				)}
			</main>
		</div>
	);
}
