const CATALOG_PATH = "data/oab_catalog.json";
const OBJECTIVE_QUESTIONS_PATH = "data/objective_questions.json";
const OPTION_LETTERS = ["A", "B", "C", "D"];

const SUBJECTIVE_BANK = {
  civil: [
    {
      title: "Peça profissional - Direito Civil",
      prompt:
        "Seu cliente celebrou contrato de compra e venda de imóvel, pagou sinal e parcelas, mas o vendedor desistiu sem justificativa. Redija a peça cabível com fundamentos, pedidos e requerimento de tutela adequada.",
      criteria: [
        { id: "piece_type", label: "Adequação da peça", weight: 25, patterns: ["petição inicial", "ação", "procedimento comum"] },
        { id: "legal_basis", label: "Fundamentação legal", weight: 25, patterns: ["art.", "código civil", "cpc", "inadimplemento", "perdas e danos"] },
        { id: "requests", label: "Pedidos e conclusão", weight: 25, patterns: ["requer", "pedido", "condenação", "tutela", "citação"] },
        { id: "structure", label: "Estrutura técnico-formal", weight: 25, patterns: ["dos fatos", "do direito", "dos pedidos", "valor da causa"] }
      ]
    },
    {
      title: "Questão discursiva - Obrigações",
      prompt:
        "Analise responsabilidade por inadimplemento contratual com cláusula penal e discuta possibilidade de cumulação com perdas e danos.",
      criteria: [
        { id: "thesis", label: "Tese jurídica principal", weight: 30, patterns: ["inadimplemento", "cláusula penal", "cumulação"] },
        { id: "legal_basis", label: "Base legal", weight: 25, patterns: ["art.", "código civil", "boa-fé objetiva", "função social"] },
        { id: "argumentation", label: "Argumentação e coerência", weight: 25, patterns: ["portanto", "logo", "assim", "consequentemente"] },
        { id: "conclusion", label: "Conclusão prática", weight: 20, patterns: ["conclui-se", "em síntese", "deve", "cabível"] }
      ]
    },
    {
      title: "Questão discursiva - Processo Civil",
      prompt:
        "Explique os requisitos para concessão de tutela de urgência e a forma adequada de impugnação pela parte contrária.",
      criteria: [
        { id: "thesis", label: "Requisitos da tutela de urgência", weight: 35, patterns: ["probabilidade do direito", "perigo de dano", "risco ao resultado útil"] },
        { id: "legal_basis", label: "Fundamentação legal", weight: 25, patterns: ["art.", "cpc", "tutela de urgência"] },
        { id: "countermeasure", label: "Impugnação adequada", weight: 25, patterns: ["agravo", "contestação", "revogação", "modificação"] },
        { id: "clarity", label: "Clareza e técnica", weight: 15, patterns: ["objetivo", "fundamentado", "requisitos"] }
      ]
    }
  ],
  penal: [
    {
      title: "Peça profissional - Direito Penal",
      prompt:
        "Seu cliente foi denunciado por furto qualificado, mas há forte tese de ausência de dolo e nulidade no reconhecimento pessoal. Redija a peça processual pertinente.",
      criteria: [
        { id: "piece_type", label: "Adequação da peça", weight: 25, patterns: ["resposta à acusação", "defesa", "memoriais", "apelação"] },
        { id: "thesis", label: "Teses defensivas", weight: 30, patterns: ["ausência de dolo", "nulidade", "reconhecimento pessoal", "absolvição"] },
        { id: "legal_basis", label: "Base legal", weight: 25, patterns: ["art.", "cpp", "cp", "jurisprudência"] },
        { id: "requests", label: "Pedidos defensivos", weight: 20, patterns: ["requer", "absolvição", "desclassificação", "anulação"] }
      ]
    },
    {
      title: "Questão discursiva - Dosimetria",
      prompt:
        "Diferencie as fases da dosimetria da pena e indique como a reincidência e a confissão influenciam o cálculo final.",
      criteria: [
        { id: "thesis", label: "Fases da dosimetria", weight: 35, patterns: ["pena-base", "agravantes", "atenuantes", "causas de aumento", "causas de diminuição"] },
        { id: "legal_basis", label: "Fundamentação legal", weight: 25, patterns: ["art.", "cp", "dosimetria"] },
        { id: "application", label: "Aplicação ao caso", weight: 25, patterns: ["reincidência", "confissão", "quantum", "fração"] },
        { id: "clarity", label: "Exposição técnica", weight: 15, patterns: ["primeira fase", "segunda fase", "terceira fase"] }
      ]
    },
    {
      title: "Questão discursiva - Nulidades",
      prompt:
        "Disserte sobre nulidade relativa e absoluta no processo penal, com foco no momento de arguição e efeitos.",
      criteria: [
        { id: "thesis", label: "Distinção entre nulidades", weight: 30, patterns: ["nulidade absoluta", "nulidade relativa", "prejuízo"] },
        { id: "timing", label: "Momento de arguição", weight: 25, patterns: ["preclusão", "primeira oportunidade", "arguir"] },
        { id: "effects", label: "Efeitos processuais", weight: 25, patterns: ["anulação", "aproveitamento dos atos", "renovação"] },
        { id: "legal_basis", label: "Base normativa", weight: 20, patterns: ["art.", "cpp", "pas de nullité sans grief"] }
      ]
    }
  ],
  trabalho: [
    {
      title: "Peça profissional - Direito do Trabalho",
      prompt:
        "Empregado dispensado sem justa causa cobra horas extras, adicional de insalubridade e diferenças de FGTS. Elabore a peça adequada com pedidos líquidos.",
      criteria: [
        { id: "piece_type", label: "Adequação da peça", weight: 25, patterns: ["reclamação trabalhista", "petição inicial", "rito"] },
        { id: "requests", label: "Pedidos líquidos", weight: 30, patterns: ["horas extras", "insalubridade", "fgts", "reflexos", "liquidação"] },
        { id: "legal_basis", label: "Fundamentação legal", weight: 25, patterns: ["clt", "art.", "súmula", "oj"] },
        { id: "structure", label: "Estrutura técnico-formal", weight: 20, patterns: ["dos fatos", "do direito", "dos pedidos", "valor da causa"] }
      ]
    },
    {
      title: "Questão discursiva - Jornada",
      prompt:
        "Analise validade de banco de horas, acordo individual e requisitos para compensação de jornada.",
      criteria: [
        { id: "thesis", label: "Regras de jornada", weight: 35, patterns: ["banco de horas", "compensação", "acordo individual", "acordo coletivo"] },
        { id: "legal_basis", label: "Base legal e jurisprudencial", weight: 25, patterns: ["clt", "art.", "tst", "súmula"] },
        { id: "limits", label: "Limites e requisitos", weight: 20, patterns: ["prazo", "limite", "controle de jornada"] },
        { id: "conclusion", label: "Conclusão objetiva", weight: 20, patterns: ["válido", "inválido", "devido", "não devido"] }
      ]
    },
    {
      title: "Questão discursiva - Recursos",
      prompt:
        "Explique cabimento, prazo e preparo dos recursos ordinário e de revista no processo do trabalho.",
      criteria: [
        { id: "thesis", label: "Cabimento recursal", weight: 30, patterns: ["recurso ordinário", "recurso de revista", "cabimento"] },
        { id: "deadlines", label: "Prazos", weight: 25, patterns: ["prazo", "oito dias", "tempestividade"] },
        { id: "costs", label: "Preparo e pressupostos", weight: 25, patterns: ["preparo", "depósito recursal", "custas"] },
        { id: "legal_basis", label: "Base normativa", weight: 20, patterns: ["clt", "art.", "tst"] }
      ]
    }
  ]
};

