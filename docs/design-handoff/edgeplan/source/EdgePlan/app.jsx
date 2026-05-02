// Top-level App with routing + drawers/modals.
const { useState, useEffect } = React;

function StartSessionDrawer({ onClose, onConfirm }) {
  const [focus, setFocus] = useState('Disciplina em ICM até bolha');
  const [linked, setLinked] = useState('grind-am');
  const [intent, setIntent] = useState('');
  const [energy, setEnergy] = useState(4);
  const [foc, setFoc] = useState(4);
  const [tilt, setTilt] = useState(1);
  const [tables, setTables] = useState(6);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Drawer title="Iniciar sessão" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon={<Icon.Play size={14}/>} onClick={onConfirm}>Iniciar sessão</Btn>
      </>}>
      <div className="start-drawer">
        {/* primary — required */}
        <div className="field">
          <label>Foco da sessão</label>
          <input className="input" value={focus} onChange={e=>setFocus(e.target.value)} autoFocus/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div className="field">
            <label>Bloco</label>
            <select className="select" value={linked} onChange={e=>setLinked(e.target.value)}>
              <option value="grind-am">Grind · Manhã (2h)</option>
              <option value="grind-pm">Grind · Noite (3h)</option>
              <option value="">— sem bloco —</option>
            </select>
          </div>
          <div className="field">
            <label>Mesas</label>
            <input className="input" type="number" value={tables}
              onChange={e=>setTables(+e.target.value)}/>
          </div>
        </div>

        <div className="field">
          <label>Micro-intenção</label>
          <input className="input" placeholder='ex: "Não pagar river sem motivo"'
            value={intent} onChange={e=>setIntent(e.target.value)}/>
        </div>

        {/* state — Energy / Focus / Tilt in one compact row each */}
        <div className="start-block">
          <div className="b-head">
            <h4>Estado inicial</h4>
            <span className="b-toggle">opcional</span>
          </div>
          <div className="triple">
            <div className="field">
              <label>Energia</label>
              <SegRate value={energy} onChange={setEnergy}/>
            </div>
            <div className="field">
              <label>Foco</label>
              <SegRate value={foc} onChange={setFoc}/>
            </div>
            <div className="field">
              <label>Tilt</label>
              <SegRate value={tilt} onChange={setTilt} tone="tilt"/>
            </div>
          </div>
        </div>

        {/* advanced — hidden by default */}
        {showAdvanced ? (
          <div className="start-block">
            <div className="b-head">
              <h4>Avançado</h4>
              <button className="btn text sm" onClick={()=>setShowAdvanced(false)}>Ocultar</button>
            </div>
            <div className="field">
              <label>Regra de qualidade</label>
              <input className="input" placeholder='ex: "Stop se tilt = 3"'/>
            </div>
          </div>
        ) : (
          <button className="btn text sm" style={{alignSelf:'flex-start'}}
            onClick={()=>setShowAdvanced(true)}>
            + Adicionar regra de qualidade
          </button>
        )}
      </div>
    </Drawer>
  );
}

function CheckupDrawer({ onClose }) {
  const [e, setE] = useState(4); const [f, setF] = useState(4); const [t, setT] = useState(1);
  return (
    <Drawer title="Quick check-up" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn variant="primary" onClick={onClose} icon={<Icon.Check size={14}/>}>Registar</Btn></>}>
      <p style={{color:'var(--fg-2)',marginBottom:18}}>Demora 10 segundos. Não saias do jogo.</p>
      <div className="field" style={{marginBottom:14}}><label>Energia</label><Rating value={e} onChange={setE}/></div>
      <div className="field" style={{marginBottom:14}}><label>Foco</label><Rating value={f} onChange={setF}/></div>
      <div className="field" style={{marginBottom:14}}><label>Tilt</label><Rating value={t} onChange={setT}/></div>
      <div className="field" style={{marginBottom:14}}><label>Mesas atuais</label><input className="input" defaultValue="6"/></div>
      <div className="field"><label>Micro-intenção para próxima hora</label><input className="input" placeholder="Opcional"/></div>
    </Drawer>
  );
}

function HandDrawer({ onClose }) {
  return (
    <Drawer title="Marcar mão para rever" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn variant="primary" onClick={onClose}>Marcar</Btn></>}>
      <div className="field" style={{marginBottom:16}}><label>Template</label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {['ICM','Pote grande','Bluff catch','All-in marginal','River difícil','Exploit / read','Erro emocional'].map(t => (
            <button key={t} className="qc-btn" style={{padding:'10px 12px'}}><div>{t}</div></button>
          ))}
        </div>
      </div>
      <div className="field"><label>Nota (opcional)</label><textarea className="textarea" placeholder="Stack, posição, raciocínio rápido..."/></div>
    </Drawer>
  );
}

function NoteDrawer({ onClose }) {
  return (
    <Drawer title="Nota rápida" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn variant="primary" onClick={onClose}>Guardar</Btn></>}>
      <div className="field" style={{marginBottom:16}}><label>Template</label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {['Autopiloto','Cansaço','Tilt','Distração','Mesa extra','Boa decisão','Dúvida técnica'].map(t => (
            <button key={t} className="qc-btn" style={{padding:'10px 12px'}}><div>{t}</div></button>
          ))}
        </div>
      </div>
      <div className="field"><label>Texto (opcional)</label><textarea className="textarea"/></div>
    </Drawer>
  );
}

