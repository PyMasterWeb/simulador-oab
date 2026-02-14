import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function findUp(startDir: string, targetFile: string): string | null {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, targetFile);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function loadEnvFile(filePath: string, override = false) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!override && typeof process.env[key] !== "undefined") continue;
    process.env[key] = value;
  }
}

const nearestEnv = findUp(currentDir, ".env");
if (nearestEnv) loadEnvFile(nearestEnv, true);

const workspaceFile = findUp(currentDir, "pnpm-workspace.yaml");
if (workspaceFile) {
  const workspaceRoot = path.dirname(workspaceFile);
  loadEnvFile(path.join(workspaceRoot, ".env"), true);
  loadEnvFile(path.join(workspaceRoot, "apps", "api", ".env"), true);
}

export const env = {
  port: Number(process.env.API_PORT || 3333),
  host: process.env.API_HOST || "127.0.0.1",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  webhookSecret: process.env.WEBHOOK_SECRET || "change-webhook-secret",
  premiumCheckoutUrl: process.env.PREMIUM_CHECKOUT_URL || "https://checkout.exemplo.com/premium",
  premiumCheckoutUrlAsaas: process.env.PREMIUM_CHECKOUT_URL_ASAAS || process.env.PREMIUM_CHECKOUT_URL || "",
  premiumCheckoutUrlMercadoPago: process.env.PREMIUM_CHECKOUT_URL_MERCADOPAGO || "",
  premiumCheckoutUrlNubankQr: process.env.PREMIUM_CHECKOUT_URL_NUBANK_QR || "",
  asaasWebhookToken: process.env.ASAAS_WEBHOOK_TOKEN || "",
  asaasApiKey: process.env.ASAAS_API_KEY || "",
  asaasApiBaseUrl: process.env.ASAAS_API_BASE_URL || "https://api.asaas.com/v3",
  mercadoPagoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || "",
  rankingMinAvgSeconds: Number(process.env.RANKING_MIN_AVG_SECONDS || 10),
  rankingTimeBonusFactor: Number(process.env.RANKING_TIME_BONUS_FACTOR || 0.2)
};
