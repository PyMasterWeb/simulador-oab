import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema } from "@oab/shared";
import { prisma } from "../infra/prisma.js";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const email = normalizeEmail(input.email);
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true }
    });
    if (existing) return reply.code(409).send({ message: "Email já cadastrado" });

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email,
        phone: input.phone,
        consentMarketing: input.consentMarketing,
        utmSource: input.utmSource,
        utmCampaign: input.utmCampaign,
        passwordHash: await bcrypt.hash(input.password, 10)
      }
    });

    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role, plan: user.plan });
    return { token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan } };
  });

  app.post("/auth/login", async (request, reply) => {
    const input = loginSchema.parse(request.body);
    const email = normalizeEmail(input.email);
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } }
    });
    if (!user) return reply.code(401).send({ message: "Credenciais inválidas" });

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) return reply.code(401).send({ message: "Credenciais inválidas" });

    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role, plan: user.plan });
    return { token, user: { id: user.id, name: user.name, email: user.email, plan: user.plan } };
  });
}
