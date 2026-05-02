"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useState } from "react";

type CommitmentStatus = "pending" | "done" | "adjusted" | "missed";

type Commitment = {
  id: string;
  title: string;
  detail: string;
  source: string;
  status: CommitmentStatus;
};

type PlannedBlock = {
  id: string;
  type: string;
  title: string;
  target: string;
};

type PlanningDay = {
  id: string;
  label: string;
  date: string;
  isToday?: boolean;
  chips: Array<{
    label: string;
    tone: "grind" | "study" | "review" | "sport" | "rest" | "admin";
    status?: "done" | "adjusted" | "missed";
  }>;
  extra?: number;
};

const isAuthConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

const navItems = ["Hoje", "Plano semanal", "Objetivos mensais", "Estudo", "Review"];

const plannedBlocks: PlannedBlock[] = [
  {
    id: "study-icm",
    type: "Estudo",
    title: "Spots ICM de call",
    target: "45 min",
  },
  {
    id: "grind-main",
    type: "Grind",
    title: "Sessão principal MTT",
    target: "1 sessão",
  },
  {
    id: "review-hands",
    type: "Review",
    title: "Mãos marcadas ontem",
    target: "20 mãos",
  },
];

const initialCommitments: Commitment[] = [
  {
    id: "commit-study",
    title: "Rever spots ICM antes do grind",
    detail: "45 min · foco em calls no late game",
    source: "Bloco de estudo",
    status: "pending",
  },
  {
    id: "commit-grind",
    title: "Fazer uma sessão MTT sem late reg extra",
    detail: "seguir o volume planeado, sem compensar",
    source: "Bloco de grind",
    status: "pending",
  },
  {
    id: "commit-review",
    title: "Fechar 20 mãos para review",
    detail: "marcar padrões, não bad beats",
    source: "Bloco de review",
    status: "pending",
  },
];

const planningWeek: PlanningDay[] = [
  {
    id: "thu",
    label: "Qui",
    date: "30",
    chips: [
      { label: "Descanso", tone: "rest", status: "done" },
      { label: "Plano", tone: "admin", status: "done" },
    ],
  },
  {
    id: "fri",
    label: "Sex",
    date: "1",
    isToday: true,
    chips: [
      { label: "Estudo", tone: "study" },
      { label: "Grind", tone: "grind" },
      { label: "Review", tone: "review" },
    ],
  },
  {
    id: "sat",
    label: "Sab",
    date: "2",
    chips: [
      { label: "Sport", tone: "sport" },
      { label: "Estudo", tone: "study" },
      { label: "Grind", tone: "grind" },
    ],
    extra: 1,
  },
  {
    id: "sun",
    label: "Dom",
    date: "3",
    chips: [
      { label: "Grind", tone: "grind" },
      { label: "Grind", tone: "grind" },
      { label: "Descanso", tone: "rest" },
    ],
    extra: 2,
  },
  {
    id: "mon",
    label: "Seg",
    date: "4",
    chips: [
      { label: "Review", tone: "review" },
      { label: "Sport", tone: "sport" },
    ],
  },
  {
    id: "tue",
    label: "Ter",
    date: "5",
    chips: [
      { label: "Estudo", tone: "study" },
      { label: "Admin", tone: "admin" },
    ],
  },
  {
    id: "wed",
    label: "Qua",
    date: "6",
    chips: [
      { label: "Review", tone: "review" },
      { label: "Descanso", tone: "rest" },
    ],
  },
];

const monthlyPace = [
  { category: "Grind", status: "no ritmo", value: "8/16 sessões", tone: "good" },
  { category: "Estudo", status: "abaixo", value: "3/6h", tone: "warning" },
  { category: "Review", status: "ok", value: "40/80 mãos", tone: "good" },
  { category: "Sport", status: "abaixo", value: "1/4 sessões", tone: "warning" },
] as const;

const coachFindings = [
  "Domingo tem muito grind e pouco descanso antes.",
  "O estudo está abaixo do ritmo mensal.",
  "Há review planeado, mas está concentrado tarde na semana.",
];

const coachSuggestions = [
  {
    title: "Adicionar descanso leve antes de domingo",
    detail: "Criar um bloco de descanso na sexta à noite para proteger energia.",
  },
  {
    title: "Antecipar review de mãos",
    detail: "Mover 20 mãos de segunda para sábado de manhã.",
  },
];

