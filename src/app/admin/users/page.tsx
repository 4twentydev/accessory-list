"use client";

import { useEffect, useState } from "react";

interface UserRow {
	id: number;
	name: string;
	role: string;
	active: number;
}

export default function AdminUsers() {
	const [users, setUsers] = useState<UserRow[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [formData, setFormData] = useState({ name: "", pin: "", role: "pm" });

	const loadUsers = () => {
		fetch("/api/users")
			.then((r) => r.json())
			.then((data) => setUsers(data.users || []))
			.catch(() => {});
	};

	useEffect(() => {
		loadUsers();
	}, []);

	const handleSave = async () => {
		if (!formData.name) return;
		if (!editingId && !formData.pin) return;

		const res = await fetch("/api/users", {
			method: editingId ? "PUT" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				...(editingId ? { id: editingId } : {}),
				name: formData.name,
				pin: formData.pin || undefined,
				role: formData.role,
			}),
		});

		if (res.ok) {
			loadUsers();
			setShowForm(false);
			setEditingId(null);
			setFormData({ name: "", pin: "", role: "pm" });
		}
	};

	const handleEdit = (user: UserRow) => {
		setEditingId(user.id);
		setFormData({ name: user.name, pin: "", role: user.role });
		setShowForm(true);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Users</h2>
				<button
					type="button"
					className="btn-primary"
					onClick={() => {
						setEditingId(null);
						setFormData({ name: "", pin: "", role: "pm" });
						setShowForm(true);
					}}
				>
					+ Add User
				</button>
			</div>

			{showForm && (
				<div className="card border-2 border-[var(--elward-blue)]">
					<h3 className="font-bold mb-4">
						{editingId ? "Edit User" : "New User"}
					</h3>
					<div className="grid grid-cols-3 gap-4">
						<div>
							<label className="form-label">Name *</label>
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
							<label className="form-label">
								PIN {editingId ? "(leave blank to keep)" : "*"}
							</label>
							<input
								type="password"
								className="form-input"
								value={formData.pin}
								onChange={(e) =>
									setFormData((d) => ({ ...d, pin: e.target.value }))
								}
								maxLength={6}
								placeholder="4-6 digits"
							/>
						</div>
						<div>
							<label className="form-label">Role</label>
							<select
								className="form-select"
								value={formData.role}
								onChange={(e) =>
									setFormData((d) => ({ ...d, role: e.target.value }))
								}
							>
								<option value="pm">PM</option>
								<option value="admin">Admin</option>
								<option value="handler">Handler</option>
							</select>
						</div>
					</div>
					<div className="flex gap-2 mt-4">
						<button type="button" className="btn-primary" onClick={handleSave}>
							Save
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
				{users.length === 0 ? (
					<p className="text-gray-400 text-center py-8">No users found</p>
				) : (
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b-2 border-gray-200">
								<th className="text-left py-2 px-2">Name</th>
								<th className="text-left py-2 px-2">Role</th>
								<th className="text-left py-2 px-2">Status</th>
								<th className="text-right py-2 px-2">Actions</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr
									key={user.id}
									className="border-b border-gray-100 hover:bg-gray-50"
								>
									<td className="py-2 px-2 font-medium">{user.name}</td>
									<td className="py-2 px-2">
										<span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
											{user.role}
										</span>
									</td>
									<td className="py-2 px-2">
										{user.active ? (
											<span className="text-green-600 text-xs">Active</span>
										) : (
											<span className="text-red-500 text-xs">Inactive</span>
										)}
									</td>
									<td className="py-2 px-2 text-right">
										<button
											type="button"
											className="text-blue-600 hover:underline text-xs"
											onClick={() => handleEdit(user)}
										>
											Edit
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
