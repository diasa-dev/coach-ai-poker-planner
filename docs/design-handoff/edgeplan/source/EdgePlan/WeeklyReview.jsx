// Revisão semanal (Weekly Review).
//
// Loop order is critical:
//   1. Auto summary
//   2. Plan vs reality by category (Grind / Estudo / Revisão / Sport)
//   3. Reasons for adjusted / not-done blocks
//   4. Player reflection (BEFORE coach suggestion)
//   5. Coach suggestion appears only AFTER reflection — explicit proposal card
//   6. CTAs: "Rever com Coach" (open conversation) and "Preparar próxima semana"
//
// The Coach can never edit the plan from this screen without going through the
// proposal review flow. See ProposalCard.

const REALITY = [
  { cat:'Grind',   plan:'14h',  real:'14h',     pct:100, tone:'ok',
    notes:[
      { status:'done', label:'Sessão MTT — manhã ×4',   est:'8h' },
      { status:'done', label:'Sessão MTT — noite ×2',   est:'6h' },
    ] },
  { cat:'Estudo',  plan:'5h',   real:'3h 15m',  pct:65, tone:'warn',
    notes:[
      { status:'done', label:'ICM até bolha ×2',           est:'1h 30m' },
      { status:'adj',  label:'Open ranges',                est:'45m → 25m', why:'Manhã atrasou, sessão começou logo.' },
      { status:'nd',   label:'Bluff catch',                est:'45m',       why:'Bloco da quinta saltado — fui direto à sessão.' },
    ] },
  { cat:'Revisão', plan:'2h',   real:'1h 10m',  pct:58, tone:'warn',
    notes:[
      { status:'done', label:'Revisão das mãos da sessão de terça', est:'40m' },
      { status:'adj',  label:'Revisão semanal de tendências',       est:'1h 15m → 30m', why:'Reduzida para chegar a tempo da sessão da noite.' },
    ] },
  { cat:'Sport',   plan:'3h',   real:'2h',      pct:67, tone:'warn',
    notes:[
      { status:'done', label:'Corrida — base × 2',  est:'1h 20m' },
      { status:'nd',   label:'Corrida — recovery',  est:'40m', why:'Adiada três vezes. Padrão recorrente.' },
    ] },
];

