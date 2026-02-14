import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { examRoutes } from "./routes/exams.js";
import { rankingRoutes } from "./routes/ranking.js";
import { leadRoutes } from "./routes/leads.js";
import { paymentRoutes } from "./routes/payments.js";
import { userRoutes } from "./routes/users.js";
import { adminRoutes } from "./routes/admin.js";
import { recommendationRoutes } from "./routes/recommendations.js";
import { env } from "./utils/env.js";

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(sensible);
app.register(authPlugin);

app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));
app.get("/checkout", async () => ({
  premiumCheckoutUrl:
    env.premiumCheckoutUrlAsaas ||
    env.premiumCheckoutUrlMercadoPago ||
    env.premiumCheckoutUrlNubankQr ||
    env.premiumCheckoutUrl
}));

app.register(authRoutes);
app.register(examRoutes);
app.register(rankingRoutes);
app.register(leadRoutes);
app.register(paymentRoutes);
app.register(userRoutes);
app.register(adminRoutes);
app.register(recommendationRoutes);

app.setErrorHandler((error: any, _, reply) => {
  app.log.error({ msg: "Unhandled error", error });
  reply.code(500).send({ message: error.message || "Erro interno" });
});

app.listen({ port: env.port, host: env.host }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