const OBJECTIVE_TOPIC_BLOCKS = [
  { label: "Ética e Estatuto", start: 1, end: 8 },
  { label: "Constitucional e Direitos Humanos", start: 9, end: 20 },
  { label: "Administrativo e Tributário", start: 21, end: 32 },
  { label: "Civil e Processo Civil", start: 33, end: 48 },
  { label: "Penal e Processo Penal", start: 49, end: 64 },
  { label: "Trabalho e Processo do Trabalho", start: 65, end: 76 },
  { label: "Empresarial, Ambiental e ECA", start: 77, end: 80 }
];

const state = {
  catalog: null,
  objectiveQuestionsBank: null,
  simulation: null,
  timerId: null,
  remainingSeconds: 0
};

const dom = {
  portalUpdated: document.querySelector("#portal-updated"),
  modeSelect: document.querySelector("#mode-select"),
  examSelect: document.querySelector("#exam-select"),
  subjectSelect: document.querySelector("#subject-select"),
  timeLimit: document.querySelector("#time-limit"),
  startBtn: document.querySelector("#start-btn"),
  setupPanel: document.querySelector("#setup-panel"),
  simPanel: document.querySelector("#sim-panel"),
  reportPanel: document.querySelector("#report-panel"),
  simTitle: document.querySelector("#sim-title"),
  simMeta: document.querySelector("#sim-meta"),
  timer: document.querySelector("#timer"),
  questionIndex: document.querySelector("#question-index"),
  questionText: document.querySelector("#question-text"),
  questionHint: document.querySelector("#question-hint"),
  objectiveOptions: document.querySelector("#objective-options"),
  submitObjective: document.querySelector("#submit-objective"),
  subjectiveAnswer: document.querySelector("#subjective-answer"),
  subjectiveText: document.querySelector("#subjective-text"),
  submitSubjective: document.querySelector("#submit-subjective"),
  prevBtn: document.querySelector("#prev-btn"),
  nextBtn: document.querySelector("#next-btn"),
  finishBtn: document.querySelector("#finish-btn"),
  reportContent: document.querySelector("#report-content"),
  restartBtn: document.querySelector("#restart-btn"),
  resourceList: document.querySelector("#resource-list")
};

