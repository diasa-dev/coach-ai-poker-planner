"use client";

import {
  Activity,
  ArrowRight,
  Flag,
  Hand,
  Lock,
  MessageSquareText,
  Pause,
  Play,
  Search,
  Sparkles,
  Square,
} from "lucide-react";
import { useMemo, useState } from "react";

import styles from "./poker-sessions.module.css";

type SessionStatus = "active" | "pending" | "reviewed";
type Modal = "start" | "checkup" | "hand" | "note" | "intent" | "review" | null;

type SessionRow = {
  id: string;
  date: string;
  focus: string;
  tournaments: number;
  duration: string;
  quality: number;
  tiltPeak: number;
  hands: number;
  status: SessionStatus;
};

type TimelineEvent = {
  time: string;
  title: string;
  detail: string;
};

const initialRows: SessionRow[] = [
  {
    id: "session-14-may",
    date: "14 Mai",
    focus: "Disciplina em ICM até bolha",
    tournaments: 6,
    duration: "2h 04m",
    quality: 4,
    tiltPeak: 1,
    hands: 3,
    status: "pending",
  },
  {
    id: "session-13-may",
    date: "13 Mai",
    focus: "Não jogar em autopilot",
    tournaments: 8,
    duration: "3h 12m",
    quality: 3,
    tiltPeak: 2,
    hands: 2,
    status: "reviewed",
  },
  {
    id: "session-12-may",
    date: "12 Mai",
    focus: "Aproveitar fold equity nos bubbles",
    tournaments: 7,
    duration: "2h 48m",
    quality: 4,
    tiltPeak: 1,
    hands: 1,
    status: "reviewed",
  },
  {
    id: "session-10-may",
    date: "10 Mai",
    focus: "Voltar a jogar com clareza",
    tournaments: 5,
    duration: "1h 50m",
    quality: 3,
    tiltPeak: 3,
    hands: 4,
    status: "reviewed",
  },
];

const timeline: TimelineEvent[] = [
  {
    time: "14:32",
    title: "Check-up rápido",
    detail: "Energia 4 · Foco 4 · Tilt 1 · 6 mesas",
  },
  {
    time: "14:18",
    title: "Mão para rever · ICM",
    detail: "Stack 12bb · UTG · QQ · open shove",
  },
  {
    time: "13:56",
    title: "Nota rápida · distração",
    detail: "Pausa curta para água antes de abrir mais mesas",
  },
  {
    time: "13:12",
    title: "Micro-intenção",
    detail: "Não pagar river sem motivo claro",
  },
  {
    time: "12:45",
    title: "Sessão iniciada",
    detail: "Foco · Disciplina em ICM até bolha",
  },
];

const microIntentions = [
  "Mais calma",
  "Menos mesas",
  "ICM consciente",
  "Sem autopilot",
  "Decisões mais lentas",
  "Proteger energia",
];

const handTemplates = ["ICM", "Big pot", "Bluff catch", "All-in marginal", "River difícil", "Exploit/read", "Erro emocional"];
const noteTemplates = ["Autopilot", "Cansaço", "Tilt", "Distração", "Mesa extra", "Boa decisão", "Dúvida técnica"];

const statusCopy: Record<SessionStatus, string> = {
  active: "Em curso",
  pending: "Review pendente",
  reviewed: "Revista",
};

