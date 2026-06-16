import { describe, expect, it } from "vitest";
import {
  addMonthsIsoDate,
  sanitizeSearch,
  todayIsoDate,
  validateBase64Document,
  validateDate,
  validateDueDate,
  validateEmail,
  validateId,
  validateMoney,
  validateMimeType,
  validatePanNumber,
  validatePassword,
  validatePhone,
  validateQuantity,
  validateRequiredText,
} from "./validation.js";

describe("validation helpers", () => {
  it("validates required text length", () => {
    expect(validateRequiredText("  ", "Name")).toBe("Name is required");
    expect(validateRequiredText("A".repeat(161), "Name")).toBe(
      "Name must be 160 characters or fewer",
    );
    expect(validateRequiredText("Valid name", "Name")).toBeNull();
  });

  it("validates email addresses", () => {
    expect(validateEmail("admin@clance.com")).toBeNull();
    expect(validateEmail("not-an-email")).toBe("Enter a valid email");
    expect(validateEmail("a".repeat(255) + "@example.com")).toBe(
      "Email must be 254 characters or fewer",
    );
  });

  it("validates passwords", () => {
    expect(validatePassword("short")).toBe(
      "Password must be at least 8 characters",
    );
    expect(validatePassword("secure-password-123")).toBeNull();
    expect(validatePassword("x".repeat(129))).toBe(
      "Password must be 128 characters or fewer",
    );
  });

  it("validates phone numbers", () => {
    expect(validatePhone("+977 (1) 421-5588", true)).toBeNull();
    expect(validatePhone("123", true)).toBe(
      "Phone number must be between 7 and 15 digits",
    );
    expect(validatePhone("123<script>", true)).toBe(
      "Phone number can only contain numbers, spaces, +, (), ., and -",
    );
  });

  it("validates ids", () => {
    expect(validateId("BILL-001")).toBeNull();
    expect(validateId("bad/id")).toBe(
      "ID can only contain letters, numbers, underscores, and hyphens",
    );
  });

  it("validates PAN numbers", () => {
    expect(validatePanNumber("123456789")).toBeNull();
    expect(validatePanNumber("12345678")).toBe(
      "PAN number must be exactly 9 digits",
    );
    expect(validatePanNumber("12345678A")).toBe(
      "PAN number must be exactly 9 digits",
    );
  });

  it("validates money", () => {
    expect(validateMoney("12.34")).toBeNull();
    expect(validateMoney("0")).toBe("Amount must be at least 0.01");
    expect(validateMoney("12.345")).toBe(
      "Enter a valid amount with up to 2 decimal places",
    );
    expect(validateMoney("10000000")).toBe("Amount must be 9999999.99 or less");
  });

  it("validates dates and blocks past payment/invoice dates", () => {
    const today = todayIsoDate();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);
    expect(validateDate(today, { allowPast: false })).toBeNull();
    expect(validateDate(yesterday, { allowPast: false })).toBe(
      "Date cannot be in the past",
    );
    expect(validateDate("not-a-date")).toBe("Enter date as YYYY-MM-DD");
  });

  it("adds months without overflowing into the next month", () => {
    expect(addMonthsIsoDate("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsIsoDate("2026-05-31", 3)).toBe("2026-08-31");
  });

  it("validates due dates between today and three months from today", () => {
    const today = todayIsoDate();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);
    const maxDueDate = addMonthsIsoDate(today, 3);
    const tooFarDueDate = addMonthsIsoDate(today, 4);

    expect(validateDueDate(today)).toBeNull();
    expect(validateDueDate(maxDueDate)).toBeNull();
    expect(validateDueDate(yesterday)).toBe("Due date cannot be in the past");
    expect(validateDueDate(tooFarDueDate)).toBe(
      "Due date must be within 3 months",
    );
  });

  it("validates quantities", () => {
    expect(validateQuantity("1")).toBeNull();
    expect(validateQuantity("0")).toBe(
      "Quantity must be a whole number between 1 and 99",
    );
    expect(validateQuantity("100")).toBe(
      "Quantity must be a whole number between 1 and 99",
    );
    expect(validateQuantity("1.5")).toBe(
      "Quantity must be a whole number between 1 and 99",
    );
  });

  it("validates document base64 and search text", () => {
    expect(
      validateBase64Document("data:text/plain;base64,SGVsbG8=", "Document"),
    ).toBeNull();
    expect(validateBase64Document("not base64!", "Document")).toBe(
      "Document must be valid base64",
    );
    expect(sanitizeSearch("x".repeat(100))).toHaveLength(80);
  });

  it("limits document uploads to 5MB and PDF MIME types", () => {
    const oversizedBase64 = "A".repeat(6_990_508);
    expect(validateBase64Document(oversizedBase64, "Document")).toBe(
      "Document must be 5MB or smaller",
    );
    expect(validateMimeType("image/png", ["application/pdf"], "Document")).toBe(
      "Document must be one of: application/pdf",
    );
  });
});
