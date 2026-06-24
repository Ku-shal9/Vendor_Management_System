import type { Bill, Invoice, PurchaseRequest } from "../src/types.js";

export function buildBillFromPurchase(
  purchase: PurchaseRequest,
  billId: string,
): Bill {
  return {
    id: billId,
    purchaseRequestId: purchase.id,
    vendorId: purchase.vendorId,
    vendorName: purchase.vendorName,
    amount: purchase.totalAmount,
    date: purchase.date,
    dueDate: purchase.dueDate,
    items: purchase.items,
    status: "Due",
    invoiceId: "",
    stripePaymentIntentId: "",
  };
}

export function buildInvoiceFromBill(
  bill: Bill,
  invoiceId: string,
  items = bill.items ?? [],
): Invoice {
  return {
    id: invoiceId,
    vendorId: bill.vendorId,
    vendorName: bill.vendorName,
    amount: bill.amount,
    date: new Date().toISOString().split("T")[0],
    dueDate: bill.dueDate,
    paidAt:
      typeof bill.paidAt === "string" && bill.paidAt.trim() !== ""
        ? bill.paidAt
        : new Date().toISOString(),
    status: "Paid",
    purchaseRequestId: bill.purchaseRequestId,
    billId: bill.id,
    items,
  };
}

export function buildBillPaidUpdate(
  bill: Bill,
  invoiceId: string,
  stripePaymentIntentId: string,
): Partial<Bill> {
  return {
    status: "Paid",
    invoiceId,
    paidAt: new Date().toISOString(),
    stripePaymentIntentId,
  };
}
