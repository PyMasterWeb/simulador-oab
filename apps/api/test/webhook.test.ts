import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { verifyWebhookSignature } from "../src/domain/webhook.js";

describe("webhook signature", () => {
  it("valida assinatura HMAC", () => {
    const payload = JSON.stringify({ status: "APPROVED", email: "user@example.com" });
    const secret = "my-secret";
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    expect(verifyWebhookSignature(payload, "invalid", secret)).toBe(false);
  });
});