export function DashboardPrototype() {
  const [dayPrepared, setDayPrepared] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [commitments, setCommitments] = useState(initialCommitments);

  const doneCount = commitments.filter((commitment) => commitment.status === "done").length;

  function updateCommitment(id: string, status: CommitmentStatus) {
    setCommitments((current) =>
      current.map((commitment) =>
        commitment.id === id ? { ...commitment, status } : commitment,
      ),
    );
  }

  return (
    <div className="planner-shell">
      <aside className="planner-sidebar" aria-label="Navegação principal">
        <div className="planner-brand">
          <span className="planner-brand-mark" aria-hidden="true">
            CA
          </span>
          <div>
            <strong>Coach AI</strong>
            <span>Poker Planner</span>
          </div>
        </div>

        <nav className="planner-nav">
          {navItems.map((item) => (
            <button
              className={item === "Hoje" ? "planner-nav-item active" : "planner-nav-item"}
              type="button"
              key={item}
            >
              <span aria-hidden="true">{item.slice(0, 1)}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="planner-sidebar-footer">
          <button className="planner-nav-item muted" type="button">
            <span aria-hidden="true">D</span>
            Definições
          </button>
          <div className="planner-user">
            <span>DS</span>
            <div>
              <strong>Diogo Silva</strong>
              <small>Semana: quinta a quarta</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="planner-main">
        <header className="planner-topbar">
          <div>
            <span className="planner-kicker">Sexta-feira, 1 de maio</span>
            <h1>Hoje</h1>
            <p>Foco da semana: proteger energia para domingo.</p>
          </div>
          <div className="planner-topbar-actions">
            <span className="planner-mode-pill">
              {dayPrepared ? "Dia preparado" : "Dia por preparar"}
            </span>
            <AuthControls />
          </div>
        </header>

        <section className="planner-grid">
          <div className="planner-primary">
            <section className="planner-panel planner-action-panel">
              <div>
                <span className="planner-kicker">Próxima ação</span>
                <h2>{dayPrepared ? "Executar os compromissos de hoje" : "Preparar o dia"}</h2>
                <p>
                  {dayPrepared
                    ? "Mantém o dia focado nos compromissos escolhidos. Ajusta só se o contexto mudar."
                    : "Transforma os blocos planeados em 1 a 3 compromissos concretos para hoje."}
                </p>
              </div>
              {dayPrepared ? (
                <div className="planner-action-buttons">
                  <button className="planner-secondary-button" type="button">
                    Ajustar dia
                  </button>
                  <button className="planner-primary-button" type="button">
                    Fechar dia
                  </button>
                </div>
              ) : (
                <button
                  className="planner-primary-button"
                  type="button"
                  onClick={() => setDayPrepared(true)}
                >
                  Preparar o dia
                </button>
              )}
            </section>

            {dayPrepared ? (
              <section className="planner-panel">
                <div className="planner-section-heading">
                  <div>
                    <span className="planner-kicker">Modo execução</span>
                    <h2>Compromissos de hoje</h2>
                  </div>
                  <span className="planner-count-pill">
                    {doneCount}/{commitments.length} feito
                  </span>
                </div>

                <div className="planner-commitment-list">
                  {commitments.map((commitment) => (
                    <article className="planner-commitment" key={commitment.id}>
                      <div>
                        <span className="planner-source">{commitment.source}</span>
                        <h3>{commitment.title}</h3>
                        <p>{commitment.detail}</p>
                      </div>
                      <div className="planner-status-actions" aria-label="Atualizar estado">
                        <button
                          className={commitment.status === "done" ? "selected" : ""}
                          type="button"
                          onClick={() => updateCommitment(commitment.id, "done")}
                        >
                          Feito
                        </button>
                        <button
                          className={commitment.status === "adjusted" ? "selected" : ""}
                          type="button"
                          onClick={() => updateCommitment(commitment.id, "adjusted")}
                        >
                          Ajustar
                        </button>
                        <button
                          className={commitment.status === "missed" ? "selected risk" : ""}
                          type="button"
                          onClick={() => updateCommitment(commitment.id, "missed")}
                        >
                          Não fiz
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              <section className="planner-panel">
                <div className="planner-section-heading">
                  <div>
                    <span className="planner-kicker">Plano de hoje</span>
                    <h2>Blocos planeados</h2>
                  </div>
                  <button className="planner-ghost-button" type="button">
                    Editar plano semanal
                  </button>
                </div>

                <div className="planner-block-list">
                  {plannedBlocks.map((block) => (
                    <article className="planner-block" key={block.id}>
                      <span>{block.type}</span>
                      <div>
                        <h3>{block.title}</h3>
                        <p>{block.target}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className="planner-panel">
              <div className="planner-section-heading">
                <div>
                  <span className="planner-kicker">Semana de planeamento</span>
                  <h2>30 abr - 6 mai</h2>
                </div>
                <span className="planner-draft-link">Próxima semana em rascunho</span>
              </div>

              <div className="planner-week-strip">
                {planningWeek.map((day) => (
                  <article className={day.isToday ? "planner-day today" : "planner-day"} key={day.id}>
                    <div className="planner-day-header">
                      <strong>{day.label}</strong>
                      <span>{day.date}</span>
                    </div>
                    <div className="planner-chip-stack">
                      {day.chips.slice(0, 3).map((chip, index) => (
                        <span
                          className={`planner-chip ${chip.tone} ${chip.status ?? ""}`}
                          key={`${day.id}-${chip.label}-${index}`}
                        >
                          {chip.label}
                        </span>
                      ))}
                      {day.extra ? <span className="planner-chip muted">+{day.extra}</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="planner-context">
            <section className="planner-panel">
              <div className="planner-section-heading">
                <div>
                  <span className="planner-kicker">Ritmo mensal</span>
                  <h2>Maio</h2>
                </div>
              </div>
              <div className="planner-pace-list">
                {monthlyPace.map((item) => (
                  <div className="planner-pace-row" key={item.category}>
                    <div>
                      <strong>{item.category}</strong>
                      <span>{item.value}</span>
                    </div>
                    <span className={`planner-pace-status ${item.tone}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="planner-panel">
              <div className="planner-section-heading">
                <div>
                  <span className="planner-kicker">Atenção</span>
                  <h2>O que pode fugir</h2>
                </div>
              </div>
              <div className="planner-alert-list">
                <p>Estudo está abaixo do ritmo mensal.</p>
                <p>Domingo tem volume alto. Protege energia antes.</p>
              </div>
            </section>

            <section className="planner-panel planner-coach-card">
              <span className="planner-kicker">Coach AI</span>
              <h2>Rever plano semanal</h2>
              <p>
                O Coach deve rever o plano quando há dados suficientes, não substituir a tua decisão.
              </p>
              <button
                className="planner-secondary-button full"
                type="button"
                onClick={() => setCoachOpen(true)}
              >
                Rever com Coach
              </button>
            </section>
          </aside>
        </section>
      </main>

      {coachOpen ? (
        <div className="planner-drawer-backdrop" role="presentation">
          <aside className="planner-drawer" aria-label="Revisão do Coach AI">
            <div className="planner-drawer-header">
              <div>
                <span className="planner-kicker">Coach AI</span>
                <h2>Revisão do plano</h2>
              </div>
              <button
                className="planner-icon-button"
                type="button"
                aria-label="Fechar revisão do Coach"
                onClick={() => setCoachOpen(false)}
              >
                X
              </button>
            </div>

            <section>
              <h3>Riscos encontrados</h3>
              <ul className="planner-finding-list">
                {coachFindings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>Sugestões editáveis</h3>
              <div className="planner-suggestion-list">
                {coachSuggestions.map((suggestion) => (
                  <article className="planner-suggestion" key={suggestion.title}>
                    <h4>{suggestion.title}</h4>
                    <p>{suggestion.detail}</p>
                    <div>
                      <button className="planner-secondary-button" type="button">
                        Rever proposta
                      </button>
                      <button className="planner-ghost-button" type="button">
                        Ignorar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function AuthControls() {
  if (!isAuthConfigured) {
    return <span className="planner-auth-status">Modo demo</span>;
  }

  return <ClerkAuthControls />;
}

function ClerkAuthControls() {
  const { isLoaded, isSignedIn } = useUser();

  if (isLoaded && isSignedIn) {
    return (
      <div className="planner-account-menu" aria-label="Conta">
        <UserButton />
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="planner-secondary-button" type="button">
        Entrar
      </button>
    </SignInButton>
  );
}
