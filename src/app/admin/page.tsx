"use client";

import { useEffect, useState } from "react";

export default function AdminOverview() {
	const [stats, setStats] = useState({
		systems: 0,
		parts: 0,
		lists: 0,
		users: 0,
	});

	useEffect(() => {
		Promise.all([
			fetch("/api/systems").then((r) => r.json()),
			fetch("/api/parts").then((r) => r.json()),
			fetch("/api/lists").then((r) => r.json()),
		]).then(([systemsData, partsData, listsData]) => {
			setStats({
				systems: systemsData.systems?.length || 0,
				parts: partsData.parts?.length || 0,
				lists: listsData.lists?.length || 0,
				users: 0,
			});
		});
	}, []);

	const cards = [
		{
			label: "Systems",
			value: stats.systems,
			href: "/admin/systems",
			color: "bg-blue-500",
		},
		{
			label: "Parts",
			value: stats.parts,
			href: "/admin/parts",
			color: "bg-green-500",
		},
		{
			label: "Lists",
			value: stats.lists,
			href: "/lists",
			color: "bg-purple-500",
		},
		{
			label: "Users",
			value: stats.users,
			href: "/admin/users",
			color: "bg-orange-500",
		},
	];

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">Admin Overview</h2>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{cards.map((card) => (
					<a
						key={card.label}
						href={card.href}
						className="card hover:shadow-md transition-shadow"
					>
						<div
							className={`w-10 h-10 rounded-lg ${card.color} mb-3 flex items-center justify-center text-white font-bold`}
						>
							{card.value}
						</div>
						<div className="font-medium text-gray-700">{card.label}</div>
					</a>
				))}
			</div>
		</div>
	);
}
