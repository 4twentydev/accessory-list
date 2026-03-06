"use client";

import type { System } from "@/types";

interface SystemSelectorProps {
	systems: System[];
	selectedId: number | null;
	onSelect: (id: number) => void;
}

export default function SystemSelector({
	systems,
	selectedId,
	onSelect,
}: SystemSelectorProps) {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
			{systems.map((system) => (
				<button
					key={system.id}
					type="button"
					onClick={() => onSelect(system.id)}
					className={`p-4 rounded-xl border-2 text-left transition-all ${
						selectedId === system.id
							? "border-[var(--elward-navy)] bg-[var(--elward-navy)] text-white shadow-lg"
							: "border-gray-200 bg-white hover:border-[var(--elward-blue)] hover:shadow-md"
					}`}
				>
					<div className="font-bold text-sm">{system.name}</div>
					<div
						className={`text-xs mt-1 ${selectedId === system.id ? "text-gray-200" : "text-gray-500"}`}
					>
						{system.display_name}
					</div>
				</button>
			))}
		</div>
	);
}
