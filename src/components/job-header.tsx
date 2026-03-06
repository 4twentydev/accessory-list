"use client";

import type { JobHeader } from "@/types";

interface JobHeaderProps {
	header: JobHeader;
	onChange: (header: JobHeader) => void;
}

export default function JobHeaderForm({ header, onChange }: JobHeaderProps) {
	const handleChange = (field: keyof JobHeader, value: string) => {
		onChange({ ...header, [field]: value });
	};

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<div>
				<label htmlFor="jobNumber" className="form-label">
					Job Number <span className="text-red-500">*</span>
				</label>
				<input
					id="jobNumber"
					type="text"
					className="form-input"
					value={header.jobNumber}
					onChange={(e) => handleChange("jobNumber", e.target.value)}
					required
					placeholder="e.g. 2024-001"
				/>
			</div>
			<div>
				<label htmlFor="customerName" className="form-label">
					Customer Name
				</label>
				<input
					id="customerName"
					type="text"
					className="form-input"
					value={header.customerName}
					onChange={(e) => handleChange("customerName", e.target.value)}
				/>
			</div>
			<div>
				<label htmlFor="pmName" className="form-label">
					PM Name
				</label>
				<input
					id="pmName"
					type="text"
					className="form-input"
					value={header.pmName}
					onChange={(e) => handleChange("pmName", e.target.value)}
				/>
			</div>
			<div>
				<label htmlFor="date" className="form-label">
					Date
				</label>
				<input
					id="date"
					type="date"
					className="form-input"
					value={header.date}
					onChange={(e) => handleChange("date", e.target.value)}
				/>
			</div>
			<div className="sm:col-span-2 lg:col-span-4">
				<label htmlFor="shipToAddress" className="form-label">
					Ship-to Address
				</label>
				<textarea
					id="shipToAddress"
					className="form-input"
					rows={2}
					value={header.shipToAddress}
					onChange={(e) => handleChange("shipToAddress", e.target.value)}
				/>
			</div>
		</div>
	);
}