function WeeklyReview({ onStartConversation, onPrepareNextWeek }) {
  const [exec, setExec] = React.useState(4);
  const [energy, setEnergy] = React.useState(3);
  const [focus, setFocus] = React.useState(4);
  const [quality, setQuality] = React.useState(4);
  const [reflectionDone, setReflectionDone] = React.useState(false);
  const [reflection, setReflection] = React.useState({
    wins: 'Disciplina em ICM até bolha melhorou claramente. Tilt mantido baixo nas três sessões longas.',
    leaks:'Estudo cortado quando a sessão da manhã se atrasa. Bloco de Sport adiado três vezes.',
    next: 'Mover bloco de estudo para antes da sessão da manhã. Reduzir Sport para 2 blocos curtos.',
  });

  return (
    <div className="page reflective">
      <div className="page-head">
        <div>
          <div className="eyebrow">Semana 18 · 12–18 Maio</div>
          <h1>Revisão semanal</h1>
          <p>Recomendado, não obrigatório. 5 a 8 minutos.</p>
        </div>
      </div>

      {/* 1. AUTO SUMMARY ---------------------------------------------------- */}
      <Card refl>
        <div className="card-head">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <BrandIcon.Performance size={20}/>
            <h3>Resumo</h3>
          </div>
          <div className="card-meta">automático</div>
        </div>
        <p style={{font:'var(--t-body-lg)',marginBottom:14}}>
          14h de grind (planeado: 14h), 3h 15m de estudo (planeado: 5h), 1h 10m de revisão,
          2h de sport. Tilt médio baixo (1.4). Foco médio 4. Padrão: estudo abaixo do ritmo
          desde quarta.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          <Metric label="Grind" value="14h" sub="100% do plano"/>
          <Metric label="Estudo" value="3h 15m" sub="65% do plano" valStyle={{color:'var(--ep-state-warning)'}}/>
          <Metric label="Sessões" value="6" sub="3 revistas"/>
          <Metric label="Tilt méd." value="1.4" sub="−0.3 vs semana 17"/>
        </div>
      </Card>

      <div style={{height:20}}/>

      {/* 2. PLAN VS REALITY BY CATEGORY ------------------------------------ */}
      <Card refl>
        <div className="card-head">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <BrandIcon.Plano size={20}/>
            <h3>Plano vs realidade</h3>
          </div>
          <div className="card-meta">por categoria</div>
        </div>
        <div className="reality">
          {REALITY.map(r => (
            <div key={r.cat} className="reality-row">
              <div className="rr-head">
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span className="rr-cat" style={{color: CAT_COLOR[r.cat]}}>{r.cat}</span>
                  <span className="rr-num">{r.real} <span style={{color:'var(--fg-3)'}}>/ {r.plan}</span></span>
                </div>
                <ProgressBar value={r.pct} max={100} tone={r.tone === 'warn' ? 'warn' : ''}/>
              </div>
              <div className="rr-notes">
                {r.notes.map((n,i) => (
                  <div key={i} className="rr-note">
                    <Pill status={n.status === 'done' ? 'done' : n.status === 'adj' ? 'adj' : 'nd'}>
                      {n.status === 'done' ? 'Feito' : n.status === 'adj' ? 'Ajustado' : 'Não feito'}
                    </Pill>
                    <div className="rr-text">
                      <div className="rr-label">{n.label} <span className="rr-est">· {n.est}</span></div>
                      {n.why ? <div className="rr-why">{n.why}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{height:20}}/>

      {/* 3. RATINGS -------------------------------------------------------- */}
      <Card refl>
        <div className="card-head"><h3>Como te sentiste esta semana</h3></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:18}}>
          <div className="field"><label>Execução</label><Rating value={exec} onChange={setExec}/></div>
          <div className="field"><label>Energia</label><Rating value={energy} onChange={setEnergy}/></div>
          <div className="field"><label>Foco</label><Rating value={focus} onChange={setFocus}/></div>
          <div className="field"><label>Qualidade</label><Rating value={quality} onChange={setQuality}/></div>
        </div>
      </Card>

      <div style={{height:20}}/>

      {/* 4. PLAYER REFLECTION (must come BEFORE coach) --------------------- */}
      <Card refl>
        <div className="card-head">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <BrandIcon.Review size={20}/>
            <h3>A tua reflexão</h3>
          </div>
          <div className="card-meta">primeiro tu, depois o Coach</div>
        </div>
        <p style={{font:'var(--t-small)',color:'var(--fg-2)',marginBottom:16}}>
          Escreve antes de pedir uma sugestão. O Coach vê isto e responde com base no que disseres.
        </p>
        <div className="field" style={{marginBottom:14}}><label>Principais wins</label>
          <textarea className="textarea" value={reflection.wins}
            onChange={e=>setReflection({...reflection, wins:e.target.value})}/>
        </div>
        <div className="field" style={{marginBottom:14}}><label>Principais leaks · problemas</label>
          <textarea className="textarea" value={reflection.leaks}
            onChange={e=>setReflection({...reflection, leaks:e.target.value})}/>
        </div>
        <div className="field" style={{marginBottom:14}}><label>O que ajustarias para a próxima semana</label>
          <textarea className="textarea" value={reflection.next}
            onChange={e=>setReflection({...reflection, next:e.target.value})}/>
        </div>
        {!reflectionDone && (
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <Btn variant="primary" icon={<Icon.Check size={14}/>}
              onClick={() => setReflectionDone(true)}>
              Concluir reflexão
            </Btn>
          </div>
        )}
      </Card>

      <div style={{height:20}}/>

      {/* 5. COACH SUGGESTION — only after reflection ----------------------- */}
      {reflectionDone ? (
        <Card refl>
          <div className="card-head">
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <Icon.Sparkles size={18} style={{color:'var(--ep-teal-500)'}}/>
              <h3>Sugestão do Coach</h3>
            </div>
            <div className="card-meta">com base na tua reflexão</div>
          </div>
          <CoachInsight
            text="A tua reflexão indica que o estudo cai quando a manhã atrasa, e que o Sport tem um padrão de adiamento. Tenho uma proposta concreta para a semana 19 que aborda os dois."
            ctx="esta revisão · plano da semana 19 · 3 últimas semanas"/>

          <div style={{height:14}}/>

          <ProposalCard
            title="Mover Estudo para antes da sessão · reformular Sport"
            scope="Plano da semana 19 (4 alterações)"
            preview={[
              { label:'Fixar Estudo às 09:00 antes do Grind', detail:'Qui · Sex · Sáb · 30m cada' },
              { label:'Sport: 2 blocos × 25m em vez de 3 × 60m', detail:'Ter · Qui · após sessão da manhã' },
              { label:'Manter Foco da semana', detail:'Disciplina em ICM até bolha' },
              { label:'Manter volume de Grind', detail:'14h, sem alterações' },
            ]}/>
        </Card>
      ) : (
        <Card refl style={{opacity:.55}}>
          <div className="card-head">
            <div style={{display:'flex',alignItems:'center',gap:10,opacity:.7}}>
              <Icon.Sparkles size={18}/>
              <h3>Sugestão do Coach</h3>
            </div>
            <div className="card-meta">aparece depois da tua reflexão</div>
          </div>
          <p style={{color:'var(--fg-3)',marginTop:8}}>
            Conclui a reflexão acima primeiro. O Coach responde com base no que escreveres.
          </p>
        </Card>
      )}

      <div style={{height:24}}/>

      {/* 6. CTAs ----------------------------------------------------------- */}
      <div className="review-ctas">
        <Btn variant="ghost" size="lg" icon={<Icon.Sparkles size={14}/>} onClick={onStartConversation}>
          Rever com Coach
        </Btn>
        <Btn variant="primary" size="lg" icon={<Icon.Arrow size={14}/>} onClick={onPrepareNextWeek}>
          Preparar próxima semana
        </Btn>
      </div>
    </div>
  );
}
window.WeeklyReview = WeeklyReview;
