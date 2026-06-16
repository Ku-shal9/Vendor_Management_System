import type express from "express";
import type { PurchaseRequest, VendorItem } from "../src/types.js";
import {
  documentMimeTypes,
  isRecord,
  parseMoney,
  sanitizeSearch,
  todayIsoDate,
  validateDate,
  validateEmail,
  validateMoney,
  validateOptionalText,
  validatePassword,
  validatePhone,
  validateQuantity,
  validateRequiredText,
} from "../src/utils/validation.js";

export const invoiceStatuses = ["Pending", "Paid", "Overdue"] as const;
export const purchaseStatuses = [
  "Pending",
  "Approved",
  "Rejected",
  "Delivered",
] as const;
export const billStatuses = ["Due", "Paid"] as const;
export const notificationTypes = [
  "registration_submitted",
  "registration_approved",
  "registration_rejected",
  "invoice_created",
  "purchase_request_created",
  "purchase_request_accepted",
  "purchase_request_delivered",
  "bill_created",
  "payment_completed",
] as const;

export function badRequest(res: express.Response, error: string, status = 400) {
  return res.status(status).json({ error });
}

export function getBody(req: express.Request): Record<string, unknown> {
  return isRecord(req.body) ? req.body : {};
}

export function firstError(...errors: Array<string | null>): string | null {
  return errors.find(Boolean) ?? null;
}

export function validateStatus<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T | null {
  const status = String(value ?? "").trim();
  return allowed.includes(status as T) ? (status as T) : null;
}

export function validateStatusError<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): string | null {
  return validateStatus(value, allowed, label)
    ? null
    : `${label} must be one of: ${allowed.join(", ")}`;
}

export function validateOtp(value: unknown): string | null {
  const otp = String(value ?? "").trim();
  const isStrongOTP =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8}$/.test(otp);
  return /^\d{6}$/.test(otp) || isStrongOTP
    ? null
    : "OTP must be a valid 6-digit code or the generated 8-character code";
}

export function validateVendorItems(
  value: unknown,
): { items: VendorItem[] } | string {
  if (value === undefined) return { items: [] };
  if (!Array.isArray(value)) return "Catalog items must be an array";
  if (value.length > 100) return "Catalog can have at most 100 items";

  const items: VendorItem[] = [];
  for (const rawItem of value) {
    if (!isRecord(rawItem)) return "Each catalog item must be an object";

    const name = validateRequiredText(rawItem.name, "Item name", { max: 120 });
    const priceError = validateMoney(rawItem.price);
    const descriptionError = validateOptionalText(
      rawItem.description,
      "Item description",
    );
    const itemError = firstError(name, priceError, descriptionError);
    if (itemError) return itemError;

    const description = String(rawItem.description ?? "").trim();
    items.push({
      name: String(rawItem.name).trim(),
      price: parseMoney(rawItem.price) as number,
      ...(description ? { description } : {}),
    });
  }

  return { items };
}

export function validateSearch(value: unknown): string {
  return sanitizeSearch(String(value ?? ""));
}

export function validatePurchaseItems(
  value: unknown,
):
  | { items: NonNullable<PurchaseRequest["items"]>; totalAmount: number }
  | string {
  if (value !== undefined && !Array.isArray(value)) {
    return "Items must be an array";
  }

  const rawItems = Array.isArray(value) ? value : [];
  const items: NonNullable<PurchaseRequest["items"]> = [];
  let totalAmount = 0;

  for (const rawItem of rawItems) {
    if (!isRecord(rawItem)) {
      return "Each item must be an object";
    }

    const name = validateRequiredText(rawItem.name, "Item name", {
      max: 120,
    });
    const price = validateMoney(rawItem.price);
    const quantity = validateQuantity(rawItem.quantity);
    const itemError = firstError(name, price, quantity);
    if (itemError) return itemError;

    const itemPrice = parseMoney(rawItem.price) as number;
    const itemQuantity = Number(String(rawItem.quantity).trim());
    items.push({
      name: String(rawItem.name).trim(),
      price: itemPrice,
      quantity: itemQuantity,
    });
    totalAmount += itemPrice * itemQuantity;
  }

  if (items.length === 0) {
    return "Select at least one item";
  }

  return { items, totalAmount: Number(totalAmount.toFixed(2)) };
}

export function validateRegistrationContact(body: Record<string, unknown>) {
  const companyNameError = validateRequiredText(
    body.companyName,
    "Company legal name",
    { max: 120 },
  );
  const categoryError = validateRequiredText(body.category, "Vendor category", {
    max: 80,
  });
  const contactNameError = validateRequiredText(
    body.contactName,
    "Contact name",
    {
      max: 120,
    },
  );
  const contactEmailError = validateEmail(body.contactEmail, "Corporate email");
  const contactPhoneError = validatePhone(body.contactPhone, false);
  const addressError = validateOptionalText(
    body.address,
    "Business address",
    300,
  );

  return {
    error: firstError(
      companyNameError,
      categoryError,
      contactNameError,
      contactEmailError,
      contactPhoneError,
      addressError,
    ),
    companyName: String(body.companyName ?? "").trim(),
    category: String(body.category ?? "").trim(),
    contactName: String(body.contactName ?? "").trim(),
    contactEmail: String(body.contactEmail ?? "").trim(),
    contactPhone: String(body.contactPhone ?? "").trim(),
    address: String(body.address ?? "").trim(),
  };
}

export function validateTodayOrFutureDate(value: unknown, label = "Date") {
  return validateDate(value ?? todayIsoDate(), { allowPast: false, label });
}

export function validateRequiredEmail(value: unknown, label = "Email") {
  return validateEmail(value, label);
}

export function validateRequiredPassword(value: unknown, label = "Password") {
  return validatePassword(value, label);
}
