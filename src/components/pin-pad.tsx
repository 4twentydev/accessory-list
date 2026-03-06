"use client";

import { useState } from "react";

export default function PinPad({
	onSuccess,
}: { onSuccess: (user: { id: number; name: string; role: string }) => void }) {
	const [pin, setPin] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleDigit = (digit: string) => {
		if (pin.length < 6) {
			setPin((prev) => prev + digit);
			setError("");
		}
	};

	const handleClear = () => {
		setPin("");
		setError("");
	};

	const handleBackspace = () => {
		setPin((prev) => prev.slice(0, -1));
	};

	const handleSubmit = async () => {
		if (pin.length < 4) {
			setError("PIN must be at least 4 digits");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pin }),
			});
			const data = await res.json();
			if (res.ok) {
				onSuccess(data.user);
			} else {
				setError(data.error || "Invalid PIN");
				setPin("");
			}
		} catch {
			setError("Connection error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center gap-6">
			<div className="text-center">
				<h1 className="text-2xl font-bold text-[var(--elward-navy)]">
					Elward Systems
				</h1>
				<p className="text-sm text-gray-500 mt-1">Accessory List Builder</p>
			</div>

			<div className="flex gap-2 h-12 items-center">
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={`dot-${i}`}
						className={`w-4 h-4 rounded-full border-2 transition-all ${
							i < pin.length
								? "bg-[var(--elward-navy)] border-[var(--elward-navy)]"
								: "border-gray-300"
						}`}
					/>
				))}
			</div>

			{error && <p className="text-red-500 text-sm">{error}</p>}

			<div className="grid grid-cols-3 gap-3">
				{["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
					<button
						key={digit}
						type="button"
						className="pin-pad-btn"
						onClick={() => handleDigit(digit)}
						disabled={loading}
					>
						{digit}
					</button>
				))}
				<button
					type="button"
					className="pin-pad-btn text-base"
					onClick={handleClear}
					disabled={loading}
				>
					CLR
				</button>
				<button
					type="button"
					className="pin-pad-btn"
					onClick={() => handleDigit("0")}
					disabled={loading}
				>
					0
				</button>
				<button
					type="button"
					className="pin-pad-btn text-base"
					onClick={handleBackspace}
					disabled={loading}
				>
					DEL
				</button>
			</div>

			<button
				type="button"
				className="btn-primary w-full max-w-[220px] py-3 text-lg"
				onClick={handleSubmit}
				disabled={loading || pin.length < 4}
			>
				{loading ? "Verifying..." : "Enter"}
			</button>
		</div>
	);
}
