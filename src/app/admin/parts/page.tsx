"use client";

import type { Part, System, SystemField } from "@/types";
import { useEffect, useState } from "react";

export default function AdminParts() {
	const [systems, setSystems] = useState<System[]>([]);
	const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
	const [fields, setFields] = useState<SystemField[]>([]);
	const [parts, setParts] = useState<Part[]>([]);
	const [editingPart, setEditingPart] = useState<Part | null>(null);
	const [formValues, setFormValues] = useState<Record<string, string>>({});
	const [showForm, setShowForm] = useState(false);

	useEffect(() => {
		fetch("/api/systems")
			.then((r) => r.json())
			.then((data) => setSystems(data.systems || []));
	}, []);

	useEffect(() => {
		if (!selectedSystem) return;
		fetch(`/api/systems?id=${selectedSystem}`)
			.then((r) => r.json())
			.then((data) => setFields(data.fields || []));
		fetch(`/api/parts?system_id=${selectedSystem}`)
			.then((r) => r.json())
			.then((data) => setParts(data.parts || []));
	}, [selectedSystem]);

	const resetForm = () => {
		setEditingPart(null);
		setFormValues({});
		setShowForm(false);
	};

	const handleEdit = async (part: Part) => {
		const res = await fetch(`/api/parts?id=${part.id}`);
		const data = await res.json();
		setEditingPart(part);
		const vals: Record<string, string> = {
			name: part.name,
			part_number: part.part_number || "",
			description: part.description || "",
		};
		for (const attr of data.attributes || []) {
			vals[attr.field_key] = attr.value || "";
		}
		setFormValues(vals);
		setShowForm(true);
	};

	const handleSave = async () => {
		if (!selectedSystem) return;
		const { name, part_number, description, ...attributes } = formValues;

		const body = {
			system_id: selectedSystem,
			name,
			part_number,
			description,
			attributes,
			...(editingPart ? { id: editingPart.id, active: 1 } : {}),
		};

		const res = await fetch("/api/parts", {
			method: editingPart ? "PUT" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (res.ok) {
			// Reload parts
			const partsRes = await fetch(`/api/parts?system_id=${selectedSystem}`);
			const partsData = await partsRes.json();
			setParts(partsData.parts || []);
			resetForm();
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Deactivate this part?")) return;
		await fetch("/api/parts", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
		});
		setParts((prev) => prev.filter((p) => p.id !== id));
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Parts Catalog</h2>
				{selectedSystem && (
					<button
						type="button"
						className="btn-primary"
						onClick={() => {
							resetForm();
							setShowForm(true);
						}}
					>
						+ Add Part
					</button>
				)}
			</div>

			{/* System selector */}
			<div className="card">
				<label htmlFor="system" className="form-label">
					Filter by System
				</label>
				<select
					id="system"
					className="form-select max-w-xs"
					value={selectedSystem || ""}
					onChange={(e) => setSelectedSystem(Number(e.target.value) || null)}
				>
					<option value="">Select system...</option>
					{systems.map((s) => (
						<option key={s.id} value={s.id}>
							{s.display_name}
						</option>
					))}
				</select>
			</div>

			{/* Add/Edit Form */}
			{showForm && selectedSystem && (
				<div className="card border-2 border-[var(--elward-blue)]">
					<h3 className="font-bold mb-4">
						{editingPart ? "Edit Part" : "Add Part"}
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						<div>
							<label className="form-label">Name *</label>
							<input
								type="text"
								className="form-input"
								value={formValues.name || ""}
								onChange={(e) =>
									setFormValues((v) => ({ ...v, name: e.target.value }))
								}
							/>
						</div>
						<div>
							<label className="form-label">Part Number</label>
							<input
								type="text"
								className="form-input"
								value={formValues.part_number || ""}
								onChange={(e) =>
									setFormValues((v) => ({ ...v, part_number: e.target.value }))
								}
							/>
						</div>
						<div>
							<label className="form-label">Description</label>
							<input
								type="text"
								className="form-input"
								value={formValues.description || ""}
								onChange={(e) =>
									setFormValues((v) => ({ ...v, description: e.target.value }))
								}
							/>
						</div>
						{fields.map((field) => (
							<div key={field.id}>
								<label className="form-label">{field.field_label}</label>
								<input
									type={field.field_type === "number" ? "number" : "text"}
									className="form-input"
									value={formValues[field.field_key] || ""}
									onChange={(e) =>
										setFormValues((v) => ({
											...v,
											[field.field_key]: e.target.value,
										}))
									}
								/>
							</div>
						))}
					</div>
					<div className="flex gap-2 mt-4">
						<button type="button" className="btn-primary" onClick={handleSave}>
							Save
						</button>
						<button type="button" className="btn-secondary" onClick={resetForm}>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Parts Table */}
			{selectedSystem && (
				<div className="card">
					{parts.length === 0 ? (
						<p className="text-gray-400 text-center py-8">
							No parts in this system yet
						</p>
					) : (
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b-2 border-gray-200">
									<th className="text-left py-2 px-2">Name</th>
									<th className="text-left py-2 px-2">Part #</th>
									<th className="text-left py-2 px-2">Description</th>
									<th className="text-right py-2 px-2">Actions</th>
								</tr>
							</thead>
							<tbody>
								{parts.map((part) => (
									<tr
										key={part.id}
										className="border-b border-gray-100 hover:bg-gray-50"
									>
										<td className="py-2 px-2 font-medium">{part.name}</td>
										<td className="py-2 px-2 text-gray-500">
											{part.part_number || "-"}
										</td>
										<td className="py-2 px-2 text-gray-500">
											{part.description || "-"}
										</td>
										<td className="py-2 px-2 text-right">
											<button
												type="button"
												className="text-blue-600 hover:underline text-xs mr-3"
												onClick={() => handleEdit(part)}
											>
												Edit
											</button>
											<button
												type="button"
												className="text-red-500 hover:underline text-xs"
												onClick={() => handleDelete(part.id)}
											>
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			)}
		</div>
	);
}
