export interface System {
	id: number;
	name: string;
	display_name: string;
	description: string | null;
	sort_order: number;
	active: number;
}

export interface SystemField {
	id: number;
	system_id: number;
	field_key: string;
	field_label: string;
	field_type: "text" | "number" | "select" | "autocomplete" | "textarea";
	required: number;
	sort_order: number;
	options: string | null;
	default_value: string | null;
	include_on_pdf: number;
	include_image: number;
}

export interface Part {
	id: number;
	system_id: number;
	part_number: string | null;
	name: string;
	description: string | null;
	image_path: string | null;
	active: number;
	created_at: string;
	updated_at: string;
}

export interface PartAttribute {
	id: number;
	part_id: number;
	field_id: number;
	value: string | null;
}

export interface AccessoryList {
	id: number;
	job_number: string;
	customer_name: string | null;
	ship_to_address: string | null;
	system_id: number;
	created_by: string;
	status: "draft" | "submitted" | "printed" | "shipped";
	notes: string | null;
	created_at: string;
	updated_at: string;
}

export interface AccessoryListItem {
	id: number;
	list_id: number;
	part_id: number;
	quantity: number;
	notes: string | null;
	sort_order: number;
	field_values: string | null;
}

export interface User {
	id: number;
	name: string;
	pin_hash: string;
	role: "pm" | "admin" | "handler";
	active: number;
}

export interface LineItem {
	tempId: string;
	systemId: number;
	systemName: string;
	partId?: number;
	partName: string;
	description?: string;
	quantity: number;
	unit?: string;
	notes?: string;
	fieldValues: Record<string, string>;
}

export interface JobHeader {
	jobNumber: string;
	customerName: string;
	shipToAddress: string;
	pmName: string;
	date: string;
}
