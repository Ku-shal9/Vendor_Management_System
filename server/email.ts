import emailjs, { EmailJSResponseStatus } from "@emailjs/nodejs";
import { randomBytes } from "node:crypto";

function getEmailConfig() {
  return {
    serviceId: process.env.EMAILJS_SERVICE_ID || "vendor_registratiion999",
    publicKey: process.env.EMAILJS_PUBLIC_KEY || "fBL0yqKEJrRIZNyvL",
    privateKey: process.env.EMAILJS_PRIVATE_KEY || "",
    onboardingTemplateId:
      process.env.EMAILJS_ONBOARDING_TEMPLATE_ID || "template_vknmgcl",
    resetTemplateId:
      process.env.EMAILJS_RESET_TEMPLATE_ID ||
      process.env.EMAILJS_TEMPLATE_ID ||
      "template_aj0iut3",
  };
}

const OTP_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const OTP_LOWER = "abcdefghijkmnopqrstuvwxyz";
const OTP_DIGITS = "23456789";
const OTP_SYMBOLS = "!@#$%^&*";

function randomChar(chars: string): string {
  return chars[randomBytes(1)[0] % chars.length];
}

function shuffleOTP(chars: string[]): string {
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomBytes(1)[0] % (index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }
  return chars.join("");
}

export function generateOTP(): string {
  return shuffleOTP([
    randomChar(OTP_UPPER),
    randomChar(OTP_LOWER),
    randomChar(OTP_DIGITS),
    randomChar(OTP_SYMBOLS),
    randomChar(OTP_DIGITS),
    randomChar(OTP_DIGITS),
    randomChar(OTP_DIGITS),
    randomChar(OTP_DIGITS),
  ]);
}

async function sendTemplateEmail(
  toEmail: string,
  otp: string,
  templateId: string,
  recipientParam: string,
  extraParams: Record<string, string> = {},
) {
  const { serviceId, publicKey, privateKey } = getEmailConfig();
  const expiryTime = new Date(Date.now() + 15 * 60000).toLocaleTimeString();

  console.log(`[Email] OTP for ${toEmail}: ${otp} (expires ${expiryTime})`);

  if (!privateKey) {
    console.log("[Email] Private key not configured, skipping email send");
    return;
  }

  const templateParams: Record<string, string> = {
    passcode: otp,
    otp: otp,
    otpCode: otp,
    otp_code: otp,
    code: otp,
    one_time_password: otp,
    oneTimePassword: otp,
    temporaryPassword: otp,
    temp_password: otp,
    time: expiryTime,
    toemail: toEmail,
    toEmail,
    to_email: toEmail,
    email: toEmail,
    userEmail: toEmail,
    user_email: toEmail,
    recipient: toEmail,
    [recipientParam]: toEmail,
    ...extraParams,
  };

  try {
    await emailjs.send(serviceId, templateId, templateParams, {
      publicKey,
      privateKey,
    });
  } catch (err) {
    if (
      err instanceof EmailJSResponseStatus &&
      err.text.includes("recipients address is empty")
    ) {
      throw new Error(
        `EmailJS template To Email empty. Set To Email variable in ${templateId}.`,
      );
    }
    throw err;
  }
}

/** Registration approved — onboarding OTP email */
export async function sendCredentialsEmail(
  toEmail: string,
  toName: string,
  otp: string,
) {
  const { onboardingTemplateId } = getEmailConfig();
  await sendTemplateEmail(toEmail, otp, onboardingTemplateId, "toemail", {
    username: toName,
    to_name: toName,
  });
}

/** Forgot password — reset OTP email */
export async function sendResetPasswordEmail(
  toEmail: string,
  toName: string,
  otp: string,
) {
  const { resetTemplateId } = getEmailConfig();
  await sendTemplateEmail(toEmail, otp, resetTemplateId, "toEmail", {
    username: toName,
    to_name: toName,
  });
}
