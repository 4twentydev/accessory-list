"use client";

import type { AccessoryList } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ListWithSystem = AccessoryList & { system_name: string };

export default function ListsPage() {
	const router = useRouter();
	const [lists, setLists] = useState<ListWithSystem[]>([]);
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
		fetch("/api/lists")
			.then((r) => r.json())
			.then((data) => {
				setLists(data.lists || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

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
					<h1 className="text-lg font-bold">Saved Lists</h1>
					<p className="text-xs text-gray-300">
						Elward Systems - Accessory List Builder
					</p>
				</div>
				<a href="/" className="text-sm text-gray-300 hover:text-white">
					&larr; Back to Builder
				</a>
			</header>

			<main className="max-w-5xl mx-auto px-6 py-6">
				<div className="card">
					{loading ? (
						<p className="text-gray-400 text-center py-8">Loading...</p>
					) : lists.length === 0 ? (
						<p className="text-gray-400 text-center py-8">No lists yet</p>
					) : (
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b-2 border-gray-200">
									<th className="text-left py-2 px-2">Job #</th>
									<th className="text-left py-2 px-2">System</th>
									<th className="text-left py-2 px-2">Created By</th>
									<th className="text-left py-2 px-2">Date</th>
									<th className="text-left py-2 px-2">Status</th>
									<th className="text-right py-2 px-2" />
								</tr>
							</thead>
							<tbody>
								{lists.map((list) => (
									<tr
										key={list.id}
										className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
										onClick={() => router.push(`/lists/${list.id}`)}
									>
										<td className="py-3 px-2 font-medium">{list.job_number}</td>
										<td className="py-3 px-2">{list.system_name}</td>
										<td className="py-3 px-2">{list.created_by}</td>
										<td className="py-3 px-2 text-gray-500">
											{new Date(list.created_at).toLocaleDateString()}
										</td>
										<td className="py-3 px-2">
											<span
												className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor[list.status] || ""}`}
											>
												{list.status}
											</span>
										</td>
										<td className="py-3 px-2 text-right">
											<span className="text-gray-400 text-xs">View &rarr;</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</main>
		</div>
	);
}
