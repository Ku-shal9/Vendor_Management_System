import { describe, expect, it } from "vitest";
import { validateOtp, validateVendorItems } from "./apiValidation.js";

describe("validateOtp", () => {
  it("accepts legacy 6-digit OTPs", () => {
    expect(validateOtp("123456")).toBeNull();
  });

  it("accepts generated 8-character strong OTPs", () => {
    expect(validateOtp("Abc1!def")).toBeNull();
  });

  it("rejects weak 8-character OTPs", () => {
    expect(validateOtp("Abcdefg1")).toBe(
      "OTP must be a valid 6-digit code or the generated 8-character code",
    );
  });
});

describe("validateVendorItems", () => {
  it("accepts valid catalog items", () => {
    expect(
      validateVendorItems([
        { name: "Managed Wi-Fi", price: 125, description: "Monthly service" },
        { name: "Router rental", price: "12.50" },
      ]),
    ).toEqual({
      items: [
        {
          name: "Managed Wi-Fi",
          price: 125,
          description: "Monthly service",
        },
        { name: "Router rental", price: 12.5 },
      ],
    });
  });

  it("rejects invalid catalog items", () => {
    expect(validateVendorItems({ name: "Widget" })).toBe(
      "Catalog items must be an array",
    );
    expect(validateVendorItems([{ name: "", price: 10 }])).toBe(
      "Item name is required",
    );
    expect(validateVendorItems([{ name: "Widget", price: "12.345" }])).toBe(
      "Enter a valid amount with up to 2 decimal places",
    );
  });
});
