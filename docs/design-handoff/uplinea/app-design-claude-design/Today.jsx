// Hoje (Today) — operational dashboard. Two states:
//
//   "idle"     → before the player has prepared the day. Primary CTA: "Preparar dia".
//                Shows weekly focus, today's planned blocks (read-only context),
//                what to expect, and pending items.
//
//   "prepared" → after preparation. Shows today's commitments (1–3 actions
//                chosen during prepare-day) as the dominant content.
//                Planned blocks shown as secondary context underneath.
//                CTAs: "Ajustar dia" (secondary) + "Fechar dia" (end-of-day).
//
// Commitments and planned blocks are NEVER mixed into a single list.

const PREP_DEFAULTS = [
  { id:'c1', text:'Rever 5 mãos marcadas da sessão de ontem (ICM, river difícil)', kind:'Revisão', est:'30m', done:false, adjusted:false, notDone:false },
  { id:'c2', text:'Manter disciplina em ICM até bolha — sem pagar river sem motivo', kind:'Foco', est:'sessão da noite', done:false, adjusted:false, notDone:false },
  { id:'c3', text:'25m de estudo de open ranges antes da sessão da manhã', kind:'Estudo', est:'25m', done:false, adjusted:false, notDone:false },
];

const TODAY_BLOCKS = [
  { category:'Estudo', title:'ICM até bolha', target:'45m', status:'done' },
  { category:'Grind',  title:'Sessão MTT — manhã', target:'2h', status:'done' },
  { category:'Review', title:'Rever 5 mãos da sessão de ontem', target:'30m', status:'planned' },
  { category:'Sport',  title:'Corrida — recovery', target:'40m', status:'planned' },
  { category:'Grind',  title:'Sessão MTT — noite', target:'3h', status:'planned' },
];

