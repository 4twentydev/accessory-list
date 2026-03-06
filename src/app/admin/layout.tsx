"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLayout({
	children,
}: { children: React.ReactNode }) {
	const router = useRouter();
	const [authorized, setAuthorized] = useState(false);

	useEffect(() => {
		fetch("/api/auth")
			.then((r) => r.json())
			.then((data) => {
				if (data.user?.role === "admin") {
					setAuthorized(true);
				} else {
					router.push("/lock");
				}
			})
			.catch(() => router.push("/lock"));
	}, [router]);

	if (!authorized) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-400">Checking authorization...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<header className="bg-[var(--elward-navy)] text-white px-6 py-3 flex items-center justify-between">
				<div>
					<h1 className="text-lg font-bold">Admin Dashboard</h1>
					<p className="text-xs text-gray-300">
						Elward Systems - Accessory List Builder
					</p>
				</div>
				<nav className="flex items-center gap-4 text-sm">
					<a href="/admin" className="text-gray-300 hover:text-white">
						Overview
					</a>
					<a href="/admin/parts" className="text-gray-300 hover:text-white">
						Parts
					</a>
					<a href="/admin/systems" className="text-gray-300 hover:text-white">
						Systems
					</a>
					<a href="/admin/import" className="text-gray-300 hover:text-white">
						Import
					</a>
					<a href="/admin/users" className="text-gray-300 hover:text-white">
						Users
					</a>
					<a href="/" className="text-gray-300 hover:text-white">
						&larr; Builder
					</a>
				</nav>
			</header>
			<main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
		</div>
	);
}
