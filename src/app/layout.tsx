import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Accessory List Builder | Elward Systems",
	description: "Build and manage accessory packing lists for job releases",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="min-h-screen">{children}</body>
		</html>
	);
}
