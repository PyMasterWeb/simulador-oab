import { FastifyInstance } from "fastify";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { prisma } from "../infra/prisma.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function rankingRoutes(app: FastifyInstance) {
  app.get("/ranking", async (request) => {
    const query = request.query as { period?: "WEEK" | "ALL"; city?: string; college?: string; className?: string };
    const period = query.period || "WEEK";

    const startOfWeek = dayjs().tz("America/Bahia").startOf("week").toDate();
    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        period,
        ...(period === "WEEK" ? { createdAt: { gte: startOfWeek } } : {})
      },
      include: { user: true },
      orderBy: [{ score: "desc" }, { timeSec: "asc" }],
      take: 100
    });

    return entries
      .filter((e) => (query.city ? e.user.city === query.city : true))
      .filter((e) => (query.college ? e.user.college === query.college : true))
      .filter((e) => (query.className ? e.user.className === query.className : true))
      .map((e, idx) => ({
        position: idx + 1,
        user: { name: e.user.name, city: e.user.city, college: e.user.college, className: e.user.className },
        score: e.score,
        timeSec: e.timeSec
      }));
  });
}
