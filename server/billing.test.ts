import { describe, it, expect } from "vitest";
import {
  buildBillFromPurchase,
  buildInvoiceFromBill,
  buildBillPaidUpdate,
} from "./billing.js";

describe("buildBillFromPurchase", () => {
  it("creates due bill from delivered purchase", () => {
    const bill = buildBillFromPurchase(
      {
        id: "PRQ-001",
        vendorId: "techflow",
        vendorName: "TechFlow",
        date: "2026-06-01",
        items: [{ name: "Widget", price: 50, quantity: 2 }],
        totalAmount: 100,
        dueDate: "2026-07-01",
        status: "Delivered",
      },
      "BILL-001",
    );

    expect(bill.status).toBe("Due");
    expect(bill.amount).toBe(100);
    expect(bill.dueDate).toBe("2026-07-01");
    expect(bill.items).toEqual([{ name: "Widget", price: 50, quantity: 2 }]);
    expect(bill.purchaseRequestId).toBe("PRQ-001");
    expect(bill.invoiceId).toBe("");
    expect(bill.stripePaymentIntentId).toBe("");
    expect(bill.paidAt).toBeUndefined();
  });
});

describe("buildInvoiceFromBill", () => {
  it("creates paid invoice linked to bill", () => {
    const invoice = buildInvoiceFromBill(
      {
        id: "BILL-001",
        purchaseRequestId: "PRQ-001",
        vendorId: "techflow",
        vendorName: "TechFlow",
        amount: 100,
        date: "2026-06-01",
        dueDate: "2026-07-01",
        items: [{ name: "Widget", price: 50, quantity: 2 }],
        status: "Due",
      },
      "INV-001",
    );

    expect(invoice.status).toBe("Paid");
    expect(invoice.dueDate).toBe("2026-07-01");
    expect(invoice.items).toEqual([{ name: "Widget", price: 50, quantity: 2 }]);
    expect(invoice.billId).toBe("BILL-001");
    expect(invoice.purchaseRequestId).toBe("PRQ-001");
    expect(invoice.paidAt).toBeDefined();
    expect(new Date(invoice.paidAt).toISOString()).toBe(invoice.paidAt);
  });

  it("uses current date for paidAt even when bill paidAt is empty", () => {
    const billWithEmptyPaidAt = {
      id: "BILL-002",
      purchaseRequestId: "PRQ-002",
      vendorId: "techflow",
      vendorName: "TechFlow",
      amount: 200,
      date: "2026-06-01",
      dueDate: "2026-07-01",
      items: [{ name: "Gadget", price: 100, quantity: 2 }],
      status: "Due",
      paidAt: "",
    };
    const invoice = buildInvoiceFromBill(billWithEmptyPaidAt, "INV-002");

    expect(invoice.status).toBe("Paid");
    expect(invoice.paidAt).toBeDefined();
    expect(invoice.paidAt).not.toBe("");
    expect(new Date(invoice.paidAt).getTime()).not.toBeNaN();
  });

  it("preserves valid paidAt from bill when present", () => {
    const existingPaidAt = "2026-06-15T12:30:00.000Z";
    const billWithExistingPaidAt = {
      id: "BILL-003",
      purchaseRequestId: "PRQ-003",
      vendorId: "techflow",
      vendorName: "TechFlow",
      amount: 300,
      date: "2026-06-01",
      dueDate: "2026-07-01",
      items: [{ name: "Thing", price: 150, quantity: 2 }],
      status: "Due",
      paidAt: existingPaidAt,
    };
    const invoice = buildInvoiceFromBill(billWithExistingPaidAt, "INV-003");

    expect(invoice.paidAt).toBe(existingPaidAt);
  });
});

describe("buildBillPaidUpdate", () => {
  it("marks bill paid with stripe reference", () => {
    const update = buildBillPaidUpdate(
      {
        id: "BILL-001",
        purchaseRequestId: "PRQ-001",
        vendorId: "techflow",
        vendorName: "TechFlow",
        amount: 100,
        date: "2026-06-01",
        status: "Due",
      },
      "INV-001",
      "pi_test_123",
    );

    expect(update.status).toBe("Paid");
    expect(update.invoiceId).toBe("INV-001");
    expect(update.stripePaymentIntentId).toBe("pi_test_123");
  });
});
