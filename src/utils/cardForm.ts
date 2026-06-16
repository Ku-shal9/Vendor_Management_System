export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validateCardForm(input: {
  cardNumber: string;
  expiry: string;
  cvc: string;
  name: string;
}): string | null {
  const digits = input.cardNumber.replace(/\s/g, "");
  if (digits.length < 13) return "Enter a valid card number";
  if (!/^\d{2}\/\d{2}$/.test(input.expiry)) return "Use MM/YY expiry";

  const [monthText, yearText] = input.expiry.split("/");
  const month = Number(monthText);
  const year = Number(`20${yearText}`);
  if (month < 1 || month > 12) return "Expiry month must be 01-12";

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const expiryEnd = new Date(year, month, 0, 23, 59, 59, 999);
  if (expiryEnd < currentMonthStart) return "Expiry date cannot be in the past";

  if (input.cvc.replace(/\D/g, "").length < 3) return "Enter CVC";
  if (!input.name.trim()) return "Enter name on card";
  return null;
}
