import { FastifyInstance } from "fastify";
import { prisma } from "../infra/prisma.js";
import { env } from "../utils/env.js";
import { verifyWebhookSignature } from "../domain/webhook.js";

type InternalStatus = "APPROVED" | "REFUNDED" | "CANCELED" | "PENDING";

function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function normalizeStatus(provider: string, payload: any): InternalStatus {
  const raw =
    payload.status ||
    payload.event ||
    payload.action ||
    payload.data?.status ||
    payload.payment?.status ||
    payload.payment?.billingType ||
    "PENDING";
  const value = String(raw).toUpperCase();

  if (provider === "asaas") {
    if (value.includes("RECEIVED") || value.includes("CONFIRMED")) return "APPROVED";
    if (value.includes("REFUND") || value.includes("CHARGEBACK")) return "REFUNDED";
    if (value.includes("DELETED") || value.includes("CANCEL")) return "CANCELED";
    return "PENDING";
  }

  if (provider === "mercadopago") {
    if (value.includes("APPROV")) return "APPROVED";
    if (value.includes("REFUND") || value.includes("CHARGEBACK")) return "REFUNDED";
    if (value.includes("CANCEL") || value.includes("REJECT") || value.includes("REJECTED")) return "CANCELED";
    return "PENDING";
  }

  if (value.includes("APPROV") || value.includes("PAID")) return "APPROVED";
  if (value.includes("REFUND") || value.includes("CHARGEBACK")) return "REFUNDED";
  if (value.includes("CANCEL")) return "CANCELED";
  return "PENDING";
}

function resolveBuyerEmail(payload: any): string | null {
  return normalizeEmail(
    payload.email ||
    payload.buyer?.email ||
    payload.customer?.email ||
    payload.payment?.customer?.email ||
    payload.data?.buyer?.email ||
    payload.data?.customer?.email ||
    null
  );
}

function resolveAsaasCustomerId(payload: any): string | null {
  const customer = payload.payment?.customer || payload.customer || payload.data?.customer;
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  if (typeof customer === "object" && customer.id) return String(customer.id);
  return null;
}

async function fetchAsaasCustomerEmail(customerId: string): Promise<string | null> {
  if (!env.asaasApiKey) return null;

  try {
    const response = await fetch(`${env.asaasApiBaseUrl}/customers/${customerId}`, {
      headers: {
        access_token: env.asaasApiKey
      }
    });
    if (!response.ok) return null;
    const data = (await response.json()) as any;
    return data?.email || null;
  } catch {
    return null;
  }
}

function validateWebhook(provider: string, request: any, rawPayload: string): boolean {
  if (provider === "asaas") {
    if (!env.asaasWebhookToken) return true;
    const token = (request.headers["asaas-access-token"] || request.headers["x-asaas-access-token"]) as string | undefined;
    return token === env.asaasWebhookToken;
  }

  if (provider === "mercadopago") {
    const signature = request.headers["x-signature"] as string | undefined;
    const secret = env.mercadoPagoWebhookSecret || env.webhookSecret;
    return verifyWebhookSignature(rawPayload, signature, secret);
  }

  const signature = (request.headers["x-signature"] || request.headers["x-hotmart-hottok"]) as string | undefined;
  return verifyWebhookSignature(rawPayload, signature, env.webhookSecret);
}

function availableCheckoutProviders() {
  return [
    { provider: "asaas", label: "Asaas", url: env.premiumCheckoutUrlAsaas },
    { provider: "mercadopago", label: "Mercado Pago", url: env.premiumCheckoutUrlMercadoPago },
    { provider: "nubank_qr", label: "Nubank QR", url: env.premiumCheckoutUrlNubankQr }
  ].filter((entry) => Boolean(entry.url));
}

export async function paymentRoutes(app: FastifyInstance) {
  app.get("/billing/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).sub as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.notFound("Usuário não encontrado");

    const events = await prisma.paymentEvent.findMany({
      where: { userEmail: user.email },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan
      },
      events: events.map((event) => ({
        id: event.id,
        provider: event.provider,
        status: event.status,
        createdAt: event.createdAt
      }))
    };
  });

  app.get("/checkout/options", async () => {
    const providers = availableCheckoutProviders();
    return {
      providers,
      defaultProvider: providers[0]?.provider || "custom",
      premiumCheckoutUrl: providers[0]?.url || env.premiumCheckoutUrl
    };
  });

  app.post("/webhooks/payments/:provider", async (request, reply) => {
    const provider = (request.params as any).provider as string;
    const payload = request.body as any;
    const rawPayload = JSON.stringify(payload);

    if (!validateWebhook(provider, request, rawPayload)) {
      return reply.code(401).send({ message: "Assinatura inválida" });
    }

    let userEmail = resolveBuyerEmail(payload);
    if (!userEmail && provider === "asaas") {
      const customerId = resolveAsaasCustomerId(payload);
      if (customerId) {
        userEmail = normalizeEmail(await fetchAsaasCustomerEmail(customerId));
      }
    }
    const status = normalizeStatus(provider, payload);

    await prisma.paymentEvent.create({
      data: {
        provider,
        payloadJson: payload,
        userEmail: userEmail || "unknown@example.com",
        status
      }
    });

    if (userEmail) {
      const user = await prisma.user.findFirst({
        where: { email: { equals: userEmail, mode: "insensitive" } },
        select: { id: true }
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: status === "APPROVED" ? "PREMIUM" : "FREE" }
        });
      }
    }

    return { ok: true, provider, status, userEmail };
  });
}
