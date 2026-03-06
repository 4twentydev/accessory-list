"use client";

import type { SystemField } from "@/types";
import { useCallback, useEffect, useState } from "react";

interface DynamicFormProps {
	systemId: number;
	fields: SystemField[];
	onAddItem: (values: Record<string, string>) => void;
}

export default function DynamicForm({
	systemId,
	fields,
	onAddItem,
}: DynamicFormProps) {
	const [values, setValues] = useState<Record<string, string>>({});
	const [fieldOptions, setFieldOptions] = useState<Record<string, string[]>>(
		{},
	);
	const [autocompleteResults, setAutocompleteResults] = useState<
		Record<string, string[]>
	>({});

	// Load dynamic dropdown options from the parts catalog
	useEffect(() => {
		const loadOptions = async () => {
			const opts: Record<string, string[]> = {};
			for (const field of fields) {
				if (
					field.field_type === "select" ||
					field.field_type === "autocomplete"
				) {
					// If field has static options, use those
					if (field.options) {
						try {
							opts[field.field_key] = JSON.parse(field.options);
						} catch {
							opts[field.field_key] = [];
						}
					}
					// Also fetch dynamic options from parts catalog
					try {
						const res = await fetch(
							`/api/parts?system_id=${systemId}&field_key=${field.field_key}`,
						);
						const data = await res.json();
						if (data.values?.length) {
							const existing = opts[field.field_key] || [];
							const merged = [...new Set([...existing, ...data.values])];
							opts[field.field_key] = merged;
						}
					} catch {}
				}
			}
			setFieldOptions(opts);
		};
		loadOptions();
	}, [systemId, fields]);

	// Reset form when system changes
	useEffect(() => {
		const defaults: Record<string, string> = {};
		for (const field of fields) {
			defaults[field.field_key] = field.default_value || "";
		}
		setValues(defaults);
	}, [fields]);

	const handleChange = (key: string, value: string) => {
		setValues((prev) => ({ ...prev, [key]: value }));
	};

	const handleAutocomplete = useCallback(
		async (key: string, value: string) => {
			handleChange(key, value);
			if (value.length < 2) {
				setAutocompleteResults((prev) => ({ ...prev, [key]: [] }));
				return;
			}
			try {
				const res = await fetch(
					`/api/parts?system_id=${systemId}&search=${encodeURIComponent(value)}`,
				);
				const data = await res.json();
				const names = data.parts?.map((p: { name: string }) => p.name) || [];
				setAutocompleteResults((prev) => ({ ...prev, [key]: names }));
			} catch {
				setAutocompleteResults((prev) => ({ ...prev, [key]: [] }));
			}
		},
		[systemId],
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Validate required fields
		for (const field of fields) {
			if (field.required && !values[field.field_key]) {
				return;
			}
		}
		onAddItem(values);
		// Reset form
		const defaults: Record<string, string> = {};
		for (const field of fields) {
			defaults[field.field_key] = field.default_value || "";
		}
		setValues(defaults);
		setAutocompleteResults({});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{fields.map((field) => (
					<div key={field.id}>
						<label htmlFor={field.field_key} className="form-label">
							{field.field_label}
							{field.required ? (
								<span className="text-red-500 ml-1">*</span>
							) : null}
						</label>

						{field.field_type === "select" && (
							<select
								id={field.field_key}
								className="form-select"
								value={values[field.field_key] || ""}
								onChange={(e) => handleChange(field.field_key, e.target.value)}
								required={!!field.required}
							>
								<option value="">Select...</option>
								{(fieldOptions[field.field_key] || []).map((opt) => (
									<option key={opt} value={opt}>
										{opt}
									</option>
								))}
							</select>
						)}

						{field.field_type === "autocomplete" && (
							<div className="relative">
								<input
									id={field.field_key}
									type="text"
									className="form-input"
									value={values[field.field_key] || ""}
									onChange={(e) =>
										handleAutocomplete(field.field_key, e.target.value)
									}
									required={!!field.required}
									autoComplete="off"
								/>
								{autocompleteResults[field.field_key]?.length > 0 && (
									<div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
										{autocompleteResults[field.field_key].map((name) => (
											<button
												key={name}
												type="button"
												className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
												onClick={() => {
													handleChange(field.field_key, name);
													setAutocompleteResults((prev) => ({
														...prev,
														[field.field_key]: [],
													}));
												}}
											>
												{name}
											</button>
										))}
									</div>
								)}
							</div>
						)}

						{field.field_type === "text" && (
							<input
								id={field.field_key}
								type="text"
								className="form-input"
								value={values[field.field_key] || ""}
								onChange={(e) => handleChange(field.field_key, e.target.value)}
								required={!!field.required}
							/>
						)}

						{field.field_type === "number" && (
							<input
								id={field.field_key}
								type="number"
								className="form-input"
								value={values[field.field_key] || ""}
								onChange={(e) => handleChange(field.field_key, e.target.value)}
								required={!!field.required}
								min="0"
							/>
						)}

						{field.field_type === "textarea" && (
							<textarea
								id={field.field_key}
								className="form-input"
								rows={2}
								value={values[field.field_key] || ""}
								onChange={(e) => handleChange(field.field_key, e.target.value)}
								required={!!field.required}
							/>
						)}
					</div>
				))}
			</div>

			<button type="submit" className="btn-primary">
				+ Add to List
			</button>
		</form>
	);
}
