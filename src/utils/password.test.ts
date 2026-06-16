import { describe, expect, it } from "vitest";
import { getPasswordStrength, validateStrongPassword } from "./password.js";

describe("password helpers", () => {
  it("rejects weak passwords and accepts strong passwords", () => {
    expect(validateStrongPassword("short")).toBe(
      "Password must be at least 8 characters",
    );
    expect(validateStrongPassword("abcdefgh")).toBe(
      "Password must include an uppercase letter",
    );
    expect(validateStrongPassword("Abcdefgh")).toBe(
      "Password must include a number",
    );
    expect(validateStrongPassword("Abcdefg1")).toBe(
      "Password must include a symbol",
    );
    expect(validateStrongPassword("Abcdefg1!")).toBeNull();
  });

  it("reports empty, weak, fair, good, and strong scores", () => {
    expect(getPasswordStrength("").score).toBe(0);
    expect(getPasswordStrength("a").score).toBe(1);
    expect(getPasswordStrength("Abcdefg").score).toBe(2);
    expect(getPasswordStrength("Abcdefg1").score).toBe(3);
    expect(getPasswordStrength("Abcdefg1!").score).toBe(4);
  });
});
