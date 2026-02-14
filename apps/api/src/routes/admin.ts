import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../infra/prisma.js";

function ensureAdmin(request: any, reply: any) {
  if (request.user.role !== "ADMIN") {
    reply.code(403).send({ message: "Acesso restrito" });
    return false;
  }
  return true;
}

export async function adminRoutes(app: FastifyInstance) {
  app.get("/admin/questions", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!ensureAdmin(request, reply)) return;
    return prisma.question.findMany({ include: { subject: true, topic: true }, take: 200 });
  });

  app.post("/admin/questions", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!ensureAdmin(request, reply)) return;
    const body = request.body as any;
    try {
      const created = await prisma.question.create({ data: body });
      return reply.code(201).send(created);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return reply.code(400).send({
          message: "subjectId ou topicId inválido. Use IDs existentes em /subjects."
        });
      }
      return reply.code(400).send({ message: error?.message || "Não foi possível criar a questão." });
    }
  });

  app.put("/admin/questions/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!ensureAdmin(request, reply)) return;
    const id = (request.params as any).id as string;
    const body = request.body as any;
    return prisma.question.update({ where: { id }, data: body });
  });

  app.delete("/admin/questions/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    if (!ensureAdmin(request, reply)) return;
    const id = (request.params as any).id as string;
    await prisma.question.delete({ where: { id } });
    return { deleted: true };
  });
}
