"use client";

import DynamicForm from "@/components/dynamic-form";
import JobHeaderForm from "@/components/job-header";
import LineItemList from "@/components/line-item-list";
import SystemSelector from "@/components/system-selector";
import type { JobHeader, LineItem, System, SystemField } from "@/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function Dashboard() {
	const router = useRouter();
	const [user, setUser] = useState<{
		id: number;
		name: string;
		role: string;
	} | null>(null);
	const [systems, setSystems] = useState<System[]>([]);
	const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
	const [fields, setFields] = useState<SystemField[]>([]);
	const [items, setItems] = useState<LineItem[]>([]);
	const [saving, setSaving] = useState(false);
	const [jobHeader, setJobHeader] = useState<JobHeader>({
		jobNumber: "",
		customerName: "",
		shipToAddress: "",
		pmName: "",
		date: new Date().toISOString().split("T")[0],
	});

	// Check auth
	useEffect(() => {
		fetch("/api/auth")
			.then((r) => r.json())
			.then((data) => {
				if (data.user) {
					setUser(data.user);
					setJobHeader((prev) => ({ ...prev, pmName: data.user.name }));
				} else {
					router.push("/lock");
				}
			})
			.catch(() => router.push("/lock"));
	}, [router]);

	// Load systems
	useEffect(() => {
		fetch("/api/systems")
			.then((r) => r.json())
			.then((data) => setSystems(data.systems || []))
			.catch(() => {});
	}, []);

	// Load fields when system changes
	useEffect(() => {
		if (!selectedSystem) {
			setFields([]);
			return;
		}
		fetch(`/api/systems?id=${selectedSystem}`)
			.then((r) => r.json())
			.then((data) => setFields(data.fields || []))
			.catch(() => {});
	}, [selectedSystem]);

	const handleAddItem = useCallback(
		(values: Record<string, string>) => {
			const system = systems.find((s) => s.id === selectedSystem);
			const name =
				values.part_name ||
				values.product ||
				values.name ||
				values.extrusion_profile ||
				values.color_finish ||
				values.brand ||
				system?.display_name ||
				"Item";

			const newItem: LineItem = {
				tempId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
				systemId: selectedSystem!,
				systemName: system?.name || "",
				partName: name,
				quantity: Number.parseInt(values.quantity) || 1,
				notes: values.notes,
				fieldValues: values,
			};
			setItems((prev) => [...prev, newItem]);
		},
		[selectedSystem, systems],
	);

	const handleRemove = (tempId: string) => {
		setItems((prev) => prev.filter((i) => i.tempId !== tempId));
	};

	const handleUpdateQuantity = (tempId: string, quantity: number) => {
		setItems((prev) =>
			prev.map((i) => (i.tempId === tempId ? { ...i, quantity } : i)),
		);
	};

	const handleMoveUp = (tempId: string) => {
		setItems((prev) => {
			const idx = prev.findIndex((i) => i.tempId === tempId);
			if (idx <= 0) return prev;
			const next = [...prev];
			[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
			return next;
		});
	};

	const handleMoveDown = (tempId: string) => {
		setItems((prev) => {
			const idx = prev.findIndex((i) => i.tempId === tempId);
			if (idx === -1 || idx >= prev.length - 1) return prev;
			const next = [...prev];
			[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
			return next;
		});
	};

	const handleSave = async (status: "draft" | "submitted") => {
		if (!jobHeader.jobNumber) {
			alert("Job Number is required");
			return;
		}
		if (items.length === 0) {
			alert("Add at least one item");
			return;
		}
		setSaving(true);
		try {
			const res = await fetch("/api/lists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					job_number: jobHeader.jobNumber,
					customer_name: jobHeader.customerName,
					ship_to_address: jobHeader.shipToAddress,
					system_id: items[0].systemId,
					status,
					items: items.map((item) => ({
						part_id: item.partId || null,
						quantity: item.quantity,
						notes: item.notes,
						field_values: item.fieldValues,
					})),
				}),
			});
			const data = await res.json();
			if (res.ok) {
				router.push(`/lists/${data.id}`);
			} else {
				alert(data.error || "Failed to save");
			}
		} catch {
			alert("Failed to save list");
		} finally {
			setSaving(false);
		}
	};

	const handleGeneratePdf = async () => {
		if (!jobHeader.jobNumber || items.length === 0) {
			alert("Job number and at least one item required");
			return;
		}
		try {
			const res = await fetch("/api/pdf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					jobNumber: jobHeader.jobNumber,
					customerName: jobHeader.customerName,
					shipToAddress: jobHeader.shipToAddress,
					pmName: jobHeader.pmName,
					date: jobHeader.date,
					items: items.map((item) => ({
						partName: item.partName,
						systemName: item.systemName,
						quantity: item.quantity,
						notes: item.notes,
						fieldValues: item.fieldValues,
					})),
				}),
			});
			if (res.ok) {
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				window.open(url, "_blank");
			}
		} catch {
			alert("Failed to generate PDF");
		}
	};

	const handleLogout = async () => {
		await fetch("/api/auth", { method: "DELETE" });
		router.push("/lock");
	};

	if (!user) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-gray-400">Loading...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* Top nav */}
			<header className="bg-[var(--elward-navy)] text-white px-6 py-3 flex items-center justify-between">
				<div>
					<h1 className="text-lg font-bold">Elward Systems</h1>
					<p className="text-xs text-gray-300">Accessory List Builder</p>
				</div>
				<div className="flex items-center gap-4">
					<a href="/lists" className="text-sm text-gray-300 hover:text-white">
						Saved Lists
					</a>
					{user.role === "admin" && (
						<a href="/admin" className="text-sm text-gray-300 hover:text-white">
							Admin
						</a>
					)}
					<span className="text-sm text-gray-300">{user.name}</span>
					<button
						type="button"
						onClick={handleLogout}
						className="text-sm text-gray-400 hover:text-white"
					>
						Logout
					</button>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
				{/* Job Header */}
				<section className="card">
					<h2 className="text-lg font-bold mb-4">Job Information</h2>
					<JobHeaderForm header={jobHeader} onChange={setJobHeader} />
				</section>

				{/* System Selector */}
				<section className="card">
					<h2 className="text-lg font-bold mb-4">Select System</h2>
					<SystemSelector
						systems={systems}
						selectedId={selectedSystem}
						onSelect={setSelectedSystem}
					/>
				</section>

				{/* Dynamic Form */}
				{selectedSystem && fields.length > 0 && (
					<section className="card">
						<h2 className="text-lg font-bold mb-4">
							Add {systems.find((s) => s.id === selectedSystem)?.display_name}{" "}
							Item
						</h2>
						<DynamicForm
							systemId={selectedSystem}
							fields={fields}
							onAddItem={handleAddItem}
						/>
					</section>
				)}

				{/* Line Items */}
				<section className="card">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-bold">
							Packing List ({items.length} item{items.length !== 1 ? "s" : ""})
						</h2>
						{items.length > 0 && (
							<div className="flex gap-2">
								<button
									type="button"
									className="btn-secondary"
									onClick={handleGeneratePdf}
								>
									Preview PDF
								</button>
								<button
									type="button"
									className="btn-secondary"
									onClick={() => handleSave("draft")}
									disabled={saving}
								>
									Save Draft
								</button>
								<button
									type="button"
									className="btn-success"
									onClick={() => handleSave("submitted")}
									disabled={saving}
								>
									{saving ? "Submitting..." : "Submit to Shop"}
								</button>
							</div>
						)}
					</div>
					<LineItemList
						items={items}
						onRemove={handleRemove}
						onUpdateQuantity={handleUpdateQuantity}
						onMoveUp={handleMoveUp}
						onMoveDown={handleMoveDown}
					/>
				</section>
			</main>
		</div>
	);
}
