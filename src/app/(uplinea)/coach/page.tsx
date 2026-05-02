import {
  ArrowUp,
  Check,
  CircleDot,
  Clock3,
  Edit3,
  Lock,
  Search,
  Sparkles,
  X,
} from "lucide-react";

const contextSources = [
  { label: "Plano semanal", state: "Ativo" },
  { label: "Objetivos mensais", state: "Abaixo no Estudo" },
  { label: "3 últimas sessões", state: "Usado" },
  { label: "Revisão semanal", state: "Em falta" },
];

const promptChips = [
  "Ajusta esta semana",
  "Analisa o ritmo do mês",
  "Sugere uma sessão de estudo",
  "Analisa as últimas sessões",
  "Estou perdido - o que devo fazer hoje?",
];

const proposalItems = [
  {
    title: "Sexta · Review · 45 min",
    detail: "Rever mãos prioritárias antes da grind da noite.",
  },
  {
    title: "Sábado · Estudo · 30 min",
    detail: "ICM curto antes da primeira sessão.",
  },
];

export default function CoachPage() {
  return (
    <section className="ep-coach-page" aria-labelledby="coach-title">
      <header className="ep-coach-header">
        <div>
          <span className="ep-coach-eyebrow">Coach AI</span>
          <h1 id="coach-title">Coach</h1>
          <p>Direto, calmo e prático. Nunca altera o teu plano sem confirmação.</p>
        </div>

        <div className="ep-coach-status" aria-label="Estado do Coach">
          <span />
          Mock contextual
        </div>
      </header>

      <div className="ep-coach-shell">
        <main className="ep-coach-chat" aria-label="Conversa com Coach AI">
          <article className="ep-coach-message user">
            <div className="ep-coach-avatar">
              <Edit3 size={14} aria-hidden="true" />
            </div>
            <div>
              <p>Estudo está abaixo do ritmo. O que faço esta semana?</p>
              <time>Hoje · 10:24</time>
            </div>
          </article>

          <article className="ep-coach-message coach">
            <div className="ep-coach-avatar">
              <Sparkles size={15} aria-hidden="true" />
            </div>
            <div>
              <p>
                Estudo está 1h45 abaixo do ritmo e tens 12 mãos por rever. Em vez de
                aumentar volume, a melhor próxima ação é proteger um bloco curto de
                Review antes da próxima grind.
              </p>
              <p>
                Mantém o volume de Grind intacto. O ajuste deve resolver o atraso de
                estudo sem transformar a semana num plano irrealista.
              </p>
              <div className="ep-coach-context-line">
                <span />
                Contexto: plano semanal + objetivos mensais + 3 últimas sessões
              </div>
            </div>
          </article>

          <article className="ep-coach-proposal" aria-label="Proposta do Coach">
            <div className="ep-coach-proposal-head">
              <span className="ep-coach-pill">Proposta</span>
              <div>
                <h2>Adicionar 2 blocos curtos de Review/Estudo</h2>
                <p>Plano desta semana · 2 alterações</p>
              </div>
            </div>

            <p className="ep-coach-proposal-copy">
              Nada é aplicado até confirmares. Revê a proposta, edita se for preciso,
              e só depois aplica.
            </p>

            <div className="ep-coach-proposal-list">
              {proposalItems.map((item) => (
                <div className="ep-coach-proposal-row" key={item.title}>
                  <span>
                    <CircleDot size={13} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="ep-coach-confirm-box">
              <Lock size={14} aria-hidden="true" />
              <span>Aplicar alteração exige confirmação explícita.</span>
            </div>

            <div className="ep-coach-actions">
              <button className="ep-coach-button text" type="button">
                <X size={14} aria-hidden="true" />
                Ignorar
              </button>
              <button className="ep-coach-button ghost" type="button">
                <Search size={14} aria-hidden="true" />
                Rever proposta
              </button>
              <button className="ep-coach-button primary" type="button">
                <Check size={14} aria-hidden="true" />
                Aplicar alteração
              </button>
            </div>
          </article>

          <section className="ep-coach-composer" aria-label="Perguntar ao Coach">
            <textarea placeholder="Pergunta ao Coach..." rows={3} />
            <div className="ep-coach-composer-footer">
              <div className="ep-coach-context-line">
                <span />
                Contexto: plano semanal + sessões recentes
              </div>
              <button className="ep-coach-send" type="button" aria-label="Enviar pergunta">
                <ArrowUp size={16} aria-hidden="true" />
              </button>
            </div>
          </section>

          <div className="ep-coach-prompts" aria-label="Prompts sugeridos">
            {promptChips.map((prompt) => (
              <button key={prompt} type="button">
                {prompt}
              </button>
            ))}
          </div>
        </main>

        <aside className="ep-coach-side" aria-label="Contexto usado pelo Coach">
          <section className="ep-coach-panel">
            <div className="ep-coach-panel-head">
              <span>Contexto usado</span>
              <Sparkles size={16} aria-hidden="true" />
            </div>
            <div className="ep-coach-source-list">
              {contextSources.map((source) => (
                <div className="ep-coach-source" key={source.label}>
                  <strong>{source.label}</strong>
                  <small>{source.state}</small>
                </div>
              ))}
            </div>
            <p>
              Resultado financeiro não incluído. O Coach só usa esse dado com permissão
              explícita em cada sessão.
            </p>
          </section>

          <section className="ep-coach-panel quiet">
            <div className="ep-coach-panel-head">
              <span>Limites</span>
              <Lock size={16} aria-hidden="true" />
            </div>
            <ul className="ep-coach-boundaries">
              <li>Não faz análise técnica de mãos.</li>
              <li>Não sugere shove, call, fold ou sizing.</li>
              <li>Não aplica alterações sem confirmação.</li>
            </ul>
          </section>

          <section className="ep-coach-panel quiet">
            <div className="ep-coach-panel-head">
              <span>Próxima ação</span>
              <Clock3 size={16} aria-hidden="true" />
            </div>
            <p>
              Validar se esta proposta deve abrir uma preview editável quando o slice de
              aplicação ao plano estiver pronto.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
}
