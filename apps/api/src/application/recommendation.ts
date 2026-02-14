import { prisma } from "../infra/prisma.js";

export async function generatePersonalizedExam(userId: string) {
  const answers = await prisma.attemptAnswer.findMany({
    where: { attempt: { userId }, isCorrect: false },
    include: { question: true },
    take: 30
  });

  const weakByTopic = new Map<string, number>();
  for (const answer of answers) {
    weakByTopic.set(answer.question.topicId, (weakByTopic.get(answer.question.topicId) || 0) + 1);
  }

  const sortedTopics = [...weakByTopic.entries()].sort((a, b) => b[1] - a[1]).map(([topicId]) => topicId);
  const similar = sortedTopics.length
    ? await prisma.question.findMany({ where: { topicId: { in: sortedTopics } }, take: 40 })
    : [];

  return {
    weakTopics: sortedTopics,
    suggestedQuestionIds: [...new Set([...answers.map((a) => a.questionId), ...similar.map((q) => q.id)])].slice(0, 40)
  };
}

export async function explainMistakes(attemptId: string) {
  const answers = await prisma.attemptAnswer.findMany({
    where: { attemptId, isCorrect: false },
    include: { question: true }
  });

  return answers.map((a) => ({
    questionId: a.questionId,
    selected: a.selected,
    correct: a.question.correct,
    explanation: a.question.commentText,
    refs: a.question.commentRefs
  }));
}
