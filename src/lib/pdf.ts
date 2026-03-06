import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PdfListData {
	jobNumber: string;
	customerName: string;
	shipToAddress: string;
	pmName: string;
	date: string;
	notes?: string;
	items: Array<{
		partName: string;
		description?: string;
		systemName: string;
		quantity: number;
		unit?: string;
		notes?: string;
		fieldValues?: Record<string, string>;
	}>;
}

export function generatePackingListPdf(data: PdfListData): Uint8Array {
	const doc = new jsPDF({
		orientation: "portrait",
		unit: "pt",
		format: "letter",
	});
	const pageWidth = doc.internal.pageSize.getWidth();
	const margin = 40;

	// Header
	doc.setFontSize(18);
	doc.setFont("helvetica", "bold");
	doc.text("ELWARD SYSTEMS CORPORATION", margin, 50);
	doc.setFontSize(10);
	doc.setFont("helvetica", "normal");
	doc.text("Architectural Cladding & Facade Systems", margin, 65);

	doc.setFontSize(14);
	doc.setFont("helvetica", "bold");
	doc.text("PACKING LIST", pageWidth - margin, 50, { align: "right" });

	// Job info box
	const infoY = 85;
	doc.setFontSize(9);
	doc.setFont("helvetica", "bold");
	doc.text("Job Number:", margin, infoY);
	doc.text("Customer:", margin, infoY + 14);
	doc.text("Ship To:", margin, infoY + 28);
	doc.text("PM:", pageWidth / 2, infoY);
	doc.text("Date:", pageWidth / 2, infoY + 14);

	doc.setFont("helvetica", "normal");
	doc.text(data.jobNumber, margin + 65, infoY);
	doc.text(data.customerName || "N/A", margin + 55, infoY + 14);
	doc.text(data.shipToAddress || "N/A", margin + 45, infoY + 28);
	doc.text(data.pmName || "N/A", pageWidth / 2 + 25, infoY);
	doc.text(data.date, pageWidth / 2 + 35, infoY + 14);

	// Divider
	doc.setDrawColor(0);
	doc.setLineWidth(0.5);
	doc.line(margin, infoY + 42, pageWidth - margin, infoY + 42);

	// Items table
	const tableData = data.items.map((item, idx) => {
		const fields = item.fieldValues
			? Object.entries(item.fieldValues)
					.filter(([, v]) => v)
					.map(([k, v]) => `${k}: ${v}`)
					.join(", ")
			: "";
		return [
			String(idx + 1),
			item.partName,
			item.description || fields || "",
			item.systemName,
			String(item.quantity),
			item.unit || "EA",
			item.notes || "",
		];
	});

	autoTable(doc, {
		startY: infoY + 52,
		head: [["#", "Part Name", "Description", "System", "Qty", "Unit", "Notes"]],
		body: tableData,
		margin: { left: margin, right: margin },
		styles: { fontSize: 8, cellPadding: 4 },
		headStyles: { fillColor: [41, 50, 65], textColor: 255, fontStyle: "bold" },
		columnStyles: {
			0: { cellWidth: 25 },
			1: { cellWidth: 120 },
			2: { cellWidth: 140 },
			3: { cellWidth: 60 },
			4: { cellWidth: 35, halign: "center" },
			5: { cellWidth: 35, halign: "center" },
			6: { cellWidth: 80 },
		},
		alternateRowStyles: { fillColor: [245, 245, 245] },
	});

	// Footer on each page
	const totalPages = doc.getNumberOfPages();
	for (let i = 1; i <= totalPages; i++) {
		doc.setPage(i);
		const pageHeight = doc.internal.pageSize.getHeight();

		doc.setDrawColor(0);
		doc.setLineWidth(0.5);
		doc.line(margin, pageHeight - 80, pageWidth - margin, pageHeight - 80);

		doc.setFontSize(8);
		doc.setFont("helvetica", "normal");
		doc.text(`Packed by: ${"_".repeat(30)}`, margin, pageHeight - 60);
		doc.text(`Checked by: ${"_".repeat(30)}`, pageWidth / 2, pageHeight - 60);
		doc.text(`Date: ${"_".repeat(20)}`, margin, pageHeight - 45);

		doc.text(
			`Page ${i} of ${totalPages}`,
			pageWidth - margin,
			pageHeight - 30,
			{ align: "right" },
		);
		doc.text("Elward Systems Corporation", margin, pageHeight - 30);
	}

	return new Uint8Array(doc.output("arraybuffer"));
}
