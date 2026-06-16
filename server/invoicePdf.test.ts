import { describe, expect, it } from "vitest";
import { createInvoicePdf } from "./invoicePdf.js";
import type { Invoice } from "../src/types.js";

describe("createInvoicePdf", () => {
  it("creates a PDF buffer with invoice, payment, amount, and product details", () => {
    const invoice: Invoice = {
      id: "INV-123456",
      vendorId: "techflow",
      vendorName: "TechFlow",
      amount: 150,
      date: "2026-06-16",
      dueDate: "2026-07-16",
      paidAt: "2026-06-16T12:00:00.000Z",
      status: "Paid",
      purchaseRequestId: "PRQ-001",
      billId: "BILL-001",
      items: [{ name: "Widget", price: 50, quantity: 3 }],
    };

    const pdf = createInvoicePdf(invoice);
    const text = pdf.toString("utf8");

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(text).toContain("Invoice ID: INV-123456");
    expect(text).toContain("Vendor: TechFlow");
    expect(text).toContain("Payment date: Jun 16, 2026");
    expect(text).toContain("Amount paid: $150.00");
    expect(text).toContain("Due date: 2026-07-16");
    expect(text).toContain("Widget");
    expect(text).toContain("Total: $150.00");
  });
});
