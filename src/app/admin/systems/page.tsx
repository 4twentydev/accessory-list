"use client";

import type { System, SystemField } from "@/types";
import { useEffect, useState } from "react";

export default function AdminSystems() {
	const [systems, setSystems] = useState<System[]>([]);
	const [editing, setEditing] = useState<System | null>(null);
	const [fields, setFields] = useState<Partial<SystemField>[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		display_name: "",
		description: "",
	});

	useEffect(() => {
		loadSystems();
	}, []);

	const loadSystems = () => {
		fetch("/api/systems")
			.then((r) => r.json())
			.then((data) => setSystems(data.systems || []));
	};

	const handleEdit = async (system: System) => {
		const res = await fetch(`/api/systems?id=${system.id}`);
		const data = await res.json();
		setEditing(system);
		setFormData({
			name: system.name,
			display_name: system.display_name,
			description: system.description || "",
		});
		setFields(data.fields || []);
		setShowForm(true);
	};

	const handleNew = () => {
		setEditing(null);
		setFormData({ name: "", display_name: "", description: "" });
		setFields([]);
		setShowForm(true);
	};

	const addField = () => {
		setFields((prev) => [
			...prev,
			{
				field_key: "",
				field_label: "",
				field_type: "text",
				required: 0,
				options: null,
			},
		]);
	};

	const removeField = (idx: number) => {
		setFields((prev) => prev.filter((_, i) => i !== idx));
	};

	const updateField = (idx: number, key: string, value: string | number) => {
		setFields((prev) =>
			prev.map((f, i) => (i === idx ? { ...f, [key]: value } : f)),
		);
	};

	const handleSave = async () => {
		const body = {
			...formData,
			...(editing ? { id: editing.id, active: 1 } : {}),
			fields: fields.map((f) => ({
				field_key:
					f.field_key ||
					f.field_label?.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
				field_label: f.field_label,
				field_type: f.field_type || "text",
				required: f.required || 0,
				options: f.options,
				include_on_pdf: 1,
				include_image: 0,
			})),
		};

		const res = await fetch("/api/systems", {
			method: editing ? "PUT" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (res.ok) {
			loadSystems();
			setShowForm(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Systems</h2>
				<button type="button" className="btn-primary" onClick={handleNew}>
					+ Add System
				</button>
			</div>

			{showForm && (
				<div className="card border-2 border-[var(--elward-blue)]">
					<h3 className="font-bold mb-4">
						{editing ? "Edit System" : "New System"}
					</h3>
					<div className="grid grid-cols-3 gap-4 mb-6">
						<div>
							<label className="form-label">Code *</label>
							<input
								type="text"
								className="form-input"
								value={formData.name}
								onChange={(e) =>
									setFormData((d) => ({ ...d, name: e.target.value }))
								}
							/>
						</div>
						<div>
							<label className="form-label">Display Name *</label>
							<input
								type="text"
								className="form-input"
								value={formData.display_name}
								onChange={(e) =>
									setFormData((d) => ({ ...d, display_name: e.target.value }))
								}
							/>
						</div>
						<div>
							<label className="form-label">Description</label>
							<input
								type="text"
								className="form-input"
								value={formData.description}
								onChange={(e) =>
									setFormData((d) => ({ ...d, description: e.target.value }))
								}
							/>
						</div>
					</div>

					<h4 className="font-bold mb-2">Fields</h4>
					<div className="space-y-2 mb-4">
						{fields.map((field, idx) => (
							<div key={`field-${idx}`} className="flex gap-2 items-center">
								<input
									type="text"
									placeholder="Label"
									className="form-input flex-1"
									value={field.field_label || ""}
									onChange={(e) =>
										updateField(idx, "field_label", e.target.value)
									}
								/>
								<input
									type="text"
									placeholder="Key"
									className="form-input w-32"
									value={field.field_key || ""}
									onChange={(e) =>
										updateField(idx, "field_key", e.target.value)
									}
								/>
								<select
									className="form-select w-32"
									value={field.field_type || "text"}
									onChange={(e) =>
										updateField(idx, "field_type", e.target.value)
									}
								>
									<option value="text">Text</option>
									<option value="number">Number</option>
									<option value="select">Select</option>
									<option value="autocomplete">Autocomplete</option>
									<option value="textarea">Textarea</option>
								</select>
								<input
									type="text"
									placeholder='Options (JSON: ["a","b"])'
									className="form-input w-48"
									value={field.options || ""}
									onChange={(e) => updateField(idx, "options", e.target.value)}
								/>
								<label className="flex items-center gap-1 text-xs whitespace-nowrap">
									<input
										type="checkbox"
										checked={!!field.required}
										onChange={(e) =>
											updateField(idx, "required", e.target.checked ? 1 : 0)
										}
									/>
									Req
								</label>
								<button
									type="button"
									className="text-red-500 hover:text-red-700 text-sm"
									onClick={() => removeField(idx)}
								>
									X
								</button>
							</div>
						))}
					</div>
					<button
						type="button"
						className="btn-secondary text-xs mb-4"
						onClick={addField}
					>
						+ Add Field
					</button>

					<div className="flex gap-2 border-t pt-4">
						<button type="button" className="btn-primary" onClick={handleSave}>
							Save System
						</button>
						<button
							type="button"
							className="btn-secondary"
							onClick={() => setShowForm(false)}
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			<div className="card">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b-2 border-gray-200">
							<th className="text-left py-2 px-2">Code</th>
							<th className="text-left py-2 px-2">Display Name</th>
							<th className="text-left py-2 px-2">Description</th>
							<th className="text-right py-2 px-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						{systems.map((system) => (
							<tr
								key={system.id}
								className="border-b border-gray-100 hover:bg-gray-50"
							>
								<td className="py-2 px-2 font-mono font-bold">{system.name}</td>
								<td className="py-2 px-2">{system.display_name}</td>
								<td className="py-2 px-2 text-gray-500">
									{system.description || "-"}
								</td>
								<td className="py-2 px-2 text-right">
									<button
										type="button"
										className="text-blue-600 hover:underline text-xs"
										onClick={() => handleEdit(system)}
									>
										Edit
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
