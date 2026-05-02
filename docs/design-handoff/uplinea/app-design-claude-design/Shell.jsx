// Sidebar + Topbar shell.

function Shell({ route, setRoute, sessionState, setSessionState, children, theme, setTheme, onStart, onFinish }) {
  // Brand icons in nav, sized small. They use currentColor for the navy outline
  // so they tint to white in the dark sidebar; the teal accent stays teal.
  const NAV = [
    { id: 'today',    label: 'Hoje',                 icon: <Icon.Sun size={18}/> },
    { id: 'weekly',   label: 'Plano semanal',        icon: <BrandIcon.Plano size={18}/> },
    { id: 'monthly',  label: 'Objetivos mensais',    icon: <BrandIcon.Foco size={18}/> },
    { id: 'sessions', label: 'Sessões',              icon: <Icon.Logo size={18}/> },
    { id: 'study',    label: 'Estudo',               icon: <Icon.Book size={18}/> },
    { id: 'review',   label: 'Revisão',              icon: <BrandIcon.Review size={18}/> },
    { id: 'coach',    label: 'Coach AI',             icon: <Icon.Sparkles size={18}/> },
  ];

  const cta = sessionState === 'active' ? (
    <button className="cta-start active" onClick={() => setRoute('active')}>
      <span className="pulse"/>Sessão ativa · 1h 24m
    </button>
  ) : sessionState === 'finishing' ? (
    <button className="cta-start finish" onClick={onFinish}>
      <Icon.Check size={16}/>Terminar e rever
    </button>
  ) : (
    <button className="cta-start" onClick={onStart}>
      <Icon.Play size={16}/>Iniciar sessão
    </button>
  );

  const crumb = NAV.find(n => n.id === route)?.label
    || (route === 'active' ? 'Sessão ativa'
      : route === 'settings' ? 'Definições'
      : 'Hoje');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="assets/logo-horizontal-white.svg" alt="Uplinea"/>
        </div>
        {cta}
        <nav className="nav-group">
          {NAV.map(n => (
            <button key={n.id}
              className={`nav-item ${route === n.id ? 'active' : ''}`}
              onClick={() => setRoute(n.id)}>
              {n.icon}{n.label}
            </button>
          ))}
        </nav>
        <button className={`nav-item ${route === 'settings' ? 'active' : ''}`}
          onClick={() => setRoute('settings')}
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
          <div className="crumb">{crumb}</div>
          <div className="right">
            <IconBtn icon={<Icon.Search size={18}/>} aria-label="procurar"/>
            <IconBtn icon={theme === 'dark' ? <Icon.Sun size={18}/> : <Icon.Moon size={18}/>}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="tema"/>
            <IconBtn icon={<Icon.Bell size={18}/>} aria-label="notificações"/>
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
window.Shell = Shell;
