import { describe, it, expect } from "vitest";
import { validateCardForm } from "./cardForm.js";

describe("validateCardForm", () => {
  it("accepts complete test card details", () => {
    expect(
      validateCardForm({
        cardNumber: "4242 4242 4242 4242",
        expiry: "12/30",
        cvc: "123",
        name: "Finance User",
      }),
    ).toBeNull();
  });

  it("rejects missing cvc", () => {
    expect(
      validateCardForm({
        cardNumber: "4242 4242 4242 4242",
        expiry: "12/30",
        cvc: "1",
        name: "Finance User",
      }),
    ).toBe("Enter CVC");
  });
});