function IntentDrawer({ onClose }) {
  return (
    <Drawer title="Micro-intenção" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancelar</Btn><Btn variant="primary" onClick={onClose} icon={<Icon.Check size={14}/>}>Definir</Btn></>}>
      <p style={{color:'var(--fg-2)',marginBottom:18}}>Para a próxima hora — concreta, observável.</p>
      <div className="field" style={{marginBottom:14}}><label>Texto</label>
        <input className="input" placeholder='ex: "Folda mãos marginais em UTG"' autoFocus/>
      </div>
      <div style={{font:'var(--t-eyebrow)',textTransform:'uppercase',letterSpacing:'.06em',color:'var(--fg-3)',marginBottom:8}}>Sugestões</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
        {['Não pagar river sem motivo','Folda marginais em UTG','Respira entre mesas','Não abrir mais mesas','Pausa às 16:00'].map(s => (
          <PromptChip key={s}>{s}</PromptChip>
        ))}
      </div>
    </Drawer>
  );
}

// ---- Prepare day modal ---------------------------------------------------
function PrepareDayModal({ onClose, onConfirm }) {
  const [picks, setPicks] = useState(() => PREP_DEFAULTS.map(c => c.id));
  const toggle = id => setPicks(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  return (
    <Modal title="Preparar dia" onClose={onClose} width={680}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon={<Icon.Check size={14}/>}
          onClick={() => onConfirm(PREP_DEFAULTS.filter(c => picks.includes(c.id)))}>
          Confirmar dia
        </Btn>
      </>}>
      <p style={{color:'var(--fg-2)',marginBottom:18}}>
        Escolhe 1 a 3 ações que tornam este dia bem executado. Não é a tua agenda — é o que importa.
      </p>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {PREP_DEFAULTS.map(c => (
          <label key={c.id} className={`prep-pick ${picks.includes(c.id) ? 'on' : ''}`}>
            <input type="checkbox" checked={picks.includes(c.id)} onChange={() => toggle(c.id)}/>
            <div className="prep-pick-body">
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span className={`kind-tag ${c.kind.toLowerCase()}`}>{c.kind}</span>
                <span style={{font:'var(--t-mono-sm)',color:'var(--fg-3)'}}>{c.est}</span>
              </div>
              <div style={{marginTop:4}}>{c.text}</div>
            </div>
          </label>
        ))}
      </div>
      <div style={{height:1,background:'var(--border-1)',margin:'18px 0'}}/>
      <div className="field"><label>Adicionar compromisso (opcional)</label>
        <input className="input" placeholder="Texto curto, observável..."/></div>
    </Modal>
  );
}

function App() {
  const [route, setRoute] = useState('today');
  const [theme, setTheme] = useState('light');
  const [sessionState, setSessionState] = useState('idle');
  const [drawer, setDrawer] = useState(null);
  const [endOpen, setEndOpen] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [prepareOpen, setPrepareOpen] = useState(false);
  const [commitments, setCommitments] = useState(PREP_DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const startSession = () => setDrawer('start');
  const finishSession = () => setEndOpen(true);

  const screen = (() => {
    switch (route) {
      case 'today': return <Today
        setRoute={setRoute}
        onStart={startSession}
        onAskCoach={()=>setRoute('coach')}
        prepared={prepared}
        onPrepare={()=>setPrepareOpen(true)}
        onAdjust={()=>setPrepareOpen(true)}
        onCloseDay={()=>setRoute('review')}
        commitments={commitments}
        setCommitments={setCommitments}/>;
      case 'weekly': return <Weekly/>;
      case 'monthly': return <Monthly/>;
      case 'sessions': return <Sessions setRoute={setRoute}/>;
      case 'study': return <Study/>;
      case 'review': return <WeeklyReview
        onStartConversation={()=>setRoute('coach')}
        onPrepareNextWeek={()=>setRoute('weekly')}/>;
      case 'coach': return <Coach/>;
      case 'settings': return <Settings/>;
      case 'active': return <ActiveSession
        onFinish={finishSession}
        onCheckup={()=>setDrawer('checkup')}
        onHand={()=>setDrawer('hand')}
        onNote={()=>setDrawer('note')}
        onIntent={()=>setDrawer('intent')}/>;
      default: return null;
    }
  })();

  return (
    <>
      <Shell route={route} setRoute={setRoute}
        sessionState={sessionState}
        theme={theme} setTheme={setTheme}
        onStart={startSession} onFinish={finishSession}>
        {screen}
      </Shell>
      {drawer === 'start' && <StartSessionDrawer onClose={()=>setDrawer(null)}
        onConfirm={()=>{ setDrawer(null); setSessionState('active'); setRoute('active'); }}/>}
      {drawer === 'checkup' && <CheckupDrawer onClose={()=>setDrawer(null)}/>}
      {drawer === 'hand' && <HandDrawer onClose={()=>setDrawer(null)}/>}
      {drawer === 'note' && <NoteDrawer onClose={()=>setDrawer(null)}/>}
      {drawer === 'intent' && <IntentDrawer onClose={()=>setDrawer(null)}/>}
      {prepareOpen && <PrepareDayModal
        onClose={()=>setPrepareOpen(false)}
        onConfirm={(cs)=>{ setCommitments(cs); setPrepared(true); setPrepareOpen(false); }}/>}
      {endOpen && <EndReview onClose={()=>{ setEndOpen(false); setSessionState('idle'); setRoute('sessions'); }}/>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
