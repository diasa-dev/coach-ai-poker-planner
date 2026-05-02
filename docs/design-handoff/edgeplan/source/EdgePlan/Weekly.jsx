// Plano semanal — two modes:
//   • execution (default after a plan exists): compact day-by-day execution view
//   • planning: dense 7-column grid for creating/editing the whole week
//
// "Planear semana" is the primary action. "Adicionar bloco" stays as a
// secondary quick-edit on the execution view.

const TODAY_KEY = 'wed';
const ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
const CATS = ['Grind','Estudo','Review','Sport','Rest','Admin'];

// ---- canonical data ----
const WEEK = {
  mon: { dow:'Seg', date:'12 Mai', past:true, blocks:[
    { cat:'Estudo', title:'ICM até bolha', target:'45m', status:'done' },
    { cat:'Grind',  title:'Sessão MTT — noite', target:'3h',  status:'done' },
  ]},
  tue: { dow:'Ter', date:'13 Mai', past:true, blocks:[
    { cat:'Review', title:'Rever sessão de segunda', target:'30m', status:'done' },
    { cat:'Estudo', title:'Push/fold spots', target:'45m', status:'adj' },
    { cat:'Grind',  title:'Sessão MTT — noite', target:'3h',  status:'done' },
  ]},
  wed: { dow:'Qua', date:'14 Mai', today:true, blocks:[
    { cat:'Estudo', title:'ICM até bolha', target:'45m', status:'done' },
    { cat:'Grind',  title:'Sessão MTT — manhã', target:'2h',  status:'done' },
    { cat:'Review', title:'Rever 5 mãos da sessão de ontem', target:'30m', status:'planned' },
    { cat:'Sport',  title:'Corrida — recovery', target:'40m', status:'planned' },
    { cat:'Grind',  title:'Sessão MTT — noite', target:'3h',  status:'planned' },
  ]},
  thu: { dow:'Qui', date:'15 Mai', blocks:[
    { cat:'Estudo', title:'Bluff catch — river', target:'45m', status:'planned' },
    { cat:'Grind',  title:'Sessão MTT — noite', target:'3h',  status:'planned' },
  ]},
  fri: { dow:'Sex', date:'16 Mai', blocks:[
    { cat:'Rest',   title:'Dia off', target:'—', status:'planned' },
  ]},
  sat: { dow:'Sáb', date:'17 Mai', blocks:[
    { cat:'Grind',  title:'Sessão MTT — tarde', target:'4h',  status:'planned' },
    { cat:'Review', title:'Revisão semanal', target:'45m', status:'planned' },
  ]},
  sun: { dow:'Dom', date:'18 Mai', blocks:[
    { cat:'Rest',   title:'Dia off', target:'—', status:'planned' },
  ]},
};

