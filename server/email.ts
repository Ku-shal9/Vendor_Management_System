import emailjs, { EmailJSResponseStatus } from "@emailjs/nodejs";

function getEmailConfig() {
  return {
    serviceId:
      process.env.EMAILJS_SERVICE_ID || "vendor_registratiion999",
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

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    time: expiryTime,
    toemail: toEmail,
    toEmail,
    to_email: toEmail,
    otp_code: otp,
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
  _toName: string,
  otp: string,
) {
  const { onboardingTemplateId } = getEmailConfig();
  await sendTemplateEmail(toEmail, otp, onboardingTemplateId, "toemail");
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
  });
}
