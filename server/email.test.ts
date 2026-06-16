import emailjs from "@emailjs/nodejs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateOTP, sendResetPasswordEmail } from "./email.js";
import { validateStrongPassword } from "../src/utils/password.js";

function hasCharacterClass(value: string, regex: RegExp): boolean {
  return regex.test(value);
}

describe("email OTP helpers", () => {
  const originalPrivateKey = process.env.EMAILJS_PRIVATE_KEY;

  beforeEach(() => {
    process.env.EMAILJS_PRIVATE_KEY = "test_private_key";
    vi.spyOn(emailjs, "send").mockResolvedValue({
      status: 200,
      text: "OK",
    } as Awaited<ReturnType<typeof emailjs.send>>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalPrivateKey === undefined) {
      delete process.env.EMAILJS_PRIVATE_KEY;
    } else {
      process.env.EMAILJS_PRIVATE_KEY = originalPrivateKey;
    }
  });

  it("generates an 8-character OTP that satisfies strong password rules", () => {
    for (let index = 0; index < 50; index += 1) {
      const otp = generateOTP();

      expect(otp).toHaveLength(8);
      expect(hasCharacterClass(otp, /[A-Z]/)).toBe(true);
      expect(hasCharacterClass(otp, /[a-z]/)).toBe(true);
      expect(hasCharacterClass(otp, /\d/)).toBe(true);
      expect(hasCharacterClass(otp, /[^A-Za-z0-9]/)).toBe(true);
      expect(validateStrongPassword(otp, "OTP")).toBeNull();
    }
  });

  it("sends reset OTP emails with common EmailJS template field names", async () => {
    const otp = generateOTP();

    await sendResetPasswordEmail("vendor@example.com", "Vendor User", otp);

    expect(emailjs.send).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        passcode: otp,
        otp: otp,
        otpCode: otp,
        otp_code: otp,
        code: otp,
        one_time_password: otp,
        oneTimePassword: otp,
        temporaryPassword: otp,
        temp_password: otp,
        toemail: "vendor@example.com",
        toEmail: "vendor@example.com",
        to_email: "vendor@example.com",
        email: "vendor@example.com",
        userEmail: "vendor@example.com",
        user_email: "vendor@example.com",
        recipient: "vendor@example.com",
        username: "Vendor User",
        to_name: "Vendor User",
      }),
      expect.objectContaining({ privateKey: "test_private_key" }),
    );
    expect(otp).toHaveLength(8);
    expect(validateStrongPassword(otp, "OTP")).toBeNull();
  });
});