function parseTarget(t) {
  if (!t || t === '—') return 0;
  const h = (t.match(/(\d+)h/) || [])[1];
  const m = (t.match(/(\d+)m/) || [])[1];
  return (+h || 0) * 60 + (+m || 0);
}
function formatMins(m) {
  if (m === 0) return '—';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
function summariseDay(blocks) {
  const grouped = {};
  for (const b of blocks) {
    if (!grouped[b.cat]) grouped[b.cat] = { count: 0, mins: 0 };
    grouped[b.cat].count++;
    grouped[b.cat].mins += parseTarget(b.target);
  }
  return Object.entries(grouped).map(([cat, v]) => {
    const lbl = cat.toLowerCase();
    if (cat === 'Grind') return `${v.count} grind`;
    if (cat === 'Rest') return 'off';
    return `${formatMins(v.mins)} ${lbl}`;
  }).join(' · ');
}
function computeStats(blocks) {
  return {
    done: blocks.filter(b => b.status === 'done').length,
    adj:  blocks.filter(b => b.status === 'adj').length,
    nd:   blocks.filter(b => b.status === 'nd').length,
  };
}

// ---- presets for planning mode ----
const PRESET_DEFS = {
  equilibrada: { label: 'Semana equilibrada', desc: '4 grind · 3 estudo · 2 review · 2 off · 2 sport' },
  grind:       { label: 'Semana grind pesada', desc: '6 grind · 1 estudo · 1 review · 1 off · 1 sport' },
  estudo:      { label: 'Semana estudo / review', desc: '2 grind · 5 estudo · 4 review · 2 off · 2 sport' },
  recuperacao: { label: 'Semana recuperação', desc: '1 grind · 2 estudo · 1 review · 4 off · 3 sport' },
  custom:      { label: 'Personalizada', desc: 'Sem template, parte de zero' },
};

function makePresetWeek(preset) {
  // Build a brand new draft for planning. Keeps DOW + date columns.
  const dummy = (cat, title, target) => ({ cat, title, target, status:'planned' });
  const empty = ORDER.reduce((acc, id) => (
    acc[id] = { dow: WEEK[id].dow, date: WEEK[id].date, today: WEEK[id].today, off:false, blocks:[] }, acc
  ), {});

  const apply = (id, blocks, off=false) => { empty[id].blocks = blocks; empty[id].off = off; };

  if (preset === 'equilibrada') {
    apply('mon', [dummy('Estudo','ICM até bolha','45m'), dummy('Grind','Sessão MTT — noite','3h')]);
    apply('tue', [dummy('Review','Rever sessão de segunda','30m'), dummy('Sport','Treino força','45m'), dummy('Grind','Sessão MTT — noite','3h')]);
    apply('wed', [dummy('Estudo','Push/fold spots','45m'), dummy('Grind','Sessão MTT — manhã','2h'), dummy('Grind','Sessão MTT — noite','3h')]);
    apply('thu', [dummy('Estudo','Bluff catch — river','45m'), dummy('Sport','Corrida — recovery','40m'), dummy('Grind','Sessão MTT — noite','3h')]);
    apply('fri', [], true);
    apply('sat', [dummy('Grind','Sessão MTT — tarde','4h'), dummy('Review','Revisão semanal','45m')]);
    apply('sun', [], true);
  } else if (preset === 'grind') {
    apply('mon', [dummy('Estudo','ICM curto','30m'), dummy('Grind','Sessão MTT — noite','4h')]);
    apply('tue', [dummy('Grind','Sessão MTT — tarde','3h'), dummy('Grind','Sessão MTT — noite','3h')]);
    apply('wed', [dummy('Sport','Treino curto','30m'), dummy('Grind','Sessão MTT — noite','4h')]);
    apply('thu', [dummy('Grind','Sessão MTT — tarde','3h'), dummy('Grind','Sessão MTT — noite','3h')]);
    apply('fri', [dummy('Review','Rever sessões da semana','45m')]);
    apply('sat', [dummy('Grind','Sessão MTT — domingo','5h')]);
    apply('sun', [], true);
  } else if (preset === 'estudo') {
    apply('mon', [dummy('Estudo','ICM teoria','1h'), dummy('Review','Rever últimas mãos','45m')]);
    apply('tue', [dummy('Estudo','3-bet pots','1h'), dummy('Sport','Corrida','45m')]);
    apply('wed', [dummy('Estudo','River decisions','1h'), dummy('Review','Rever sessão','45m'), dummy('Grind','Sessão curta','2h')]);
    apply('thu', [dummy('Estudo','Push/fold','1h'), dummy('Review','Rever sessão','45m')]);
    apply('fri', [], true);
    apply('sat', [dummy('Grind','Sessão MTT — domingo','4h'), dummy('Review','Revisão semanal','1h'), dummy('Sport','Treino força','45m')]);
    apply('sun', [], true);
  } else if (preset === 'recuperacao') {
    apply('mon', [dummy('Sport','Treino força','45m'), dummy('Estudo','Leitura curta','30m')]);
    apply('tue', [], true);
    apply('wed', [dummy('Sport','Corrida','45m'), dummy('Review','Rever 3 mãos','30m')]);
    apply('thu', [dummy('Estudo','ICM leve','45m')]);
    apply('fri', [], true);
    apply('sat', [dummy('Grind','Sessão curta','2h'), dummy('Sport','Caminhada','45m')]);
    apply('sun', [], true);
  } else {
    // custom — leave empty
  }
  return empty;
}

function Weekly() {
  const [mode, setMode] = React.useState('execution'); // execution | planning
  const [view, setView] = React.useState('full');
  const [collapsedPast, setCollapsedPast] = React.useState(true);
  const [adding, setAdding] = React.useState(null);

  const days = view === 'from-today'
    ? ORDER.slice(ORDER.indexOf(TODAY_KEY))
    : ORDER;

  const totals = React.useMemo(() => {
    const sum = { Grind:0, Estudo:0, Review:0, Sport:0 };
    Object.values(WEEK).forEach(d => d.blocks.forEach(b => {
      if (sum[b.cat] !== undefined) sum[b.cat] += parseTarget(b.target);
    }));
    return sum;
  }, []);

  if (mode === 'planning') {
    return <PlanningMode onCancel={()=>setMode('execution')} onSave={()=>setMode('execution')}/>;
  }

  return (
    <div className="page wp-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Semana 18 · 12–18 Mai</div>
          <h1>Plano semanal</h1>
          <p>Foco · <strong>Executar com disciplina, não com volume.</strong></p>
        </div>
        <div className="page-actions">
          <Segmented value={view} onChange={setView} options={[
            { value:'full', label:'Semana inteira' },
            { value:'from-today', label:'A partir de hoje' },
          ]}/>
          <Btn variant="ghost" size="sm" icon={<Icon.Note size={14}/>}>Copiar semana anterior</Btn>
          <Btn variant="ghost" size="sm" icon={<Icon.Sparkles size={14}/>}>Rever com Coach</Btn>
          <Btn variant="ghost" size="sm" icon={<Icon.Plus size={14}/>} onClick={()=>setAdding('wed')}>Adicionar bloco</Btn>
          <Btn variant="primary" size="sm" icon={<BrandIcon.Plano size={14}/>} onClick={()=>setMode('planning')}>Planear semana</Btn>
        </div>
      </div>

      <div className="wp-totals">
        <div className="wp-total"><span className="lbl">Grind</span><span className="val">{formatMins(totals.Grind)}</span><span className="goal">/ 14h</span></div>
        <div className="wp-total"><span className="lbl">Estudo</span><span className="val">{formatMins(totals.Estudo)}</span><span className="goal">/ 5h</span></div>
        <div className="wp-total"><span className="lbl">Review</span><span className="val">{formatMins(totals.Review)}</span><span className="goal">/ 2h</span></div>
        <div className="wp-total"><span className="lbl">Sport</span><span className="val">{formatMins(totals.Sport)}</span><span className="goal">/ 3h</span></div>
        <div className="wp-total wp-total-meta">
          {view === 'full' && Object.values(WEEK).some(d => d.past) && (
            <button className="wp-collapse-btn" onClick={()=>setCollapsedPast(c => !c)}>
              {collapsedPast
                ? <><Icon.ArrowDown size={12}/> Expandir dias passados</>
                : <><Icon.ArrowDown size={12} style={{transform:'rotate(180deg)'}}/> Recolher dias passados</>}
            </button>
          )}
        </div>
      </div>

      <div className="wp-grid">
        {days.map(id => {
          const d = WEEK[id];
          const collapsed = d.past && collapsedPast && view === 'full';
          return (
            <DayCard key={id} id={id} d={d} collapsed={collapsed}
              onAdd={()=>setAdding(id)}
              onToggle={() => collapsed ? setCollapsedPast(false) : null}/>
          );
        })}
      </div>

      {adding && <AddBlockDrawer onClose={()=>setAdding(null)} day={WEEK[adding]}/>}
    </div>
  );
}

function DayCard({ id, d, collapsed, onAdd, onToggle }) {
  const cls = ['wp-day', d.today ? 'is-today':'', d.past ? 'is-past':'', collapsed ? 'is-collapsed':''].join(' ');
  const summary = summariseDay(d.blocks);
  const stats = computeStats(d.blocks);
  return (
    <section className={cls}>
      <header className="wp-day-head" onClick={collapsed ? onToggle : undefined}>
        <div className="wp-day-meta">
          <span className="wp-dow">{d.dow}</span>
          <span className="wp-date">{d.date}</span>
          {d.today && <span className="wp-today-badge">Hoje</span>}
        </div>
        <div className="wp-day-summary">{summary}</div>
        <div className="wp-day-stats">
          {d.past && <span className="wp-stat" title="executado">{stats.done}/{d.blocks.length}</span>}
          {!collapsed && (
            <button className="wp-add" onClick={(e)=>{ e.stopPropagation(); onAdd(); }} aria-label="adicionar bloco">
              <Icon.Plus size={14}/>
            </button>
          )}
        </div>
      </header>
      {!collapsed && (
        <div className="wp-rows">
          {d.blocks.map((b,i) => <WPRow key={i} b={b}/>)}
          <button className="wp-row wp-row-add" onClick={onAdd}>
            <Icon.Plus size={12}/><span>Adicionar bloco</span>
          </button>
        </div>
      )}
    </section>
  );
}

function WPRow({ b }) {
  const color = CAT_COLOR[b.cat] || '#93A2B5';
  return (
    <div className={`wp-row st-${b.status}`} style={{ '--cat': color }}>
      <span className="rail"/>
      <span className="cat">{b.cat}</span>
      <span className="title">{b.title}</span>
      <span className="target">{b.target}</span>
      <span className={`st-dot st-${b.status}`} title={STATUS_LABEL[b.status]}/>
    </div>
  );
}

function AddBlockDrawer({ onClose, day }) {
  return (
    <Drawer title={`Adicionar bloco · ${day.dow} ${day.date}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon={<Icon.Plus size={14}/>} onClick={onClose}>Adicionar</Btn>
      </>}>
      <div className="field" style={{marginBottom:12}}>
        <label>Categoria</label>
        <div className="cat-grid">
          {CATS.map(c => (
            <button key={c} className="cat-pick" style={{'--cat':CAT_COLOR[c]}}>
              <span className="dot"/>{c}
            </button>
          ))}
        </div>
      </div>
      <div className="field" style={{marginBottom:12}}>
        <label>Título</label>
        <input className="input" placeholder='ex: "Sessão MTT — noite"' autoFocus/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div className="field"><label>Duração</label><input className="input" placeholder="ex: 2h"/></div>
        <div className="field"><label>Hora (opcional)</label><input className="input" placeholder="ex: 21:00"/></div>
      </div>
    </Drawer>
  );
}

// =================================================================
// PLANNING MODE — full-week dense grid
// =================================================================

function PlanningMode({ onCancel, onSave }) {
  const [focus, setFocus] = React.useState('Executar com disciplina, não com volume.');
  const [preset, setPreset] = React.useState('equilibrada');
  const [draft, setDraft] = React.useState(() => makePresetWeek('equilibrada'));
  const [showPresets, setShowPresets] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // {dayId, idx}

  const applyPreset = (p) => {
    setPreset(p);
    setDraft(makePresetWeek(p));
    setShowPresets(false);
  };

  const addBlock = (dayId, cat) => {
    setDraft(prev => {
      const next = { ...prev, [dayId]: { ...prev[dayId] } };
      const defaults = {
        Grind:  { title: 'Sessão MTT', target: '3h' },
        Estudo: { title: 'Estudo', target: '45m' },
        Review: { title: 'Rever mãos', target: '30m' },
        Sport:  { title: 'Treino', target: '45m' },
        Rest:   { title: 'Descanso', target: '—' },
        Admin:  { title: 'Admin', target: '20m' },
      };
      next[dayId].blocks = [...next[dayId].blocks, { cat, ...defaults[cat], status:'planned' }];
      next[dayId].off = false;
      return next;
    });
  };
  const removeBlock = (dayId, idx) => {
    setDraft(prev => {
      const next = { ...prev, [dayId]: { ...prev[dayId] } };
      next[dayId].blocks = prev[dayId].blocks.filter((_,i) => i !== idx);
      return next;
    });
  };
  const moveBlock = (dayId, idx, dir) => {
    const fromIdx = ORDER.indexOf(dayId);
    const toIdx = (fromIdx + dir + 7) % 7;
    const toDay = ORDER[toIdx];
    setDraft(prev => {
      const next = { ...prev, [dayId]: { ...prev[dayId] }, [toDay]: { ...prev[toDay] } };
      const block = prev[dayId].blocks[idx];
      next[dayId].blocks = prev[dayId].blocks.filter((_,i) => i !== idx);
      next[toDay].blocks = [...prev[toDay].blocks, block];
      next[toDay].off = false;
      return next;
    });
  };
  const toggleOff = (dayId) => {
    setDraft(prev => {
      const wasOff = prev[dayId].off;
      const next = { ...prev, [dayId]: { ...prev[dayId] } };
      if (wasOff) {
        next[dayId].off = false;
        next[dayId].blocks = [];
      } else {
        next[dayId].off = true;
        next[dayId].blocks = [{ cat:'Rest', title:'Dia off', target:'—', status:'planned' }];
      }
      return next;
    });
  };
  const duplicateDay = (dayId) => {
    const fromIdx = ORDER.indexOf(dayId);
    const toIdx = (fromIdx + 1) % 7;
    const toDay = ORDER[toIdx];
    setDraft(prev => {
      const next = { ...prev, [toDay]: { ...prev[toDay] } };
      next[toDay].blocks = prev[dayId].blocks.map(b => ({ ...b }));
      next[toDay].off = prev[dayId].off;
      return next;
    });
  };
  const updateBlock = (dayId, idx, patch) => {
    setDraft(prev => {
      const next = { ...prev, [dayId]: { ...prev[dayId] } };
      next[dayId].blocks = prev[dayId].blocks.map((b,i) => i === idx ? { ...b, ...patch } : b);
      return next;
    });
  };

  // --- aggregates ---
  const summary = React.useMemo(() => {
    let grindDays = 0, studyDays = 0, reviewBlocks = 0, offDays = 0, sportBlocks = 0;
    let totalMins = 0;
    for (const id of ORDER) {
      const d = draft[id];
      if (d.off) offDays++;
      const cats = new Set(d.blocks.map(b => b.cat));
      if (cats.has('Grind')) grindDays++;
      if (cats.has('Estudo')) studyDays++;
      reviewBlocks += d.blocks.filter(b => b.cat === 'Review').length;
      sportBlocks += d.blocks.filter(b => b.cat === 'Sport').length;
      totalMins += d.blocks.reduce((s,b) => s + parseTarget(b.target), 0);
    }
    return { grindDays, studyDays, reviewBlocks, offDays, sportBlocks, totalMins };
  }, [draft]);

  // category time totals across the week (for distribution bar in summary)
  const catMins = React.useMemo(() => {
    const out = { Grind:0, Estudo:0, Review:0, Sport:0, Rest:0, Admin:0 };
    for (const id of ORDER) {
      for (const b of draft[id].blocks) out[b.cat] = (out[b.cat] || 0) + parseTarget(b.target);
    }
    return out;
  }, [draft]);

  return (
    <div className="page wpp-page">
      <div className="wpp-head">
        <div>
          <div className="eyebrow">Semana 18 · 12–18 Mai</div>
          <h1>Planear semana</h1>
        </div>
        <div className="page-actions">
          <Btn variant="ghost" size="sm" icon={<Icon.Note size={14}/>}>Copiar semana anterior</Btn>
          <Btn variant="ghost" size="sm" icon={<Icon.Sparkles size={14}/>}>Rever com Coach</Btn>
          <Btn variant="ghost" size="sm" onClick={onCancel}>Cancelar</Btn>
          <Btn variant="primary" size="sm" icon={<Icon.Check size={14}/>} onClick={onSave}>Guardar plano</Btn>
        </div>
      </div>

      {/* Required focus */}
      <div className="wpp-focus">
        <label>
          Foco da semana
          <span className="wpp-required">obrigatório</span>
        </label>
        <input className="input" value={focus} onChange={e=>setFocus(e.target.value)}
          placeholder='ex: "Executar com disciplina, não com volume."'/>
      </div>

      {/* Presets row */}
      <div className="wpp-presets">
        <div className="wpp-presets-label">Começar de</div>
        <div className="wpp-preset-chips">
          {Object.entries(PRESET_DEFS).map(([k, v]) => (
            <button key={k}
              className={`wpp-preset ${preset === k ? 'on' : ''}`}
              onClick={()=>applyPreset(k)}
              title={v.desc}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* 7-column grid */}
      <div className="wpp-grid">
        {ORDER.map(id => (
          <DayColumn key={id} id={id} d={draft[id]}
            onAdd={(cat) => addBlock(id, cat)}
            onRemove={(idx) => removeBlock(id, idx)}
            onMove={(idx, dir) => moveBlock(id, idx, dir)}
            onToggleOff={() => toggleOff(id)}
            onDuplicate={() => duplicateDay(id)}
            onEdit={(idx) => setEditing({ dayId: id, idx })}/>
        ))}
      </div>

      {/* Summary strip */}
      <div className="wpp-summary">
        <SummaryStat val={summary.grindDays} unit="dias" label="Grind"/>
        <SummaryStat val={summary.studyDays} unit="dias" label="Estudo"/>
        <SummaryStat val={summary.reviewBlocks} unit="blocos" label="Review"/>
        <SummaryStat val={summary.sportBlocks} unit="blocos" label="Sport"/>
        <SummaryStat val={summary.offDays} unit="dias" label="Off"/>
        <SummaryStat val={formatMins(summary.totalMins)} unit="" label="Total planeado" big/>
        <DistributionBar catMins={catMins}/>
      </div>

      {editing && (
        <EditBlockDrawer
          day={draft[editing.dayId]}
          block={draft[editing.dayId].blocks[editing.idx]}
          onClose={()=>setEditing(null)}
          onChange={(patch)=>updateBlock(editing.dayId, editing.idx, patch)}/>
      )}
    </div>
  );
}

function DayColumn({ id, d, onAdd, onRemove, onMove, onToggleOff, onDuplicate, onEdit }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const totalMins = d.blocks.reduce((s,b) => s + parseTarget(b.target), 0);
  const cls = ['wpp-col', d.today ? 'is-today':'', d.off ? 'is-off':''].join(' ');

  return (
    <section className={cls}>
      <header className="wpp-col-head">
        <div className="wpp-col-meta">
          <span className="wpp-dow">{d.dow}</span>
          <span className="wpp-date">{d.date}</span>
          {d.today && <span className="wpp-today-badge">Hoje</span>}
        </div>
        <button className="wpp-col-menu" onClick={()=>setMenuOpen(o=>!o)} aria-label="ações do dia">
          <Icon.More size={14}/>
        </button>
        {menuOpen && (
          <div className="wpp-menu" onMouseLeave={()=>setMenuOpen(false)}>
            <button onClick={()=>{ onDuplicate(); setMenuOpen(false); }}>
              <Icon.Note size={13}/>Duplicar para amanhã
            </button>
            <button onClick={()=>{ onToggleOff(); setMenuOpen(false); }}>
              {d.off ? <><Icon.Check size={13}/>Reativar dia</> : <><Icon.X size={13}/>Marcar como Off</>}
            </button>
          </div>
        )}
      </header>

      {/* category distribution mini-bar */}
      <DistMini blocks={d.blocks}/>

      {/* day total */}
      <div className="wpp-col-total">
        {d.off ? <span className="wpp-off-tag">Dia off</span> :
         totalMins === 0 ? <span className="wpp-empty-tag">Sem blocos</span> :
         <><span className="wpp-total-val">{formatMins(totalMins)}</span><span className="wpp-total-cnt">{d.blocks.length} bloco{d.blocks.length === 1 ? '':'s'}</span></>}
      </div>

      {/* block list */}
      <div className="wpp-col-blocks">
        {d.blocks.map((b, i) => (
          <PlannedBlock key={i} b={b}
            onClick={()=>onEdit(i)}
            onRemove={()=>onRemove(i)}
            onMoveLeft={()=>onMove(i, -1)}
            onMoveRight={()=>onMove(i, +1)}/>
        ))}
        {!d.off && (
          adding ? (
            <div className="wpp-add-pop" onMouseLeave={()=>setAdding(false)}>
              {CATS.map(c => (
                <button key={c}
                  className="wpp-add-cat"
                  style={{'--cat': CAT_COLOR[c]}}
                  onClick={()=>{ onAdd(c); setAdding(false); }}>
                  <span className="dot"/>{c}
                </button>
              ))}
            </div>
          ) : (
            <button className="wpp-add-btn" onClick={()=>setAdding(true)}>
              <Icon.Plus size={12}/>Adicionar
            </button>
          )
        )}
      </div>
    </section>
  );
}

function PlannedBlock({ b, onClick, onRemove, onMoveLeft, onMoveRight }) {
  const color = CAT_COLOR[b.cat] || '#93A2B5';
  return (
    <div className="wpp-block" style={{'--cat': color}}>
      <button className="wpp-block-main" onClick={onClick}>
        <span className="wpp-block-rail"/>
        <div className="wpp-block-body">
          <div className="wpp-block-cat">{b.cat}</div>
          <div className="wpp-block-title">{b.title}</div>
        </div>
        <span className="wpp-block-target">{b.target}</span>
      </button>
      <div className="wpp-block-actions">
        <button onClick={onMoveLeft} title="mover para o dia anterior" aria-label="mover para o dia anterior">
          <Icon.ArrowDown size={11} style={{transform:'rotate(90deg)'}}/>
        </button>
        <button onClick={onMoveRight} title="mover para o dia seguinte" aria-label="mover para o dia seguinte">
          <Icon.ArrowDown size={11} style={{transform:'rotate(-90deg)'}}/>
        </button>
        <button onClick={onRemove} title="remover" aria-label="remover">
          <Icon.X size={11}/>
        </button>
      </div>
    </div>
  );
}

function DistMini({ blocks }) {
  const total = blocks.reduce((s,b) => s + (parseTarget(b.target) || 1), 0);
  if (total === 0) return <div className="wpp-dist-mini is-empty"/>;
  return (
    <div className="wpp-dist-mini">
      {blocks.map((b, i) => {
        const w = ((parseTarget(b.target) || 1) / total) * 100;
        return <span key={i} style={{ width: `${w}%`, background: CAT_COLOR[b.cat] }}/>;
      })}
    </div>
  );
}

function SummaryStat({ val, unit, label, big }) {
  return (
    <div className={`wpp-sum-stat ${big ? 'big':''}`}>
      <div className="wpp-sum-val">{val}{unit && <span className="wpp-sum-unit"> {unit}</span>}</div>
      <div className="wpp-sum-lbl">{label}</div>
    </div>
  );
}

function DistributionBar({ catMins }) {
  const total = Object.values(catMins).reduce((s,v) => s + v, 0);
  const order = ['Grind','Estudo','Review','Sport','Rest','Admin'];
  return (
    <div className="wpp-sum-dist">
      <div className="wpp-sum-dist-lbl">Distribuição</div>
      <div className="wpp-dist-bar">
        {total === 0 ? <span className="wpp-dist-empty">Sem blocos planeados</span> :
          order.map(c => {
            const v = catMins[c] || 0;
            if (v === 0) return null;
            const w = (v / total) * 100;
            return (
              <div key={c} className="wpp-dist-seg" style={{ width: `${w}%`, background: CAT_COLOR[c] }} title={`${c} · ${formatMins(v)}`}>
                <span>{c}</span>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

function EditBlockDrawer({ day, block, onClose, onChange }) {
  if (!block) return null;
  return (
    <Drawer title={`Editar bloco · ${day.dow} ${day.date}`} onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" icon={<Icon.Check size={14}/>} onClick={onClose}>Guardar</Btn>
      </>}>
      <div className="field" style={{marginBottom:12}}>
        <label>Categoria</label>
        <div className="cat-grid">
          {CATS.map(c => (
            <button key={c}
              className={`cat-pick ${block.cat === c ? 'on' : ''}`}
              style={{'--cat':CAT_COLOR[c]}}
              onClick={()=>onChange({ cat: c })}>
              <span className="dot"/>{c}
            </button>
          ))}
        </div>
      </div>
      <div className="field" style={{marginBottom:12}}>
        <label>Título</label>
        <input className="input" value={block.title} onChange={e=>onChange({ title: e.target.value })}/>
      </div>
      <div className="field" style={{marginBottom:12}}>
        <label>Duração</label>
        <input className="input" value={block.target} onChange={e=>onChange({ target: e.target.value })} placeholder="ex: 2h"/>
      </div>
    </Drawer>
  );
}

window.Weekly = Weekly;
