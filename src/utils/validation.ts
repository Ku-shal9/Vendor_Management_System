export const MAX_SEARCH_LENGTH = 80;
export const MAX_TEXT_LENGTH = 160;
export const MAX_LONG_TEXT_LENGTH = 500;
export const MAX_PASSWORD_LENGTH = 128;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_MONEY_VALUE = 9_999_999.99;
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_BASE64_LENGTH = Math.floor(
  (MAX_DOCUMENT_SIZE_BYTES * 4) / 3,
);
export const documentMimeTypes = ["application/pdf"] as const;

export function todayIsoDate(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function trimTo(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeSearch(value: string): string {
  return trimTo(value, MAX_SEARCH_LENGTH);
}

export function validateRequiredText(
  value: unknown,
  label: string,
  options: { min?: number; max?: number } = {},
): string | null {
  const { min = 1, max = MAX_TEXT_LENGTH } = options;
  const text = String(value ?? "").trim();
  if (!text) return `${label} is required`;
  if (text.length < min) return `${label} must be at least ${min} characters`;
  if (text.length > max) return `${label} must be ${max} characters or fewer`;
  return null;
}

export function validateOptionalText(
  value: unknown,
  label: string,
  max = MAX_LONG_TEXT_LENGTH,
): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text.length > max) return `${label} must be ${max} characters or fewer`;
  return null;
}

export function validateEmail(value: unknown, label = "Email"): string | null {
  const email = String(value ?? "").trim();
  if (!email) return `${label} is required`;
  if (email.length > 254) return `${label} must be 254 characters or fewer`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) {
    return `Enter a valid ${label.toLowerCase()}`;
  }
  return null;
}

export function validatePassword(
  value: unknown,
  label = "Password",
): string | null {
  const password = String(value ?? "");
  if (!password) return `${label} is required`;
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `${label} must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `${label} must be ${MAX_PASSWORD_LENGTH} characters or fewer`;
  }
  return null;
}

export function validatePhone(value: unknown, required = false): string | null {
  const phone = String(value ?? "").trim();
  if (!phone) {
    return required ? "Phone number is required" : null;
  }
  const digits = phone.replace(/\D/g, "");
  if (!/^[0-9+\s().-]+$/.test(phone)) {
    return "Phone number can only contain numbers, spaces, +, (), ., and -";
  }
  if (digits.length < 7 || digits.length > 15) {
    return "Phone number must be between 7 and 15 digits";
  }
  return null;
}

export function validateId(value: unknown, label = "ID"): string | null {
  const id = String(value ?? "").trim();
  if (!id) return `${label} is required`;
  if (id.length > 80) return `${label} must be 80 characters or fewer`;
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return `${label} can only contain letters, numbers, underscores, and hyphens`;
  }
  return null;
}

export function parseMoney(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function validateMoney(
  value: unknown,
  options: { min?: number; max?: number } = {},
): string | null {
  const { min = 0.01, max = MAX_MONEY_VALUE } = options;
  const amount = parseMoney(value);
  if (amount === null)
    return "Enter a valid amount with up to 2 decimal places";
  if (amount < min) return `Amount must be at least ${min.toFixed(2)}`;
  if (amount > max) return `Amount must be ${max.toFixed(2)} or less`;
  return null;
}

export function validateDate(
  value: unknown,
  options: { allowPast?: boolean; label?: string } = {},
): string | null {
  const { allowPast = true, label = "Date" } = options;
  const dateValue = String(value ?? "").trim();
  if (!dateValue) return `${label} is required`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue))
    return `Enter ${label.toLowerCase()} as YYYY-MM-DD`;
  const [year, month, day] = dateValue.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return `Enter a valid ${label.toLowerCase()}`;
  }
  if (!allowPast) {
    const today = todayIsoDate();
    if (dateValue < today) return `${label} cannot be in the past`;
  }
  return null;
}

export function validateQuantity(
  value: unknown,
  options: { min?: number; max?: number } = {},
): string | null {
  const { min = 1, max = 99 } = options;
  const quantity = Number(String(value ?? "").trim());
  if (!Number.isInteger(quantity) || quantity < min || quantity > max) {
    return `Quantity must be a whole number between ${min} and ${max}`;
  }
  return null;
}

export function normalizeBase64Data(value: string): string {
  const commaIndex = value.indexOf(",");
  if (commaIndex >= 0 && value.startsWith("data:")) {
    return value.slice(commaIndex + 1);
  }
  return value;
}

export function validateBase64Document(
  value: unknown,
  label: string,
): string | null {
  const data = normalizeBase64Data(String(value ?? ""));
  if (!data) return `${label} is required`;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data))
    return `${label} must be valid base64`;
  if (data.length > MAX_DOCUMENT_BASE64_LENGTH) {
    return `${label} must be 5MB or smaller`;
  }
  return null;
}

export function validateMimeType(
  value: unknown,
  allowed: readonly string[],
  label: string,
): string | null {
  const mimeType = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!allowed.includes(mimeType)) {
    return `${label} must be one of: ${allowed.join(", ")}`;
  }
  return null;
}

export function validateFilename(value: unknown, label: string): string | null {
  const filename = String(value ?? "").trim();
  if (!filename) return `${label} is required`;
  if (filename.length > 120) return `${label} must be 120 characters or fewer`;
  if (/[\\/\0]/.test(filename)) return `${label} contains invalid characters`;
  return null;
}