function secondsToClock(total) {
  const hours = Math.floor(total / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((total % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(total % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${mins}:${secs}`;
}

function fillSelectors() {
  const examKeys = Object.keys(state.objectiveQuestionsBank?.exams || {})
    .map(Number)
    .sort((a, b) => b - a);
  dom.examSelect.innerHTML = examKeys.map((exam) => `<option value="${exam}">${exam}º Exame</option>`).join("");

  dom.subjectSelect.innerHTML = Object.keys(SUBJECTIVE_BANK)
    .map((key) => `<option value="${key}">${key[0].toUpperCase() + key.slice(1)}</option>`)
    .join("");

  dom.portalUpdated.textContent = `Catálogo local atualizado em ${state.catalog.updatedAt}.`;
}

function renderResources() {
  const items = state.catalog.resources
    .sort((a, b) => b.exam - a.exam)
    .slice(0, 14)
    .map(
      (item) => `
      <article class="resource-item">
        <strong>${item.title}</strong>
        <p class="hint">${item.exam}º exame · ${item.phase} · ${item.kind.replaceAll("_", " ")}</p>
        <a href="${item.url}" target="_blank" rel="noreferrer">Abrir arquivo</a>
      </article>
    `
    )
    .join("");

  dom.resourceList.innerHTML = items;
}

function modeIsObjective() {
  return dom.modeSelect.value === "objective";
}

function updateSetupByMode() {
  if (modeIsObjective()) {
    dom.subjectSelect.parentElement.classList.add("hidden");
    dom.timeLimit.value = "300";
  } else {
    dom.subjectSelect.parentElement.classList.remove("hidden");
    dom.timeLimit.value = "300";
  }
}

function buildObjectiveQuestions(exam) {
  const answerKey = state.catalog.objectiveAnswerKeys[String(exam)] || [];
  const total = Math.min(80, Math.max(answerKey.length, 80));
  const pdfResource = state.catalog.resources.find((item) => item.exam === exam && item.kind === "prova_objetiva");
  const bank = state.objectiveQuestionsBank?.exams?.[String(exam)] || [];
  return Array.from({ length: total }, (_, idx) => ({
    id: `obj-${exam}-${idx + 1}`,
    number: idx + 1,
    text:
      bank[idx]?.text ||
      `Questão ${idx + 1} do ${exam}º Exame. Leia o enunciado completo no caderno oficial para manter fidelidade da prova.`,
    options: bank[idx]?.options || {
      A: "Alternativa A",
      B: "Alternativa B",
      C: "Alternativa C",
      D: "Alternativa D"
    },
    source: bank[idx]?.source || "fallback",
    pdfUrl: pdfResource ? pdfResource.url : "",
    selected: null,
    submitted: false
  }));
}

function buildSubjectiveQuestions(subjectKey) {
  return SUBJECTIVE_BANK[subjectKey].map((q, idx) => ({
    id: `sub-${subjectKey}-${idx + 1}`,
    number: idx + 1,
    title: q.title,
    prompt: q.prompt,
    criteria: q.criteria,
    answer: "",
    submitted: false,
    evaluation: null
  }));
}

function startTimer(seconds) {
  clearInterval(state.timerId);
  state.remainingSeconds = seconds;
  dom.timer.textContent = secondsToClock(state.remainingSeconds);

  state.timerId = setInterval(() => {
    state.remainingSeconds -= 1;
    dom.timer.textContent = secondsToClock(Math.max(0, state.remainingSeconds));
    if (state.remainingSeconds <= 0) {
      clearInterval(state.timerId);
      finishSimulation(true);
    }
  }, 1000);
}

function startSimulation() {
  const mode = dom.modeSelect.value;
  const exam = Number(dom.examSelect.value);
  const timeMinutes = Math.max(10, Number(dom.timeLimit.value || 0));

  if (mode === "objective") {
    state.simulation = {
      mode,
      exam,
      questions: buildObjectiveQuestions(exam),
      answerKey: state.catalog.objectiveAnswerKeys[String(exam)] || null,
      currentIndex: 0,
      startedAt: new Date().toISOString()
    };
  } else {
    const subjectKey = dom.subjectSelect.value;
    state.simulation = {
      mode,
      exam,
      subjectKey,
      questions: buildSubjectiveQuestions(subjectKey),
      currentIndex: 0,
      startedAt: new Date().toISOString()
    };
  }

  dom.setupPanel.classList.add("hidden");
  dom.reportPanel.classList.add("hidden");
  dom.simPanel.classList.remove("hidden");

  startTimer(timeMinutes * 60);
  renderCurrentQuestion();
}

function renderObjectiveOptions(question) {
  dom.objectiveOptions.innerHTML = OPTION_LETTERS.map(
    (letter) =>
      `<button class="option-btn ${question.selected === letter ? "active" : ""}" data-option="${letter}"><strong>${letter})</strong> ${question.options[letter] || ""}</button>`
  ).join("");

  dom.objectiveOptions.querySelectorAll(".option-btn").forEach((button) => {
    button.addEventListener("click", () => {
      question.selected = button.dataset.option;
      question.submitted = false;
      renderObjectiveOptions(question);
      dom.questionHint.textContent = "Alternativa marcada. Clique em 'Submeter resposta objetiva' para confirmar.";
    });
  });
}

function evaluateSubjectiveAnswer(question, answerText) {
  const normalized = answerText.toLowerCase();
  const criteria = question.criteria.map((criterion) => {
    const hit = criterion.patterns.some((token) => normalized.includes(token.toLowerCase()));
    return {
      ...criterion,
      hit,
      score: hit ? criterion.weight : 0
    };
  });

  const lengthBonus = answerText.trim().length >= 900 ? 10 : answerText.trim().length >= 600 ? 5 : 0;
  const baseScore = criteria.reduce((sum, item) => sum + item.score, 0);
  const finalScore = Math.min(100, baseScore + lengthBonus);

  return {
    criteria,
    lengthBonus,
    scorePercent: finalScore,
    weakCriteria: criteria.filter((item) => !item.hit).map((item) => item.label)
  };
}

function renderCurrentQuestion() {
  const sim = state.simulation;
  const question = sim.questions[sim.currentIndex];

  dom.simTitle.textContent =
    sim.mode === "objective"
      ? `${sim.exam}º Exame - Simulado Objetivo`
      : `${sim.exam}º Exame - Simulado Subjetivo (${sim.subjectKey})`;

  dom.simMeta.textContent = `Questão ${sim.currentIndex + 1} de ${sim.questions.length}`;
  dom.questionIndex.textContent = `Questão ${question.number}`;
  dom.prevBtn.disabled = sim.currentIndex === 0;
  dom.nextBtn.disabled = sim.currentIndex === sim.questions.length - 1;

  if (sim.mode === "objective") {
    dom.questionText.textContent = question.text;
    dom.questionHint.innerHTML =
      question.source === "fallback" && question.pdfUrl
        ? `Questão exibida em modo resumido. Abra o enunciado oficial: <a href="${question.pdfUrl}" target="_blank" rel="noreferrer">caderno oficial</a>.`
        : question.submitted
          ? "Resposta submetida."
          : "Selecione a alternativa e clique em 'Submeter resposta objetiva'.";
    dom.objectiveOptions.classList.remove("hidden");
    dom.submitObjective.classList.remove("hidden");
    dom.subjectiveAnswer.classList.add("hidden");
    renderObjectiveOptions(question);
  } else {
    dom.questionText.textContent = `${question.title}: ${question.prompt}`;
    dom.questionHint.textContent = question.submitted
      ? "Resposta subjetiva submetida e avaliada por critérios de edital/práxis."
      : "Escreva a resposta e clique em 'Submeter resposta subjetiva'.";
    dom.objectiveOptions.classList.add("hidden");
    dom.submitObjective.classList.add("hidden");
    dom.subjectiveAnswer.classList.remove("hidden");
    dom.subjectiveText.value = question.answer;
  }
}

function getObjectiveTopic(number) {
  return OBJECTIVE_TOPIC_BLOCKS.find((block) => number >= block.start && number <= block.end)?.label || "Bloco geral";
}

function renderObjectiveReport(sim, forcedByTime) {
  const total = sim.questions.length;
  let correct = 0;
  const topicStats = {};

  for (const block of OBJECTIVE_TOPIC_BLOCKS) {
    topicStats[block.label] = { hits: 0, total: 0 };
  }

  sim.questions.forEach((question, idx) => {
    const expected = sim.answerKey ? sim.answerKey[idx] : null;
    const topic = getObjectiveTopic(question.number);
    topicStats[topic].total += 1;

    if (sim.answerKey && expected === "*" && question.submitted) {
      correct += 1;
      topicStats[topic].hits += 1;
    } else if (sim.answerKey && question.submitted && question.selected === expected) {
      correct += 1;
      topicStats[topic].hits += 1;
    }
  });

  const submittedCount = sim.questions.filter((question) => question.submitted).length;
  const pct = sim.answerKey ? ((correct / total) * 100).toFixed(1) : "N/A";
  const weakAreas = Object.entries(topicStats)
    .map(([label, stats]) => ({ label, accuracy: stats.total ? (stats.hits / stats.total) * 100 : 0 }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  const verdictClass = sim.answerKey ? (correct >= 40 ? "report-ok" : "report-bad") : "report-bad";
  const verdictText = sim.answerKey
    ? correct >= 40
      ? "Desempenho acima da linha de corte de 40 acertos."
      : "Desempenho abaixo da linha de corte de 40 acertos."
    : "Gabarito automático ainda indisponível para este exame.";

  dom.reportContent.innerHTML = `
    <div class="report-block">
      <p class="${verdictClass}">${verdictText}</p>
      <p>Acertos: <strong>${sim.answerKey ? `${correct}/${total}` : "-"}</strong> (${pct}${sim.answerKey ? "%" : ""}).</p>
      <p>Questões submetidas: <strong>${submittedCount}/${total}</strong>.</p>
      <p>Tempo usado: ${secondsToClock(Number(dom.timeLimit.value) * 60 - state.remainingSeconds)}.</p>
      ${forcedByTime ? "<p class=\"report-bad\">A prova foi encerrada por tempo esgotado.</p>" : ""}
    </div>
    <div class="report-block">
      <h3>Onde melhorar</h3>
      ${
        sim.answerKey
          ? `<ul>${weakAreas.map((area) => `<li>${area.label}: ${area.accuracy.toFixed(1)}% de aproveitamento.</li>`).join("")}</ul>
      <p class="hint">Priorize revisão teórica e bateria de questões nos blocos com menor aproveitamento.</p>`
          : "<p class=\"hint\">Você pode usar este modo para treino cronometrado; a correção automática será habilitada quando o gabarito estiver estruturado.</p>"
      }
    </div>
  `;
}

function renderSubjectiveReport(sim, forcedByTime) {
  const questions = sim.questions;
  const answered = questions.filter((q) => q.answer.trim() && q.evaluation);
  const avgPct = answered.length
    ? (answered.reduce((sum, q) => sum + q.evaluation.scorePercent, 0) / answered.length).toFixed(1)
    : "0.0";

  const aggregate = {};
  answered.forEach((question) => {
    question.evaluation.criteria.forEach((criterion) => {
      if (!aggregate[criterion.label]) {
        aggregate[criterion.label] = { hits: 0, total: 0 };
      }
      aggregate[criterion.label].total += 1;
      if (criterion.hit) aggregate[criterion.label].hits += 1;
    });
  });

  const weak = Object.entries(aggregate)
    .map(([label, stats]) => ({ label, pct: stats.total ? (stats.hits / stats.total) * 100 : 0 }))
    .filter((item) => item.pct < 70)
    .sort((a, b) => a.pct - b.pct);

  const weakQuestionDetails = answered
    .map((question) => ({
      number: question.number,
      weakCriteria: question.evaluation.weakCriteria
    }))
    .filter((item) => item.weakCriteria.length)
    .slice(0, 5);

  dom.reportContent.innerHTML = `
    <div class="report-block">
      <p class="${avgPct >= 70 ? "report-ok" : "report-bad"}">Aproveitamento subjetivo estimado: <strong>${avgPct}%</strong>.</p>
      <p>Questões respondidas/submetidas: <strong>${answered.length}/${questions.length}</strong>.</p>
      <p>Tempo usado: ${secondsToClock(Number(dom.timeLimit.value) * 60 - state.remainingSeconds)}.</p>
      ${forcedByTime ? "<p class=\"report-bad\">A prova foi encerrada por tempo esgotado.</p>" : ""}
      <p class="hint">Correção orientada por critérios de edital e práxis forense (adequação da peça, fundamentos, pedidos, técnica e argumentação).</p>
    </div>
    <div class="report-block">
      <h3>Onde melhorar</h3>
      <ul>
        ${
          weak.length
            ? weak.map((w) => `<li>${w.label}: ${w.pct.toFixed(1)}%.</li>`).join("")
            : "<li>Nenhum critério abaixo de 70%.</li>"
        }
      </ul>
      <p class="hint">Para subir nota, revise estrutura padrão da peça, fundamentos normativos específicos e pedidos completos com técnica processual.</p>
    </div>
    <div class="report-block">
      <h3>Diagnóstico por questão</h3>
      <ul>
        ${
          weakQuestionDetails.length
            ? weakQuestionDetails
                .map((item) => `<li>Questão ${item.number}: reforçar ${item.weakCriteria.join(", ")}.</li>`)
                .join("")
            : "<li>Sem fragilidades relevantes nas respostas submetidas.</li>"
        }
      </ul>
    </div>
  `;
}

function finishSimulation(forcedByTime = false) {
  clearInterval(state.timerId);
  if (!state.simulation) return;

  const sim = state.simulation;
  dom.simPanel.classList.add("hidden");
  dom.reportPanel.classList.remove("hidden");

  if (sim.mode === "objective") {
    renderObjectiveReport(sim, forcedByTime);
  } else {
    renderSubjectiveReport(sim, forcedByTime);
  }
}

function bindEvents() {
  dom.modeSelect.addEventListener("change", updateSetupByMode);

  dom.startBtn.addEventListener("click", startSimulation);

  dom.prevBtn.addEventListener("click", () => {
    if (!state.simulation || state.simulation.currentIndex === 0) return;
    state.simulation.currentIndex -= 1;
    renderCurrentQuestion();
  });

  dom.nextBtn.addEventListener("click", () => {
    if (!state.simulation) return;
    if (state.simulation.currentIndex < state.simulation.questions.length - 1) {
      state.simulation.currentIndex += 1;
      renderCurrentQuestion();
    }
  });

  dom.submitSubjective.addEventListener("click", () => {
    if (!state.simulation || state.simulation.mode !== "subjective") return;
    const question = state.simulation.questions[state.simulation.currentIndex];
    if (!dom.subjectiveText.value.trim()) {
      dom.questionHint.textContent = "Digite uma resposta antes de submeter.";
      return;
    }

    question.answer = dom.subjectiveText.value;
    question.evaluation = evaluateSubjectiveAnswer(question, question.answer);
    question.submitted = true;

    if (state.simulation.currentIndex < state.simulation.questions.length - 1) {
      state.simulation.currentIndex += 1;
      renderCurrentQuestion();
    } else {
      dom.questionHint.textContent = "Resposta submetida. Você pode finalizar para gerar o relatório.";
    }
  });

  if (dom.submitObjective) {
    dom.submitObjective.addEventListener("click", () => {
      if (!state.simulation || state.simulation.mode !== "objective") return;
      const question = state.simulation.questions[state.simulation.currentIndex];
      if (!question.selected) {
        dom.questionHint.textContent = "Selecione uma alternativa antes de submeter.";
        return;
      }

      question.submitted = true;
      if (state.simulation.currentIndex < state.simulation.questions.length - 1) {
        state.simulation.currentIndex += 1;
        renderCurrentQuestion();
      } else {
        dom.questionHint.textContent = "Resposta submetida. Você pode finalizar para gerar o relatório.";
      }
    });
  }

  dom.finishBtn.addEventListener("click", () => finishSimulation(false));

  dom.restartBtn.addEventListener("click", () => {
    state.simulation = null;
    dom.reportPanel.classList.add("hidden");
    dom.setupPanel.classList.remove("hidden");
    updateSetupByMode();
    dom.reportContent.innerHTML = "";
  });
}

async function init() {
  try {
    const [catalogResponse, questionBankResponse] = await Promise.all([
      fetch(CATALOG_PATH),
      fetch(OBJECTIVE_QUESTIONS_PATH)
    ]);

    state.catalog = await catalogResponse.json();
    state.objectiveQuestionsBank = await questionBankResponse.json();
  } catch (error) {
    console.error("Falha ao carregar banco de questões:", error);
    state.catalog = {
      updatedAt: "indisponível",
      resources: [],
      objectiveAnswerKeys: {}
    };
    state.objectiveQuestionsBank = { exams: {} };
  }

  fillSelectors();
  renderResources();
  updateSetupByMode();
  bindEvents();
}

init();
