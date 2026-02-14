import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "../infra/prisma.js";
import { calculateAttemptScore, calculateRankingScore, isEligibleForRanking } from "../domain/scoring.js";
import { env } from "../utils/env.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function getUserId(request: any): string {
  return request.user.sub;
}

function getBearerToken(request: any): string | null {
  const auth = request.headers?.authorization as string | undefined;
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export async function examRoutes(app: FastifyInstance) {
  app.get("/subjects", async () => prisma.subject.findMany({ include: { topics: true } }));

  app.get("/exams", async () =>
    prisma.exam.findMany({
      include: { questions: { include: { question: { include: { subject: true, topic: true } } }, orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" }
    })
  );

  app.post("/exams/:id/start", async (request, reply) => {
    let userId: string | null = null;
    let issuedToken: string | null = null;
    const examId = (request.params as any).id as string;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return reply.notFound("Simulado não encontrado");

    const bearer = getBearerToken(request);
    if (bearer) {
      try {
        const decoded = await app.jwt.verify<{ sub: string; email: string; role: string; plan: string }>(bearer);
        userId = decoded.sub;
      } catch {
        userId = null;
      }
    }

    if (!exam.isFree && !userId) {
      return reply.code(401).send({ message: "Faça login para iniciar simulados premium." });
    }

    if (exam.isFree && !userId) {
      const suffix = Date.now().toString(36);
      const guest = await prisma.user.create({
        data: {
          name: `Convidado ${suffix}`,
          email: `guest+${suffix}@local.oab`,
          passwordHash: await bcrypt.hash(`guest-${suffix}`, 6),
          role: "STUDENT",
          plan: "FREE",
          consentMarketing: false
        }
      });
      userId = guest.id;
      issuedToken = app.jwt.sign({ sub: guest.id, email: guest.email, role: guest.role, plan: guest.plan });
    }

    if (!userId) {
      return reply.code(401).send({ message: "Não foi possível autenticar a tentativa." });
    }

    if (!exam.isFree) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user?.plan !== "PREMIUM") return reply.code(403).send({ message: "Acesso premium necessário" });
    }

    const attempt = await prisma.attempt.create({ data: { userId, examId } });
    return { attempt, token: issuedToken };
  });

  app.post("/attempts/:id/answer", { preHandler: [app.authenticate] }, async (request, reply) => {
    const attemptId = (request.params as any).id as string;
    const body = request.body as { questionId: string; selected?: string; timeSpentSec: number; reviewLater?: boolean };

    const attempt = await prisma.attempt.findUnique({ where: { id: attemptId }, include: { exam: true } });
    if (!attempt) return reply.notFound("Tentativa não encontrada");

    const question = await prisma.question.findUnique({ where: { id: body.questionId } });
    if (!question) return reply.notFound("Questão não encontrada");

    const isCorrect = body.selected ? question.correct === body.selected : null;

    const answer = await prisma.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId: body.questionId } },
      create: {
        attemptId,
        questionId: body.questionId,
        selected: body.selected,
        isCorrect,
        timeSpentSec: body.timeSpentSec,
        reviewLater: Boolean(body.reviewLater)
      },
      update: {
        selected: body.selected,
        isCorrect,
        timeSpentSec: body.timeSpentSec,
        reviewLater: Boolean(body.reviewLater),
        answeredAt: new Date()
      }
    });

    return answer;
  });

  app.post("/attempts/:id/finish", { preHandler: [app.authenticate] }, async (request, reply) => {
    const attemptId = (request.params as any).id as string;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { exam: true, answers: true }
    });
    if (!attempt) return reply.notFound("Tentativa não encontrada");

    const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
    const totalTimeSec = attempt.answers.reduce((acc, cur) => acc + cur.timeSpentSec, 0);
    const score = calculateAttemptScore(correctCount);

    const updated = await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
        totalTimeSec,
        correctCount,
        score
      }
    });

    const questionCount = attempt.answers.length || attempt.exam.durationMinutes;
    if (isEligibleForRanking(totalTimeSec, questionCount, env.rankingMinAvgSeconds)) {
      const rankingScore = calculateRankingScore({
        correctCount,
        totalTimeSec,
        durationMinutes: attempt.exam.durationMinutes,
        timeBonusFactor: env.rankingTimeBonusFactor
      });

      const now = dayjs().tz("America/Bahia").toDate();
      await prisma.leaderboardEntry.createMany({
        data: [
          { period: "ALL", userId: attempt.userId, score: rankingScore, timeSec: totalTimeSec, createdAt: now },
          { period: "WEEK", userId: attempt.userId, score: rankingScore, timeSec: totalTimeSec, createdAt: now }
        ]
      });
    }

    return updated;
  });

  app.get("/attempts/:id/result", { preHandler: [app.authenticate] }, async (request, reply) => {
    const attemptId = (request.params as any).id as string;

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    if (!attempt) return reply.notFound("Tentativa não encontrada");

    const bySubject: Record<string, { total: number; correct: number }> = {};
    for (const answer of attempt.answers) {
      const subject = await prisma.subject.findUnique({ where: { id: answer.question.subjectId } });
      const key = subject?.name || "Sem matéria";
      if (!bySubject[key]) bySubject[key] = { total: 0, correct: 0 };
      bySubject[key].total += 1;
      if (answer.isCorrect) bySubject[key].correct += 1;
    }

    return {
      attempt,
      subjectStats: Object.entries(bySubject).map(([subject, stat]) => ({
        subject,
        accuracy: stat.total ? Number(((stat.correct / stat.total) * 100).toFixed(2)) : 0,
        ...stat
      })),
      recommendations: "Reforçar matérias com acerto abaixo de 60% e refazer questões erradas."
    };
  });
}
