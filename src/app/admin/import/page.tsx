"use client";

import type { System } from "@/types";
import { useState } from "react";
import { useEffect } from "react";

export default function AdminImport() {
	const [systems, setSystems] = useState<System[]>([]);
	const [selectedSystem, setSelectedSystem] = useState<number | null>(null);
	const [csvText, setCsvText] = useState("");
	const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
	const [headers, setHeaders] = useState<string[]>([]);
	const [importing, setImporting] = useState(false);
	const [result, setResult] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/systems")
			.then((r) => r.json())
			.then((data) => setSystems(data.systems || []));
	}, []);

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const text = event.target?.result as string;
			setCsvText(text);
			parseCSV(text);
		};
		reader.readAsText(file);
	};

	const parseCSV = (text: string) => {
		const lines = text.trim().split("\n");
		if (lines.length < 2) return;

		const headerLine = lines[0]
			.split(",")
			.map((h) => h.trim().replace(/^"|"$/g, ""));
		setHeaders(headerLine);

		const rows: Record<string, string>[] = [];
		for (let i = 1; i < lines.length; i++) {
			const values = lines[i]
				.split(",")
				.map((v) => v.trim().replace(/^"|"$/g, ""));
			const row: Record<string, string> = {};
			for (let j = 0; j < headerLine.length; j++) {
				row[headerLine[j]] = values[j] || "";
			}
			rows.push(row);
		}
		setParsedRows(rows);
	};

	const handleImport = async () => {
		if (!selectedSystem || parsedRows.length === 0) return;
		setImporting(true);
		setResult(null);

		try {
			const res = await fetch("/api/import", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					system_id: selectedSystem,
					rows: parsedRows,
				}),
			});
			const data = await res.json();
			setResult(`Successfully imported ${data.imported} parts`);
			setParsedRows([]);
			setCsvText("");
			setHeaders([]);
		} catch {
			setResult("Import failed");
		} finally {
			setImporting(false);
		}
	};

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">Import Parts</h2>

			<div className="card">
				<div className="grid grid-cols-2 gap-4 mb-4">
					<div>
						<label className="form-label">Target System *</label>
						<select
							className="form-select"
							value={selectedSystem || ""}
							onChange={(e) =>
								setSelectedSystem(Number(e.target.value) || null)
							}
						>
							<option value="">Select system...</option>
							{systems.map((s) => (
								<option key={s.id} value={s.id}>
									{s.display_name}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="form-label">Upload CSV File</label>
						<input
							type="file"
							accept=".csv,.txt"
							className="form-input"
							onChange={handleFileUpload}
						/>
					</div>
				</div>

				<div>
					<label className="form-label">Or paste CSV data</label>
					<textarea
						className="form-input font-mono text-xs"
						rows={6}
						value={csvText}
						onChange={(e) => {
							setCsvText(e.target.value);
							if (e.target.value.trim()) parseCSV(e.target.value);
						}}
						placeholder="name,part_number,description&#10;Widget A,W-001,A small widget"
					/>
				</div>
			</div>

			{/* Preview */}
			{parsedRows.length > 0 && (
				<div className="card">
					<h3 className="font-bold mb-2">Preview ({parsedRows.length} rows)</h3>
					<div className="overflow-x-auto">
						<table className="w-full text-xs">
							<thead>
								<tr className="border-b-2 border-gray-200">
									{headers.map((h) => (
										<th key={h} className="text-left py-1 px-2">
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{parsedRows.slice(0, 10).map((row, idx) => (
									<tr key={`row-${idx}`} className="border-b border-gray-100">
										{headers.map((h) => (
											<td key={`${idx}-${h}`} className="py-1 px-2">
												{row[h]}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
						{parsedRows.length > 10 && (
							<p className="text-gray-400 text-xs mt-2">
								...and {parsedRows.length - 10} more rows
							</p>
						)}
					</div>

					<button
						type="button"
						className="btn-primary mt-4"
						onClick={handleImport}
						disabled={!selectedSystem || importing}
					>
						{importing ? "Importing..." : `Import ${parsedRows.length} Parts`}
					</button>
				</div>
			)}

			{result && (
				<div className="card bg-green-50 border-green-200">
					<p className="text-green-800 font-medium">{result}</p>
				</div>
			)}
		</div>
	);
}