export function PokerSessions() {
  const [modal, setModal] = useState<Modal>(null);
  const [view, setView] = useState<"history" | "active">("history");
  const [rows, setRows] = useState(initialRows);
  const [activeSession, setActiveSession] = useState(false);
  const [pendingReview, setPendingReview] = useState(true);
  const [sessionFocus, setSessionFocus] = useState("Disciplina em ICM até bolha");
  const [microIntention, setMicroIntention] = useState("Não pagar river sem motivo claro.");
  const [selectedIntent, setSelectedIntent] = useState("Sem autopilot");
  const [selectedHand, setSelectedHand] = useState("ICM");
  const [selectedNote, setSelectedNote] = useState("Autopilot");
  const [includeFinancialResult, setIncludeFinancialResult] = useState(false);

  const summary = useMemo(() => {
    const reviewedRows = rows.filter((row) => row.status === "reviewed");
    const averageQuality =
      reviewedRows.reduce((total, row) => total + row.quality, 0) / Math.max(reviewedRows.length, 1);

    return {
      sessions: rows.length,
      hands: rows.reduce((total, row) => total + row.hands, 0),
      averageQuality: Math.round(averageQuality * 10) / 10,
    };
  }, [rows]);

  const startSession = () => {
    setActiveSession(true);
    setPendingReview(false);
    setRows((currentRows) => [
      {
        id: "session-active",
        date: "Hoje",
        focus: sessionFocus,
        tournaments: 0,
        duration: "1h 24m",
        quality: 0,
        tiltPeak: 2,
        hands: 3,
        status: "active",
      },
      ...currentRows.filter((row) => row.id !== "session-active"),
    ]);
    setModal(null);
    setView("active");
  };

  const finishSession = () => {
    setActiveSession(false);
    setPendingReview(true);
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === "session-active"
          ? { ...row, status: "pending", tournaments: 6, quality: 4, duration: "2h 04m" }
          : row,
      ),
    );
    setModal(null);
    setView("history");
  };

  const confirmReview = () => {
    setPendingReview(false);
    setRows((currentRows) =>
      currentRows.map((row) => (row.status === "pending" ? { ...row, status: "reviewed" } : row)),
    );
    setModal(null);
  };

  return (
    <section className="ep-page">
      <div className="ep-page-header">
        <div>
          <span>Histórico</span>
          <h1>Sessões</h1>
          <p>Cada sessão alimenta o Coach com contexto real, sem transformar a app num tracker financeiro.</p>
        </div>
        <div className="ep-page-actions">
          <button className="ep-button secondary" type="button">
            <Search size={15} aria-hidden="true" />
            Filtrar
          </button>
          <button className="ep-button primary" type="button" onClick={() => setModal("start")}>
            <Play size={15} aria-hidden="true" />
            Iniciar sessão
          </button>
        </div>
      </div>

      {view === "active" && activeSession ? (
        <ActiveSession
          microIntention={microIntention}
          onCapture={setModal}
          onFinish={() => setModal("review")}
          sessionFocus={sessionFocus}
        />
      ) : (
        <>
          <div className={styles.statusGrid}>
            {activeSession ? (
              <article className={styles.statusCard}>
                <div>
                  <span>Sessão ativa</span>
                  <h2>{sessionFocus}</h2>
                  <p>Iniciada às 13:14 · Grind · Sessão MTT manhã</p>
                </div>
                <button className="ep-button primary" type="button" onClick={() => setView("active")}>
                  Voltar à sessão
                </button>
              </article>
            ) : null}

            {pendingReview ? (
              <article className={styles.statusCard}>
                <div>
                  <span>Review pendente</span>
                  <h2>Terminar e rever a sessão de hoje</h2>
                  <p>Fecha a sessão enquanto os sinais ainda estão frescos.</p>
                </div>
                <button className="ep-button primary" type="button" onClick={() => setModal("review")}>
                  Terminar e rever
                </button>
              </article>
            ) : null}
          </div>

          <div className={styles.sessionLayout}>
            <article className={styles.historyPanel}>
              <header className={styles.tableHeader}>
                <span>Data</span>
                <span>Foco</span>
                <span>Torneios</span>
                <span>Duração</span>
                <span>Qual.</span>
                <span>Tilt</span>
                <span>Estado</span>
                <span />
              </header>
              {rows.map((row) => (
                <div className={styles.tableRow} key={row.id}>
                  <span className={styles.mono}>{row.date}</span>
                  <strong>{row.focus}</strong>
                  <span className={styles.mono}>{row.tournaments || "-"}</span>
                  <span className={styles.mono}>{row.duration}</span>
                  <span className={styles.mono}>{row.quality ? `${row.quality}/5` : "-"}</span>
                  <span className={styles.mono}>{row.tiltPeak}/5</span>
                  <span className={`${styles.statusPill} ${styles[row.status]}`}>{statusCopy[row.status]}</span>
                  <button
                    aria-label={`Abrir sessão de ${row.date}`}
                    className={styles.iconButton}
                    type="button"
                    onClick={() => (row.status === "active" ? setView("active") : undefined)}
                  >
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </article>

            <aside className={styles.sideStack}>
              <article className={styles.summaryPanel}>
                <span>Resumo leve</span>
                <dl>
                  <div>
                    <dt>Sessões</dt>
                    <dd>{summary.sessions}</dd>
                  </div>
                  <div>
                    <dt>Qualidade média</dt>
                    <dd>{summary.averageQuality}/5</dd>
                  </div>
                  <div>
                    <dt>Mãos a rever</dt>
                    <dd>{summary.hands}</dd>
                  </div>
                </dl>
              </article>

              <article className={styles.coachPanel}>
                <Sparkles size={17} aria-hidden="true" />
                <div>
                  <span>Coach AI</span>
                  <p>Muitas mãos marcadas sem bloco de review devem gerar atenção no próximo planeamento.</p>
                  <small>contexto · últimas sessões + backlog de mãos</small>
                </div>
              </article>
            </aside>
          </div>
        </>
      )}

      {modal === "start" ? (
        <ModalFrame title="Iniciar sessão" onClose={() => setModal(null)}>
          <div className={styles.formGrid}>
            <label className={styles.fullField}>
              Foco da sessão
              <input value={sessionFocus} onChange={(event) => setSessionFocus(event.target.value)} />
            </label>
            <label>
              Bloco de grind (opcional)
              <select defaultValue="morning">
                <option value="morning">Grind · Sessão MTT manhã (2h)</option>
                <option value="none">Sem bloco associado</option>
              </select>
            </label>
            <label>
              Energia inicial
              <select defaultValue="4">
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
              </select>
            </label>
            <label>
              Foco inicial
              <select defaultValue="4">
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
              </select>
            </label>
            <label>
              Tilt inicial
              <select defaultValue="1">
                <option>0</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
              </select>
            </label>
            <label>
              Máximo de mesas
              <input defaultValue="6" inputMode="numeric" />
            </label>
            <label className={styles.fullField}>
              Regra de qualidade
              <input defaultValue="Decisão de qualidade antes de volume." />
            </label>
          </div>
          <TemplatePicker
            label="Micro-intenção inicial"
            options={microIntentions}
            selected={selectedIntent}
            onSelect={(value) => {
              setSelectedIntent(value);
              setMicroIntention(value);
            }}
          />
          <div className={styles.modalActions}>
            <button className="ep-button secondary" type="button" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button className="ep-button primary" type="button" onClick={startSession}>
              Iniciar sessão
            </button>
          </div>
        </ModalFrame>
      ) : null}

      {modal === "checkup" ? (
        <QuickModal title="Check-up rápido" onClose={() => setModal(null)}>
          <div className={styles.ratingGrid}>
            <Rating label="Energia" min={1} />
            <Rating label="Foco" min={1} />
            <Rating label="Tilt" min={0} />
          </div>
          <label className={styles.inlineField}>
            Mesas abertas
            <input defaultValue="6" inputMode="numeric" />
          </label>
        </QuickModal>
      ) : null}

      {modal === "hand" ? (
        <QuickModal title="Mão para rever" onClose={() => setModal(null)}>
          <TemplatePicker label="Template" options={handTemplates} selected={selectedHand} onSelect={setSelectedHand} />
          <label className={styles.inlineField}>
            Nota opcional
            <input placeholder="Ex.: QQ vs shove · 12bb · bubble" />
          </label>
        </QuickModal>
      ) : null}

      {modal === "note" ? (
        <QuickModal title="Nota rápida" onClose={() => setModal(null)}>
          <TemplatePicker label="Template" options={noteTemplates} selected={selectedNote} onSelect={setSelectedNote} />
          <label className={styles.inlineField}>
            Detalhe opcional
            <input placeholder="Contexto curto..." />
          </label>
        </QuickModal>
      ) : null}

      {modal === "intent" ? (
        <QuickModal title="Micro-intenção" onClose={() => setModal(null)}>
          <TemplatePicker
            label="Escolhe ou edita"
            options={microIntentions}
            selected={selectedIntent}
            onSelect={(value) => {
              setSelectedIntent(value);
              setMicroIntention(value);
            }}
          />
          <label className={styles.inlineField}>
            Texto
            <input value={microIntention} onChange={(event) => setMicroIntention(event.target.value)} />
          </label>
        </QuickModal>
      ) : null}

      {modal === "review" ? (
        <ModalFrame title="Terminar e rever sessão" onClose={() => setModal(null)}>
          <div className={styles.formGrid}>
            <label>
              Torneios jogados
              <input defaultValue="6" inputMode="numeric" />
            </label>
            <label>
              Duração
              <input defaultValue="2h 04m" disabled />
            </label>
            <label className={styles.fullField}>
              Resumo automático
              <textarea defaultValue="Energia média 3.5, foco estável e tilt baixo. 3 mãos ficaram marcadas para review." />
            </label>
            <Rating label="Qualidade de decisão" min={1} />
            <Rating label="Energia final" min={1} />
            <Rating label="Foco final" min={1} />
            <Rating label="Tilt final" min={0} />
            <label className={styles.fullField}>
              Boa decisão
              <input defaultValue="Fold disciplinado no river com linha muito polarizada." />
            </label>
            <label className={styles.fullField}>
              Principal leak/problema
              <input placeholder="Opcional" />
            </label>
            <label className={styles.fullField}>
              Próxima ação
              <input defaultValue="Rever as 3 mãos marcadas antes da próxima sessão." />
            </label>
          </div>

          <section className={styles.financialBox}>
            <Lock size={16} aria-hidden="true" />
            <div>
              <strong>Resultado financeiro · opcional</strong>
              <div className={styles.financialInputs}>
                <select defaultValue="EUR">
                  <option value="EUR">EUR €</option>
                  <option value="USD">USD $</option>
                </select>
                <input placeholder="+ ou - valor líquido" />
              </div>
              <label className={styles.toggleLine}>
                <input
                  checked={includeFinancialResult}
                  type="checkbox"
                  onChange={(event) => setIncludeFinancialResult(event.target.checked)}
                />
                Incluir resultado financeiro no contexto do Coach. Os dados financeiros nunca aparecem em painéis nem em gráficos.
              </label>
            </div>
          </section>

          <div className={styles.modalActions}>
            <button className="ep-button secondary" type="button" onClick={finishSession}>
              Guardar rascunho
            </button>
            <button className="ep-button primary" type="button" onClick={confirmReview}>
              Confirmar review
            </button>
          </div>
        </ModalFrame>
      ) : null}
    </section>
  );
}

function ActiveSession({
  microIntention,
  onCapture,
  onFinish,
  sessionFocus,
}: {
  microIntention: string;
  onCapture: (modal: Modal) => void;
  onFinish: () => void;
  sessionFocus: string;
}) {
  return (
    <div className={styles.activePage}>
      <article className={styles.focusBanner}>
        <div>
          <span>Foco da semana · semana 18</span>
          <p>Executar com disciplina, não com volume.</p>
          <h2>{sessionFocus}</h2>
          <small>Grind · Sessão MTT manhã (2h)</small>
        </div>
        <div className={styles.timerBox}>
          <span>Em curso</span>
          <strong>1:24:38</strong>
          <small>iniciada às 13:14 · 6 mesas</small>
        </div>
        <div className={styles.intentBox}>
          <Flag size={18} aria-hidden="true" />
          <div>
            <span>Micro-intenção atual</span>
            <strong>{microIntention}</strong>
          </div>
        </div>
      </article>

      <div className={styles.stateStrip}>
        <StateCell label="Energia" value="4/5" />
        <StateCell label="Foco" value="4/5" />
        <StateCell label="Tilt" value="2/5" warning="subiu desde 14:32" />
        <StateCell label="Mesas" value="6" />
        <StateCell label="Mãos a rever" value="3" />
        <StateCell label="Último check-up" value="há 11 min" />
      </div>

      <div className={styles.activeLayout}>
        <article className={styles.capturePanel}>
          <div className={styles.panelHead}>
            <div>
              <span>Captura rápida</span>
              <h2>Um clique, sem sair de jogo</h2>
            </div>
          </div>
          <div className={styles.captureGrid}>
            <CaptureButton icon={Activity} title="Check-up rápido" detail="Energia · Foco · Tilt · mesas" onClick={() => onCapture("checkup")} />
            <CaptureButton icon={Hand} title="Mão para rever" detail="Marca a mão e adiciona contexto" onClick={() => onCapture("hand")} />
            <CaptureButton icon={MessageSquareText} title="Nota rápida" detail="Autopilot · Tilt · Distração" onClick={() => onCapture("note")} />
            <CaptureButton icon={Flag} title="Micro-intenção" detail="Foco para a próxima hora" onClick={() => onCapture("intent")} />
          </div>
        </article>

        <article className={styles.timelinePanel}>
          <div className={styles.panelHead}>
            <div>
              <span>Linha do tempo</span>
              <h2>Últimos 5 eventos</h2>
            </div>
          </div>
          <ol>
            {timeline.map((event) => (
              <li key={`${event.time}-${event.title}`}>
                <time>{event.time}</time>
                <div>
                  <strong>{event.title}</strong>
                  <small>{event.detail}</small>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <aside className={styles.activeSide}>
          <article className={styles.passiveCoach}>
            <div>
              <Sparkles size={15} aria-hidden="true" />
              <span>Observação do Coach</span>
              <em>passivo</em>
            </div>
            <p>Tilt subiu de 1 para 2 no último check-up. Mantém-te no plano e evita abrir mais uma mesa nesta hora.</p>
            <small>contexto · check-ups da sessão</small>
          </article>
          <button className={`ep-button primary ${styles.actionButton}`} type="button" onClick={onFinish}>
            <Square size={14} aria-hidden="true" />
            Terminar sessão
          </button>
          <button className={`ep-button secondary ${styles.actionButton}`} type="button">
            <Pause size={14} aria-hidden="true" />
            Pausa
          </button>
        </aside>
      </div>
    </div>
  );
}

function CaptureButton({
  detail,
  icon: Icon,
  onClick,
  title,
}: {
  detail: string;
  icon: typeof Activity;
  onClick: () => void;
  title: string;
}) {
  return (
    <button className={styles.captureButton} type="button" onClick={onClick}>
      <span>
        <Icon size={19} aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </button>
  );
}

function StateCell({ label, value, warning }: { label: string; value: string; warning?: string }) {
  return (
    <div className={warning ? styles.stateCellWarning : styles.stateCell}>
      <span>{label}</span>
      <strong>{value}</strong>
      {warning ? <small>{warning}</small> : null}
    </div>
  );
}

function ModalFrame({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className={styles.overlay} role="presentation">
      <section aria-label={title} aria-modal="true" className={styles.modal} role="dialog">
        <header>
          <h2>{title}</h2>
          <button aria-label="Fechar" type="button" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function QuickModal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <ModalFrame title={title} onClose={onClose}>
      {children}
      <div className={styles.modalActions}>
        <button className="ep-button secondary" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="ep-button primary" type="button" onClick={onClose}>
          Guardar
        </button>
      </div>
    </ModalFrame>
  );
}

function TemplatePicker({
  label,
  onSelect,
  options,
  selected,
}: {
  label: string;
  onSelect: (value: string) => void;
  options: string[];
  selected: string;
}) {
  return (
    <div className={styles.templatePicker}>
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            className={selected === option ? styles.selectedTemplate : ""}
            key={option}
            type="button"
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Rating({ label, min }: { label: string; min: 0 | 1 }) {
  return (
    <div className={styles.rating}>
      <span>{label}</span>
      <div>
        {Array.from({ length: min === 0 ? 6 : 5 }, (_, index) => index + min).map((value) => (
          <button className={value === 4 ? styles.selectedRating : ""} key={value} type="button">
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
