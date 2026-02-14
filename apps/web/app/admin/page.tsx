"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../components/api";

export default function AdminPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [payload, setPayload] = useState(`{
  "subjectId": "COLE_O_ID_DA_MATERIA",
  "topicId": "COLE_O_ID_DO_TOPICO",
  "statement": "Enunciado completo da questão no estilo FGV.",
  "alternatives": {
    "A": "Alternativa A",
    "B": "Alternativa B",
    "C": "Alternativa C",
    "D": "Alternativa D",
    "E": "Alternativa E"
  },
  "correct": "A",
  "commentText": "Comentário detalhado do gabarito.",
  "commentRefs": ["CF, art. 5º"],
  "commentVideoUrl": "https://www.youtube.com/watch?v=example",
  "difficulty": 3
}`);
  const [message, setMessage] = useState("");

  async function load() {
    const token = localStorage.getItem("oab_token") || "";
    const data = await apiFetch<any[]>("/admin/questions", {}, token);
    setQuestions(data);
  }

  useEffect(() => {
    load().catch(() => setQuestions([]));
    apiFetch<any[]>("/subjects")
      .then((data) => {
        setSubjects(data);
        if (data.length) {
          setSelectedSubjectId(data[0].id);
          if (data[0].topics?.length) setSelectedTopicId(data[0].topics[0].id);
        }
      })
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) return;
    const subject = subjects.find((s) => s.id === selectedSubjectId);
    if (!subject?.topics?.length) {
      setSelectedTopicId("");
      return;
    }
    if (!subject.topics.some((t: any) => t.id === selectedTopicId)) {
      setSelectedTopicId(subject.topics[0].id);
    }
  }, [selectedSubjectId, selectedTopicId, subjects]);

  function fillPayloadWithSelectedIds() {
    if (!selectedSubjectId || !selectedTopicId) {
      setMessage("Selecione matéria e tópico antes de preencher o payload.");
      return;
    }

    setPayload(`{
  "subjectId": "${selectedSubjectId}",
  "topicId": "${selectedTopicId}",
  "statement": "Enunciado completo da questão no estilo FGV.",
  "alternatives": {
    "A": "Alternativa A",
    "B": "Alternativa B",
    "C": "Alternativa C",
    "D": "Alternativa D",
    "E": "Alternativa E"
  },
  "correct": "A",
  "commentText": "Comentário detalhado do gabarito.",
  "commentRefs": ["CF, art. 5º"],
  "commentVideoUrl": "https://www.youtube.com/watch?v=example",
  "difficulty": 3
}`);
    setMessage("Payload preenchido com IDs válidos.");
  }

  async function createQuestion() {
    try {
      const token = localStorage.getItem("oab_token") || "";
      const body = JSON.parse(payload);
      await apiFetch("/admin/questions", { method: "POST", body: JSON.stringify(body) }, token);
      setMessage("Questão criada.");
      await load();
    } catch (e: any) {
      const raw = String(e?.message || "");
      if (raw.includes("JSON")) {
        setMessage("JSON inválido no payload. Revise aspas, vírgulas e chaves.");
      } else {
        setMessage(raw);
      }
    }
  }

  return (
    <main className="container-page space-y-4">
      <section className="card">
        <h1 className="text-2xl font-bold">Admin - Questões</h1>
        <p className="text-sm text-stone-700">CRUD básico para gerenciamento do banco de questões.</p>
      </section>
      <section className="card space-y-2">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <select className="rounded border p-2" value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)}>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <select className="rounded border p-2" value={selectedTopicId} onChange={(e) => setSelectedTopicId(e.target.value)}>
            {(subjects.find((s) => s.id === selectedSubjectId)?.topics || []).map((topic: any) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-outline" onClick={fillPayloadWithSelectedIds}>
          Preencher payload com IDs válidos
        </button>
        <textarea className="w-full rounded border p-2" rows={10} value={payload} onChange={(e) => setPayload(e.target.value)} />
        <button className="btn-primary" onClick={createQuestion}>
          Criar questão
        </button>
        {message ? <p className="text-sm">{message}</p> : null}
      </section>
      <section className="card">
        <h2 className="font-semibold">Questões cadastradas ({questions.length})</h2>
      </section>
    </main>
  );
}
