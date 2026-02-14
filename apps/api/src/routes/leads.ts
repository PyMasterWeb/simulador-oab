import { FastifyInstance } from "fastify";
import { leadSchema } from "@oab/shared";
import { prisma } from "../infra/prisma.js";
import { stringify } from "csv-stringify/sync";

export async function leadRoutes(app: FastifyInstance) {
  app.post("/leads", async (request, reply) => {
    const body = leadSchema.parse(request.body);
    const lead = await prisma.lead.create({ data: body });
    return reply.code(201).send(lead);
  });

  app.get("/leads/export.csv", { preHandler: [app.authenticate] }, async (request, reply) => {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
    const csv = stringify(
      leads.map((l) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone || "",
        consentMarketing: l.consentMarketing,
        utmSource: l.utmSource || "",
        utmCampaign: l.utmCampaign || "",
        createdAt: l.createdAt.toISOString()
      })),
      { header: true }
    );

    reply.header("Content-Type", "text/csv");
    reply.send(csv);
  });
}
