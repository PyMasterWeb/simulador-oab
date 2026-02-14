import { FastifyInstance } from "fastify";
import { prisma } from "../infra/prisma.js";

export async function userRoutes(app: FastifyInstance) {
  app.get("/users/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = (request.user as any).sub as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.notFound("Usuário não encontrado");
    return user;
  });

  app.get("/users/:id/export", { preHandler: [app.authenticate] }, async (request, reply) => {
    const id = (request.params as any).id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return reply.notFound("Usuário não encontrado");

    const attempts = await prisma.attempt.findMany({ where: { userId: id }, include: { answers: true } });
    const leads = await prisma.lead.findMany({ where: { OR: [{ userId: id }, { email: user.email }] } });

    return { user, attempts, leads };
  });

  app.delete("/users/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const id = (request.params as any).id as string;

    await prisma.attemptAnswer.deleteMany({ where: { attempt: { userId: id } } });
    await prisma.attempt.deleteMany({ where: { userId: id } });
    await prisma.leaderboardEntry.deleteMany({ where: { userId: id } });
    await prisma.lead.deleteMany({ where: { OR: [{ userId: id }, { user: { id } }] } });
    await prisma.user.delete({ where: { id } });

    return { deleted: true };
  });
}
