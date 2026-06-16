import fs from "node:fs";
import path from "node:path";
import type { Invoice, PurchaseItem } from "../src/types.js";

const PDF_WIDTH = 612;
const PDF_HEIGHT = 792;
const MARGIN = 56;
const MAX_ITEMS = 18;

interface PdfText {
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

interface PdfLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function createInvoicePdf(
  invoice: Invoice,
  items: PurchaseItem[] = invoice.items ?? [],
): Buffer {
  const paymentDate = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : invoice.date;
  const money = invoice.amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
  const tableItems = items.slice(0, MAX_ITEMS);

  const texts: PdfText[] = [];
  const lines: PdfLine[] = [];
  let y = PDF_HEIGHT - 56;

  addText(texts, MARGIN, y, "Invoice", 22);
  y -= 32;
  addText(texts, MARGIN, y, `Invoice ID: ${invoice.id}`, 12);
  y -= 18;
  addText(texts, MARGIN, y, `Vendor: ${invoice.vendorName}`, 12);
  y -= 18;
  addText(texts, MARGIN, y, `Invoice date: ${invoice.date}`, 12);
  y -= 18;
  addText(texts, MARGIN, y, `Payment date: ${paymentDate}`, 12);
  y -= 18;
  addText(texts, MARGIN, y, `Amount paid: ${money}`, 12);
  y -= 18;
  if (invoice.dueDate) {
    addText(texts, MARGIN, y, `Due date: ${invoice.dueDate}`, 12);
    y -= 28;
  } else {
    y -= 20;
  }

  addText(texts, MARGIN, y, "Product", 11);
  addText(texts, 250, y, "Qty", 11);
  addText(texts, 330, y, "Unit Price", 11);
  addText(texts, 455, y, "Total", 11);
  y -= 4;
  lines.push({ x1: MARGIN, y1: y, x2: PDF_WIDTH - MARGIN, y2: y });
  y -= 18;

  for (const item of tableItems) {
    const lineTotal = item.price * item.quantity;
    addText(texts, MARGIN, y, item.name, 11);
    addText(texts, 250, y, String(item.quantity), 11);
    addText(texts, 330, y, moneyValue(item.price), 11);
    addText(texts, 455, y, moneyValue(lineTotal), 11);
    y -= 16;
  }

  if (items.length > MAX_ITEMS) {
    addText(
      texts,
      MARGIN,
      y,
      `Additional ${items.length - MAX_ITEMS} item(s) omitted from this PDF summary.`,
      10,
    );
    y -= 18;
  }

  if (tableItems.length === 0) {
    addText(
      texts,
      MARGIN,
      y,
      "No product line items were included with this invoice.",
      11,
    );
    y -= 18;
  }

  lines.push({ x1: MARGIN, y1: y, x2: PDF_WIDTH - MARGIN, y2: y });
  y -= 24;
  addText(texts, MARGIN, y, `Total: ${money}`, 12);

  const content = buildPdfContent(texts, lines);
  return buildPdfDocument(content);
}

export function writeInvoicePdf(
  invoice: Invoice,
  items: PurchaseItem[] = invoice.items ?? [],
  directory = path.join(process.cwd(), "server/uploads/invoices"),
): string {
  fs.mkdirSync(directory, { recursive: true });
  const filePath = path.join(directory, `${invoice.id}.pdf`);
  fs.writeFileSync(filePath, createInvoicePdf(invoice, items));
  return filePath;
}

function addText(
  texts: PdfText[],
  x: number,
  y: number,
  text: string,
  fontSize: number,
) {
  texts.push({ x, y, text, fontSize });
}

function moneyValue(value: number): string {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function escapePdfText(value: unknown): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ");
}

function buildPdfContent(texts: PdfText[], lines: PdfLine[]): string {
  const textObjects = texts
    .map(
      (text) =>
        `BT /F1 ${text.fontSize} Tf ${text.x.toFixed(2)} ${text.y.toFixed(2)} Td (${escapePdfText(text.text)}) Tj ET`,
    )
    .join("\n");

  const lineObjects = lines
    .map(
      (line) =>
        `${line.x1.toFixed(2)} ${line.y1.toFixed(2)} m ${line.x2.toFixed(2)} ${line.y2.toFixed(2)} l S`,
    )
    .join("\n");

  return [textObjects, lineObjects].filter(Boolean).join("\n");
}

function buildPdfDocument(content: string): Buffer {
  const objects: string[] = [];
  const offsets: number[] = [0];

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj`,
  );
  objects.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
  );
  objects.push(
    `5 0 obj\n<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream\nendobj`,
  );

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}
