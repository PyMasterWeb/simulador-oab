import { FastifyInstance } from "fastify";
import { explainMistakes, generatePersonalizedExam } from "../application/recommendation.js";

export async function recommendationRoutes(app: FastifyInstance) {
  app.get("/recommendations/:userId", { preHandler: [app.authenticate] }, async (request) => {
    const userId = (request.params as any).userId as string;
    return generatePersonalizedExam(userId);
  });

  app.get("/recommendations/attempt/:attemptId/mistakes", { preHandler: [app.authenticate] }, async (request) => {
    const attemptId = (request.params as any).attemptId as string;
    return explainMistakes(attemptId);
  });
}
