"use client";

import type { LineItem } from "@/types";

interface LineItemListProps {
	items: LineItem[];
	onRemove: (tempId: string) => void;
	onUpdateQuantity: (tempId: string, quantity: number) => void;
	onMoveUp: (tempId: string) => void;
	onMoveDown: (tempId: string) => void;
}

export default function LineItemList({
	items,
	onRemove,
	onUpdateQuantity,
	onMoveUp,
	onMoveDown,
}: LineItemListProps) {
	if (items.length === 0) {
		return (
			<div className="text-center py-12 text-gray-400">
				<p className="text-lg">No items added yet</p>
				<p className="text-sm mt-1">
					Select a system and add parts using the form above
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b-2 border-gray-200">
						<th className="text-left py-2 px-2 w-8">#</th>
						<th className="text-left py-2 px-2">Part</th>
						<th className="text-left py-2 px-2">System</th>
						<th className="text-left py-2 px-2">Details</th>
						<th className="text-center py-2 px-2 w-24">Qty</th>
						<th className="text-center py-2 px-2 w-20">Order</th>
						<th className="text-center py-2 px-2 w-16" />
					</tr>
				</thead>
				<tbody>
					{items.map((item, idx) => {
						const details = Object.entries(item.fieldValues)
							.filter(([k, v]) => v && k !== "quantity" && k !== "notes")
							.map(([k, v]) => `${k}: ${v}`)
							.join(", ");

						return (
							<tr
								key={item.tempId}
								className="border-b border-gray-100 hover:bg-gray-50"
							>
								<td className="py-2 px-2 text-gray-400">{idx + 1}</td>
								<td className="py-2 px-2 font-medium">{item.partName}</td>
								<td className="py-2 px-2">
									<span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs">
										{item.systemName}
									</span>
								</td>
								<td className="py-2 px-2 text-gray-500 text-xs max-w-xs truncate">
									{details}
								</td>
								<td className="py-2 px-2">
									<input
										type="number"
										className="w-20 text-center form-input py-1"
										value={item.quantity}
										onChange={(e) =>
											onUpdateQuantity(
												item.tempId,
												Math.max(1, Number.parseInt(e.target.value) || 1),
											)
										}
										min="1"
									/>
								</td>
								<td className="py-2 px-2 text-center">
									<div className="flex justify-center gap-1">
										<button
											type="button"
											onClick={() => onMoveUp(item.tempId)}
											disabled={idx === 0}
											className="px-1.5 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-30"
										>
											&#9650;
										</button>
										<button
											type="button"
											onClick={() => onMoveDown(item.tempId)}
											disabled={idx === items.length - 1}
											className="px-1.5 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-30"
										>
											&#9660;
										</button>
									</div>
								</td>
								<td className="py-2 px-2 text-center">
									<button
										type="button"
										onClick={() => onRemove(item.tempId)}
										className="text-red-500 hover:text-red-700 text-xs font-medium"
									>
										Remove
									</button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
