import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";

export interface Column {
  key: string;
  label: string;
  width?: number;
}

export function toCSV(columns: Column[], rows: Record<string, unknown>[]): string {
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((r) => Object.fromEntries(columns.map((c) => [c.label, r[c.key] ?? ""]))),
    { header: columns.map((c) => c.label) }
  );
  return XLSX.utils.sheet_to_csv(sheet);
}

export function toXLSX(columns: Column[], rows: Record<string, unknown>[]): Buffer {
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((r) => Object.fromEntries(columns.map((c) => [c.label, r[c.key] ?? ""]))),
    { header: columns.map((c) => c.label) }
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Report");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/** Renders a simple title + table PDF. Good enough for record-keeping reports, not pixel-perfect design. */
export function toPDF(
  title: string,
  columns: Column[],
  rows: Record<string, unknown>[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text(title, { align: "left" });
    doc.moveDown();
    doc.fontSize(9).fillColor("#666").text(`Generated ${new Date().toLocaleString()}`);
    doc.moveDown();

    const colWidth = (doc.page.width - 80) / columns.length;
    let y = doc.y;

    doc.fontSize(10).fillColor("#000");
    columns.forEach((c, i) =>
      doc.text(c.label, 40 + i * colWidth, y, { width: colWidth, continued: false })
    );
    y += 18;
    doc
      .moveTo(40, y - 4)
      .lineTo(doc.page.width - 40, y - 4)
      .stroke();

    rows.forEach((row) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }
      columns.forEach((c, i) => {
        doc.text(String(row[c.key] ?? ""), 40 + i * colWidth, y, { width: colWidth });
      });
      y += 16;
    });

    doc.end();
  });
}

export function sendFile(
  res: import("express").Response,
  format: "csv" | "xlsx" | "pdf",
  filename: string,
  content: string | Buffer
) {
  const contentTypes = {
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pdf: "application/pdf",
  };
  res.setHeader("Content-Type", contentTypes[format]);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.${format}"`);
  res.send(content);
}
