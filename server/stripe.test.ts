import { describe, it, expect } from "vitest";
import { simulateStripePayment } from "./stripe.js";

describe("simulateStripePayment", () => {
  it("simulates success without stripe key", async () => {
    const prev = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const result = await simulateStripePayment(150);

    expect(result.success).toBe(true);
    expect(result.paymentIntentId).toMatch(/^pi_sim_/);

    if (prev) process.env.STRIPE_SECRET_KEY = prev;
  });

  it("rejects zero amount", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const result = await simulateStripePayment(0);
    expect(result.success).toBe(false);
  });
});
