"use client";

import PinPad from "@/components/pin-pad";
import { useRouter } from "next/navigation";

export default function LockPage() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
			<div className="card w-full max-w-sm">
				<PinPad
					onSuccess={() => {
						router.push("/");
					}}
				/>
			</div>
		</div>
	);
}
