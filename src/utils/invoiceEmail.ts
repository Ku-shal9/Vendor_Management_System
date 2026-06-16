import emailjs from "emailjs-com";
import type { Invoice } from "../types.js";

const EMAILJS_ENV = {
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_INVOICE_TEMPLATE_ID,
  toEmail: import.meta.env.VITE_EMAILJS_TO_EMAIL,
} as const;

export function sendInvoiceEmail(invoice: Invoice) {
  const missing = Object.entries(EMAILJS_ENV)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Invoice download is not configured. Missing EmailJS env vars: ${missing.join(", ")}`,
    );
  }

  emailjs.init(EMAILJS_ENV.publicKey);
  return emailjs.send(EMAILJS_ENV.serviceId, EMAILJS_ENV.templateId, {
    to_email: EMAILJS_ENV.toEmail,
    invoice_id: invoice.id,
    vendor_name: invoice.vendorName,
    invoice_date: invoice.date,
    invoice_amount: invoice.amount.toFixed(2),
    invoice_status: invoice.status,
  });
}
