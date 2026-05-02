// Active session — dedicated, calm, distinctive surface.
//
// Sections, top to bottom:
//   1. Focus banner            — weekly focus, session focus, timer, linked block
//   2. Current state strip     — energy / focus / tilt / tables / hands to review
//   3. Quick capture grid      — Check-up rápido / Mão para rever / Nota / Micro-intenção
//   4. Timeline (3–5 items)    — last events
//   5. Contextual Coach insight (READ-ONLY — no open chat during play)
//   6. Primary CTA: Terminar sessão
//
// No open Coach chat is offered while a session is active. Coach surfaces only
// short, passive observations — not a conversation.

function ActiveSession({ onFinish, onCheckup, onHand, onNote, onIntent }) {
  const events = [
    { time:'14:32', icon:<Icon.Pulse size={12}/>, ttl:'Quick check-up', desc:'Energia 4 · Foco 4 · Tilt 1 · 6 mesas' },
    { time:'14:18', icon:<Icon.Hand size={12}/>, ttl:'Mão para rever — ICM', desc:'Stack 12bb · UTG · QQ · open shove' },
    { time:'13:56', icon:<Icon.Note size={12}/>, ttl:'Nota — distração', desc:'Pausa de 2 min para água' },
    { time:'13:12', icon:<Icon.Flag size={12}/>, ttl:'Micro-intenção', desc:'Não pagar river sem motivo' },
    { time:'12:45', icon:<Icon.Play size={12}/>, ttl:'Sessão iniciada', desc:'Foco · Disciplina em ICM até bolha' },
  ];

  return (
    <div className="page page-wide">
      {/* 1. FOCUS BANNER ---------------------------------------------------- */}
      <div className="active-banner">
        <img src="assets/motif-bars.svg" alt="" aria-hidden="true" className="active-banner-art"/>

        <div className="active-banner-grid">
          <div>
            <div className="ab-eyebrow">Foco da semana · semana 18</div>
            <div className="ab-weekly">Executar com disciplina, não com volume.</div>

            <div className="ab-divider"/>

            <div className="ab-eyebrow" style={{marginTop:14}}>Foco da sessão</div>
            <h2 className="ab-session">Disciplina em ICM até bolha</h2>

            <div className="ab-meta">
              <span className="ab-block-link">
                <span className="dot" style={{background:'#1D4EDB'}}/>Grind · Sessão MTT — manhã (2h)
              </span>
            </div>
          </div>

          <div className="ab-timer-wrap">
            <div className="ab-eyebrow">Em curso</div>
            <div className="ab-timer">1:24:38</div>
            <div className="ab-timer-meta">iniciada às 13:14 · 6 mesas</div>
            <span className="pulse-lg"/>
          </div>
        </div>

        <div className="ab-intent">
          <BrandIcon.Foco size={20} accent="#06B6C4" style={{color:'rgba(255,255,255,.85)'}}/>
          <div>
            <div className="ab-eyebrow" style={{color:'rgba(255,255,255,.6)'}}>Micro-intenção atual</div>
            <div className="ab-intent-text">Não pagar river sem motivo claro.</div>
          </div>
          <div className="ab-intent-age">há 1h 12m</div>
        </div>
      </div>

      {/* 2. CURRENT STATE STRIP --------------------------------------------- */}
      <div className="state-strip">
        <StateCell label="Energia" value="4 / 5" tone="ok"/>
        <StateCell label="Foco" value="4 / 5" tone="ok"/>
        <StateCell label="Tilt" value="2 / 5" tone="warn" delta="↑ desde 14:32"/>
        <StateCell label="Mesas" value="6"/>
        <StateCell label="Mãos a rever" value="3" linkLabel="ver"/>
        <StateCell label="Último check-up" value="há 11 min"/>
      </div>

      {/* 3 + 4 + 5 — capture full-width, then timeline + coach */}
      <div className="active-shell-2">
        {/* 3. QUICK CAPTURE — full width */}
        <Card className="as-capture">
          <div className="card-head">
            <h3>Captura rápida</h3>
            <div className="card-meta">um clique · sem sair de jogo</div>
          </div>
          <div className="qc-grid">
            <button className="qc-btn" onClick={onCheckup}>
              <div className="ico"><Icon.Pulse size={20}/></div>
              <div>
                <div className="ttl">Check-up rápido</div>
                <span className="desc">Energia · Foco · Tilt · mesas</span>
              </div>
              <span className="qc-key">C</span>
            </button>
            <button className="qc-btn" onClick={onHand}>
              <div className="ico"><Icon.Hand size={20}/></div>
              <div>
                <div className="ttl">Mão para rever</div>
                <span className="desc">Marca a mão e adiciona contexto</span>
              </div>
              <span className="qc-key">M</span>
            </button>
            <button className="qc-btn" onClick={onNote}>
              <div className="ico"><Icon.Note size={20}/></div>
              <div>
                <div className="ttl">Nota rápida</div>
                <span className="desc">Autopiloto · Tilt · Distração</span>
              </div>
              <span className="qc-key">N</span>
            </button>
            <button className="qc-btn" onClick={onIntent}>
              <div className="ico"><Icon.Flag size={20}/></div>
              <div>
                <div className="ttl">Micro-intenção</div>
                <span className="desc">Foco para a próxima hora</span>
              </div>
              <span className="qc-key">I</span>
            </button>
          </div>
        </Card>

        {/* 4. TIMELINE */}
        <Card className="as-timeline">
          <div className="card-head"><h3>Linha do tempo</h3><div className="card-meta">últimos 5 eventos</div></div>
          <div className="timeline">
            {events.map((e,i) => (
              <div key={i} className="tl-row">
                <div className="time">{e.time}</div>
                <div className="ico">{e.icon}</div>
                <div className="body"><div className="ttl">{e.ttl}</div><div className="desc">{e.desc}</div></div>
              </div>
            ))}
          </div>
        </Card>

        {/* 5. CONTEXTUAL COACH (READ-ONLY) */}
        <div className="as-coach" style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="active-coach">
            <div className="active-coach-head">
              <Icon.Sparkles size={14}/>
              <span>Observação do Coach</span>
              <span className="passive-tag">passivo</span>
            </div>
            <p>Tilt subiu de 1 para 2 no último check-up. Mantém-te no plano: respira entre mesas, evita abrir mais uma mesa nesta hora.</p>
            <div className="ctx">contexto · check-ups da sessão</div>
          </div>

          <div className="active-coach quiet">
            <div className="active-coach-head">
              <Icon.Clock size={14}/>
              <span>Próximo check-up sugerido</span>
            </div>
            <p>Em 19 minutos, ou ao terminar uma mesa.</p>
          </div>

          <Btn variant="primary" size="lg" onClick={onFinish} icon={<Icon.Stop size={14}/>}>
            Terminar sessão
          </Btn>
          <Btn variant="ghost" size="md" icon={<Icon.Pause size={14}/>}>Pausa</Btn>
        </div>
      </div>
    </div>
  );
}

function StateCell({ label, value, tone, delta, linkLabel }) {
  return (
    <div className={`state-cell ${tone || ''}`}>
      <div className="lbl">{label}</div>
      <div className="val">{value}{linkLabel ? <a className="link"> · {linkLabel}</a> : null}</div>
      {delta ? <div className="delta">{delta}</div> : null}
    </div>
  );
}

window.ActiveSession = ActiveSession;
