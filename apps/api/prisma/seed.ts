import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

const SUBJECT_BLOCKS = [
  { start: 1, end: 8, subject: "Ética e Estatuto", topic: "Estatuto e Ética Profissional", slug: "etica-estatuto" },
  { start: 9, end: 20, subject: "Constitucional e DH", topic: "Constituição e Direitos Fundamentais", slug: "constitucional-dh" },
  { start: 21, end: 32, subject: "Administrativo e Tributário", topic: "Administração Pública e Tributos", slug: "adm-tributario" },
  { start: 33, end: 48, subject: "Civil e Processo Civil", topic: "Direito Privado e Processo", slug: "civil-processo-civil" },
  { start: 49, end: 64, subject: "Penal e Processo Penal", topic: "Teoria Penal e Processo", slug: "penal-processo-penal" },
  { start: 65, end: 76, subject: "Trabalho e Processo do Trabalho", topic: "Relações de Trabalho e Rito", slug: "trabalho-processo" },
  { start: 77, end: 80, subject: "Empresarial/Ambiental/ECA", topic: "Temas Especiais", slug: "especiais" }
];

type ParsedQuestion = {
  exam: number;
  number: number;
  text: string;
  options: Record<string, string>;
  correct: string;
};

function getRepoRoot() {
  const filePath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(filePath), "../../..");
}

function blockForNumber(number: number) {
  return SUBJECT_BLOCKS.find((block) => number >= block.start && number <= block.end) || SUBJECT_BLOCKS[0];
}

function loadRealQuestions(maxQuestions = 120): ParsedQuestion[] {
  const root = getRepoRoot();
  const questionsPath = path.join(root, "data", "objective_questions.json");
  const catalogPath = path.join(root, "data", "oab_catalog.json");

  const questionDb = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
  const keysByExam: Record<string, string[]> = catalog.objectiveAnswerKeys || {};

  const exams = Object.keys(questionDb.exams)
    .map(Number)
    .sort((a, b) => b - a);

  const picked: ParsedQuestion[] = [];
  for (const exam of exams) {
    const examKey = String(exam);
    const answerKey = keysByExam[examKey];
    if (!answerKey || answerKey.length < 80) continue;

    const items = questionDb.exams[examKey] as Array<any>;
    for (const item of items) {
      if (item.source !== "parsed") continue;
      const correct = answerKey[item.number - 1];
      if (!correct || correct === "*") continue;
      if (!["A", "B", "C", "D", "E"].includes(correct)) continue;

      picked.push({
        exam,
        number: item.number,
        text: item.text,
        options: item.options,
        correct
      });

      if (picked.length >= maxQuestions) return picked;
    }
  }

  return picked;
}

async function main() {
  await prisma.leaderboardEntry.deleteMany();
  await prisma.attemptAnswer.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.question.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subject.deleteMany();

  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@oab.local" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@oab.local",
      passwordHash: adminPassword,
      role: "ADMIN",
      plan: "PREMIUM",
      consentMarketing: true
    }
  });

  const subjectTopicMap: Record<string, { subjectId: string; topicId: string }> = {};
  for (const block of SUBJECT_BLOCKS) {
    const subject = await prisma.subject.upsert({
      where: { slug: block.slug },
      update: { name: block.subject },
      create: { name: block.subject, slug: block.slug }
    });
    const topic = await prisma.topic.upsert({
      where: { subjectId_slug: { subjectId: subject.id, slug: block.slug } },
      update: { name: block.topic },
      create: { subjectId: subject.id, name: block.topic, slug: block.slug }
    });
    subjectTopicMap[block.slug] = { subjectId: subject.id, topicId: topic.id };
  }

  const realQuestions = loadRealQuestions(120);
  if (!realQuestions.length) {
    throw new Error("Nenhuma questão real encontrada em data/objective_questions.json + data/oab_catalog.json");
  }

  const createdQuestionIds: string[] = [];
  for (const item of realQuestions) {
    const block = blockForNumber(item.number);
    const ids = subjectTopicMap[block.slug];
    const question = await prisma.question.create({
      data: {
        subjectId: ids.subjectId,
        topicId: ids.topicId,
        statement: item.text,
        alternatives: item.options,
        correct: item.correct,
        commentText: `Questão adaptada do ${item.exam}º Exame de Ordem. Gabarito oficial: alternativa ${item.correct}.`,
        commentRefs: [`${item.exam}º Exame de Ordem Unificado (FGV/OAB)`, `Questão ${item.number}`],
        commentVideoUrl: null,
        difficulty: 3
      }
    });
    createdQuestionIds.push(question.id);
  }

  const fullExam = await prisma.exam.create({
    data: {
      title: "Simulado Completo OAB (questões reais adaptadas)",
      mode: "FULL",
      isFree: false,
      durationMinutes: 300
    }
  });

  const freeExam = await prisma.exam.create({
    data: {
      title: "Simulado Gratuito OAB (questões reais adaptadas)",
      mode: "SUBJECT",
      isFree: true,
      durationMinutes: 90
    }
  });

  await prisma.examQuestion.createMany({
    data: createdQuestionIds.slice(0, 100).map((questionId, idx) => ({
      examId: idx < 20 ? freeExam.id : fullExam.id,
      questionId,
      position: idx < 20 ? idx + 1 : idx - 19
    }))
  });

  console.log(`Seed concluído: admin + ${Math.min(createdQuestionIds.length, 100)} questões reais adaptadas + 2 simulados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
