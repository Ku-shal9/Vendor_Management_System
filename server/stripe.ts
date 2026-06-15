export interface StripePaymentResult {
  success: boolean;
  paymentIntentId: string;
  error?: string;
}

export async function simulateStripePayment(
  amount: number,
  currency = "usd",
): Promise<StripePaymentResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    if (amount <= 0) {
      return { success: false, paymentIntentId: "", error: "Invalid amount" };
    }
    return {
      success: true,
      paymentIntentId: `pi_sim_${Date.now()}`,
    };
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(secretKey);

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method: "pm_card_visa",
      confirm: true,
      automatic_payment_methods: { enabled: false },
    } as any);

    if (intent.status === "succeeded") {
      return { success: true, paymentIntentId: intent.id };
    }

    return {
      success: false,
      paymentIntentId: intent.id,
      error: `Payment status: ${intent.status}`,
    };
  } catch (err) {
    return {
      success: false,
      paymentIntentId: "",
      error: err instanceof Error ? err.message : "Stripe payment failed",
    };
  }
}
