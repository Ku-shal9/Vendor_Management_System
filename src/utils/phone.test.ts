import { describe, expect, it } from "vitest";
import {
  DEFAULT_PHONE_COUNTRY,
  detectPhoneCountry,
  formatPhoneWithCountryCode,
  getPhoneCountryOptions,
} from "./phone.js";

describe("phone helpers", () => {
  it("loads country options with calling codes", () => {
    const options = getPhoneCountryOptions();
    expect(options.some((option) => option.code === "NP")).toBe(true);
    expect(options.find((option) => option.code === "NP")?.dialCode).toBe(
      "+977",
    );
  });

  it("formats local numbers with the selected country code", () => {
    expect(formatPhoneWithCountryCode("9841234567", "NP")).toBe(
      "+977 9841234567",
    );
  });

  it("preserves already international numbers", () => {
    expect(formatPhoneWithCountryCode("+1 415 555 0123", "NP")).toBe(
      "+1 415 555 0123",
    );
  });

  it("falls back to the default country when a number cannot be parsed", () => {
    expect(detectPhoneCountry("not-a-phone")).toBe(DEFAULT_PHONE_COUNTRY);
  });
});
