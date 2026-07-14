import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportColumn {
  header: string;
  dataKey: string;
}

/**
 * Export an array of objects to a PDF file using jsPDF + autoTable.
 *
 * @param title    - Title displayed on the PDF (e.g. "Parcelas")
 * @param columns  - Column definitions with header labels and data keys
 * @param data     - Array of objects to render as rows
 * @param filename - Output filename (without extension, e.g. "parcelas")
 */
export function exportTableToPDF<T extends Record<string, unknown>>(
  title: string,
  columns: ExportColumn[],
  data: T[],
  filename: string
): void {
  const doc = new jsPDF({ orientation: "landscape" });

  // Header: app name, title, date
  const today = new Date().toLocaleDateString("es-AR");
  doc.setFontSize(16);
  doc.text("Gestión Agrícola", 14, 20);
  doc.setFontSize(12);
  doc.text(title, 14, 28);
  doc.setFontSize(9);
  doc.text(`Generado: ${today}`, 14, 35);

  // Build autoTable rows
  const rows = data.map((item) =>
    columns.map((col) => {
      const val = item[col.dataKey];
      return val != null ? String(val) : "";
    })
  );

  autoTable(doc, {
    startY: 42,
    head: [columns.map((c) => c.header)],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [21, 128, 61], // green-700
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 253, 244], // green-50
    },
  });

  doc.save(`${filename}.pdf`);
}