function Today({ setRoute, onStart, onAskCoach, prepared, onPrepare, onAdjust, onCloseDay, commitments, setCommitments }) {
  const updateC = (id, patch) =>
    setCommitments(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Quinta · 14 Maio · semana 18</div>
          <h1>Bom dia, João.</h1>
          <p>Foco da semana · <strong>Executar com disciplina, não com volume.</strong></p>
        </div>
        <div className="page-actions">
          {prepared ? (
            <>
              <Btn variant="ghost" size="md" icon={<Icon.Edit size={14}/>} onClick={onAdjust}>Ajustar dia</Btn>
              <Btn variant="primary" size="md" icon={<Icon.Play size={14}/>} onClick={onStart}>Iniciar sessão</Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" size="md" icon={<Icon.Edit size={14}/>}>Editar foco</Btn>
              <Btn variant="primary" size="md" icon={<Icon.Check size={14}/>} onClick={onPrepare}>Preparar dia</Btn>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {prepared ? (
            <Card>
              <div className="card-head">
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <BrandIcon.Foco size={20}/>
                  <h3>Compromissos de hoje</h3>
                </div>
                <div className="card-meta">{commitments.filter(c => c.done).length} / {commitments.length} feitos</div>
              </div>
              <p style={{font:'var(--t-small)',color:'var(--fg-2)',marginBottom:14}}>
                Escolhidos esta manhã. O que ficar por fazer ao final do dia entra na revisão de amanhã.
              </p>
              {commitments.map(c => (
                <CommitmentRow key={c.id} c={c} onUpdate={p => updateC(c.id, p)}/>
              ))}
            </Card>
          ) : (
            <Card>
              <div className="card-head">
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <BrandIcon.Foco size={20}/>
                  <h3>Compromissos de hoje</h3>
                </div>
                <Pill status="planned">Por preparar</Pill>
              </div>
              <div className="prepare-empty">
                <div className="prepare-empty-art">
                  <img src="assets/motif-bars.svg" alt=""/>
                </div>
                <p>Em 60 segundos, escolhe 1 a 3 ações práticas que tornam este dia bem executado.</p>
                <Btn variant="primary" icon={<Icon.Check size={14}/>} onClick={onPrepare}>Preparar dia</Btn>
              </div>
            </Card>
          )}

          {/* PLANNED BLOCKS — always secondary context, never mixed with commitments */}
          <Card>
            <div className="card-head">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <BrandIcon.Plano size={20}/>
                <h3>Blocos planeados</h3>
                <span className="ctx-tag">contexto da semana</span>
              </div>
              <div className="card-meta">3 / 5 feitos</div>
            </div>
            {TODAY_BLOCKS.map((b,i) => (
              <PlanBlock key={i} block={b}/>
            ))}
          </Card>

          {!prepared && (
            <Card>
              <div className="card-head">
                <h3>Atenção</h3>
                <div className="card-meta">3 itens</div>
              </div>
              <AttRow tone="warn" icon={<Icon.Clock size={14}/>}
                title="Estudo abaixo do ritmo"
                desc="3h 15m de 5h previstas — adiciona 45 min antes da próxima sessão"
                action="Resolver"/>
              <AttRow tone="info" icon={<Icon.Hand size={14}/>}
                title="3 mãos pendentes para rever"
                desc="Marcadas na sessão de ontem (ICM, bluff catch, river difícil)"
                action="Rever" onAction={() => setRoute('sessions')}/>
              <AttRow tone="danger" icon={<Icon.X size={14}/>}
                title='Bloco "Corrida" não feito 3x'
                desc="Padrão de adiamento — Coach pode propor reformulação"
                action="Pedir ao Coach" onAction={onAskCoach}/>
            </Card>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <div className="card-head">
              <h4>Progresso semanal</h4>
              <div className="card-meta">semana 18</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:6 }}>
              <Metric label="Grind" value="9h / 14h" sub="64% · no ritmo"/>
              <Metric label="Estudo" value="3h 15m / 5h" sub="−40m vs ritmo" valStyle={{color:'var(--ep-state-warning)'}}/>
              <Metric label="Revisão" value="1h 10m / 2h" sub="−15m vs ritmo"/>
              <Metric label="Sport" value="2h / 3h" sub="no ritmo"/>
            </div>
            <div style={{height:1,background:'var(--border-1)',margin:'14px 0'}}/>
            <div className="metric"><div className="lbl">Mês · Maio</div></div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
              <div className="num" style={{font:'600 18px/1 var(--font-display)'}}>42h / 80h</div>
              <div className="num" style={{color:'var(--fg-3)'}}>52% · projeção 78h</div>
            </div>
            <div style={{marginTop:8}}><ProgressBar value={42} max={80}/></div>
          </Card>

          <Card refl>
            <div className="card-head">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <Icon.Sparkles size={18} style={{color:'var(--ep-teal-500)'}}/>
                <h4>Coach</h4>
              </div>
              <div className="card-meta">há 2 min</div>
            </div>
            <CoachInsight
              text="Tens uma sessão pendente de revisão e estudo abaixo do ritmo. Antes da grind da noite, posso preparar uma proposta com 30 min de revisão e 25 min de ICM."
              ctx="plano da semana + 3 últimas sessões"
              onAsk={onAskCoach}/>
          </Card>

          {prepared && (
            <Btn variant="ghost" size="lg" icon={<Icon.Check size={14}/>} onClick={onCloseDay}>
              Fechar dia
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

function CommitmentRow({ c, onUpdate }) {
  const status =
    c.done ? 'done' : c.adjusted ? 'adj' : c.notDone ? 'nd' : 'planned';
  return (
    <div className={`commitment ${status}`}>
      <div className="kind">
        <span className={`kind-tag ${c.kind.toLowerCase()}`}>{c.kind}</span>
        <span className="est">{c.est}</span>
      </div>
      <div className="text">{c.text}</div>
      <div className="actions">
        <button
          className={`act-btn ${c.done ? 'on' : ''}`}
          onClick={() => onUpdate({ done: !c.done, adjusted: false, notDone: false })}>
          <Icon.Check size={13}/>Feito
        </button>
        <button
          className={`act-btn ${c.adjusted ? 'on' : ''}`}
          onClick={() => onUpdate({ adjusted: !c.adjusted, done: false, notDone: false })}>
          <Icon.Edit size={12}/>Ajustar
        </button>
        <button
          className={`act-btn ${c.notDone ? 'on' : ''}`}
          onClick={() => onUpdate({ notDone: !c.notDone, done: false, adjusted: false })}>
          <Icon.X size={13}/>Não feito
        </button>
      </div>
    </div>
  );
}

window.Today = Today;
window.PREP_DEFAULTS = PREP_DEFAULTS;
