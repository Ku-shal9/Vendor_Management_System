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
    status: "Due",
  };
}

export function buildInvoiceFromBill(bill: Bill, invoiceId: string): Invoice {
  return {
    id: invoiceId,
    vendorId: bill.vendorId,
    vendorName: bill.vendorName,
    amount: bill.amount,
    date: new Date().toISOString().split("T")[0],
    status: "Paid",
    purchaseRequestId: bill.purchaseRequestId,
    billId: bill.id,
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
