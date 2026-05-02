// PrintApp - renders every screen stacked, each on its own page.
const { useState, useEffect } = React;

// No-op handlers for print
const noop = () => {};

function PrintScreen({ label, children }) {
  return (
    <section className="print-page">
      <div className="print-page-label">{label}</div>
      <div className="print-shell">
        {children}
      </div>
    </section>
  );
}

// Replicate Shell's layout statically for each route, so each page is a full app frame
function PrintShell({ route, children }) {
  const NAV = [
    { id: 'today',    label: 'Hoje' },
    { id: 'weekly',   label: 'Plano semanal' },
    { id: 'monthly',  label: 'Objetivos mensais' },
    { id: 'sessions', label: 'Sessões' },
    { id: 'study',    label: 'Estudo' },
    { id: 'review',   label: 'Revisão' },
    { id: 'coach',    label: 'Coach AI' },
  ];
  const crumbMap = { today:'Hoje', weekly:'Plano semanal', monthly:'Objetivos mensais',
    sessions:'Sessões', study:'Estudo', review:'Revisão', coach:'Coach AI',
    active:'Sessão ativa', settings:'Definições' };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="assets/logo-horizontal-white.svg" alt="EdgePlan"/>
        </div>
        <button className="cta-start">
          <Icon.Play size={16}/>Iniciar sessão
        </button>
        <nav className="nav-group">
          {NAV.map(n => (
            <button key={n.id} className={`nav-item ${route === n.id ? 'active' : ''}`}>
              {n.id === 'today' && <Icon.Sun size={18}/>}
              {n.id === 'weekly' && <BrandIcon.Plano size={18}/>}
              {n.id === 'monthly' && <BrandIcon.Foco size={18}/>}
              {n.id === 'sessions' && <Icon.Logo size={18}/>}
              {n.id === 'study' && <Icon.Book size={18}/>}
              {n.id === 'review' && <BrandIcon.Review size={18}/>}
              {n.id === 'coach' && <Icon.Sparkles size={18}/>}
              {n.label}
            </button>
          ))}
        </nav>
        <button className={`nav-item ${route === 'settings' ? 'active' : ''}`}
          style={{ marginTop: 'auto' }}>
          <Icon.Settings size={18}/>Definições
        </button>
        <div className="nav-foot">
          <div className="avatar">JM</div>
          <div>João M.<br/><span style={{ opacity: .55 }}>Pro · MTT</span></div>
        </div>
      </aside>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="topbar">
          <div className="crumb">{crumbMap[route]}</div>
          <div className="right">
            <IconBtn icon={<Icon.Search size={18}/>}/>
            <IconBtn icon={<Icon.Moon size={18}/>}/>
            <IconBtn icon={<Icon.Bell size={18}/>}/>
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}

function PrintApp() {
  const [commitments, setCommitments] = useState(PREP_DEFAULTS);
  return (
    <>
      <PrintScreen label="01 — Hoje (antes de preparar)">
        <PrintShell route="today">
          <Today setRoute={noop} onStart={noop} onAskCoach={noop}
            prepared={false} onPrepare={noop} onAdjust={noop} onCloseDay={noop}
            commitments={PREP_DEFAULTS} setCommitments={noop}/>
        </PrintShell>
      </PrintScreen>

      <PrintScreen label="02 — Hoje (depois de preparar)">
        <PrintShell route="today">
          <Today setRoute={noop} onStart={noop} onAskCoach={noop}
            prepared={true} onPrepare={noop} onAdjust={noop} onCloseDay={noop}
            commitments={PREP_DEFAULTS} setCommitments={noop}/>
        </PrintShell>
      </PrintScreen>

      <PrintScreen label="03 — Plano semanal">
        <PrintShell route="weekly"><Weekly/></PrintShell>
      </PrintScreen>

      <PrintScreen label="04 — Objetivos mensais">
        <PrintShell route="monthly"><Monthly/></PrintShell>
      </PrintScreen>

      <PrintScreen label="05 — Sessões">
        <PrintShell route="sessions"><Sessions setRoute={noop}/></PrintShell>
      </PrintScreen>

      <PrintScreen label="06 — Sessão ativa">
        <PrintShell route="active">
          <ActiveSession onFinish={noop} onCheckup={noop} onHand={noop}
            onNote={noop} onIntent={noop}/>
        </PrintShell>
      </PrintScreen>

      <PrintScreen label="07 — Estudo">
        <PrintShell route="study"><Study/></PrintShell>
      </PrintScreen>

      <PrintScreen label="08 — Revisão semanal">
        <PrintShell route="review">
          <WeeklyReview onStartConversation={noop} onPrepareNextWeek={noop}/>
        </PrintShell>
      </PrintScreen>

      <PrintScreen label="09 — Coach AI">
        <PrintShell route="coach"><Coach/></PrintShell>
      </PrintScreen>

      <PrintScreen label="10 — Definições / Privacidade">
        <PrintShell route="settings"><Settings/></PrintShell>
      </PrintScreen>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PrintApp/>);
