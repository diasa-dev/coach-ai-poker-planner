// Coach AI screen.
//
// Two surfaces:
//   • Coach()        — the conversation page. Prompt + messages + composer.
//   • ProposalCard   — the explicit, never-auto-apply proposal flow.
//                       collapsed   → "Rever proposta"
//                       reviewing   → preview + Editar / Ignorar / Aplicar alteração
//                       applying    → confirm step ("Tens a certeza?")
//                       applied     → confirmation chip + undo for 30s

function Coach({ initialPrompt }) {
  const [msg, setMsg] = React.useState(initialPrompt || '');
  const conversation = [
    { role:'user', text:'Estudo está abaixo do ritmo. O que faço esta semana?' },
    { role:'coach', text:'Estás 1h 45m abaixo do ritmo da semana. Em vez de adicionar um bloco grande, tenho uma proposta com três blocos curtos antes das sessões da manhã. Mantém o volume de grind intacto.' },
  ];

  return (
    <div className="page reflective">
      <div className="page-head">
        <div>
          <div className="eyebrow">Coach AI</div>
          <h1>Coach</h1>
          <p>Direto, calmo, prático. Nunca aplica alterações sem o teu OK.</p>
        </div>
      </div>

      {conversation.map((m,i) => (
        <div key={i} className={`msg ${m.role}`}>
          <div className="av">{m.role === 'user' ? <Icon.Edit size={14}/> : <Icon.Sparkles size={14}/>}</div>
          <div className="body"><p>{m.text}</p></div>
        </div>
      ))}

      <div style={{marginLeft:40,marginBottom:20}}>
        <ProposalCard
          title="3 blocos de 30 min antes da sessão da manhã"
          scope="Plano da semana 18 (3 alterações)"
          preview={[
            { label:'Quinta · 09:00 · Estudo · ICM', detail:'30m antes do Grind manhã' },
            { label:'Sexta · 09:00 · Estudo · Open ranges', detail:'30m antes do Grind manhã' },
            { label:'Sábado · 09:00 · Estudo · Bluff catch', detail:'30m antes do Grind manhã' },
          ]}/>
      </div>

      <div style={{height:20}}/>

      <div className="composer">
        <textarea placeholder="Pergunta ao Coach..." value={msg} onChange={e=>setMsg(e.target.value)}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          <div style={{font:'var(--t-small)',color:'var(--fg-2)',display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--ep-state-success)'}}/>
            Contexto: plano da semana + 3 últimas sessões
          </div>
          <button className="btn primary sm" aria-label="enviar"><Icon.Arrow size={14}/></button>
        </div>
      </div>

      <div style={{height:14}}/>
      <div className="chips">
        <PromptChip>Ajusta esta semana</PromptChip>
        <PromptChip>Analisa o ritmo do mês</PromptChip>
        <PromptChip>Sugere uma sessão de estudo</PromptChip>
        <PromptChip>Analisa as últimas sessões</PromptChip>
        <PromptChip>Estou perdido — o que devo fazer hoje?</PromptChip>
      </div>
    </div>
  );
}

// ---- ProposalCard ---------------------------------------------------------
//
// Three states: collapsed, reviewing, applying-confirm, applied.
// Aplicar alteração only appears AFTER the user opens "Rever proposta".
// "Aplicar alteração" then asks for explicit confirmation before any change.

function ProposalCard({ title, scope, preview }) {
  const [state, setState] = React.useState('collapsed');
  const [editing, setEditing] = React.useState(false);
  const [items, setItems] = React.useState(preview);

  if (state === 'applied') {
    return (
      <div className="proposal applied">
        <div className="applied-row">
          <div className="applied-ico"><Icon.Check size={14}/></div>
          <div style={{flex:1}}>
            <div style={{font:'var(--t-body-strong)'}}>Alteração aplicada ao plano</div>
            <div style={{font:'var(--t-small)',color:'var(--fg-2)',marginTop:2}}>{scope}</div>
          </div>
          <button className="btn text sm" onClick={() => setState('collapsed')}>Anular (30s)</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`proposal ${state}`}>
      <div className="proposal-head">
        <Pill status="active">Proposta</Pill>
        <div style={{font:'var(--t-h4)',flex:1}}>{title}</div>
        <div className="card-meta">{scope}</div>
      </div>

      {state === 'collapsed' && (
        <>
          <p style={{font:'var(--t-body)',color:'var(--fg-2)',margin:'8px 0 14px'}}>
            {items.length} alterações ao plano. Nada é aplicado até confirmares.
          </p>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
            <button className="btn text" onClick={() => alert('Proposta ignorada (mock).')}>Ignorar</button>
            <button className="btn ghost" onClick={() => setState('reviewing')}>
              <Icon.Search size={14}/>Rever proposta
            </button>
          </div>
        </>
      )}

      {state === 'reviewing' && (
        <>
          <div className="proposal-preview-list">
            {items.map((p,i) => (
              <div key={i} className="prev-row">
                <div className="prev-ico"><Icon.Plus size={12}/></div>
                <div style={{flex:1}}>
                  {editing ? (
                    <input className="input" value={p.label}
                      onChange={e => setItems(it => it.map((x,j) => j === i ? {...x, label: e.target.value} : x))}/>
                  ) : (
                    <div className="prev-label">{p.label}</div>
                  )}
                  <div className="prev-detail">{p.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14,gap:8,flexWrap:'wrap'}}>
            <div style={{font:'var(--t-small)',color:'var(--fg-2)',display:'flex',alignItems:'center',gap:6}}>
              <Icon.Lock size={12}/>Não é aplicado até confirmares.
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn text" onClick={() => setState('collapsed')}>Ignorar</button>
              <button className={`btn ghost ${editing ? 'on' : ''}`} onClick={() => setEditing(e => !e)}>
                <Icon.Edit size={14}/>{editing ? 'Concluir edição' : 'Editar'}
              </button>
              <button className="btn primary" onClick={() => setState('applying')}>
                <Icon.Check size={14}/>Aplicar alteração
              </button>
            </div>
          </div>
        </>
      )}

      {state === 'applying' && (
        <div className="confirm-step">
          <div className="confirm-ico"><Icon.Question size={18}/></div>
          <div style={{flex:1}}>
            <div style={{font:'var(--t-body-strong)'}}>Aplicar {items.length} alterações ao plano?</div>
            <div style={{font:'var(--t-small)',color:'var(--fg-2)',marginTop:4}}>
              Vais poder anular durante 30 segundos depois de aplicar.
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn ghost" onClick={() => setState('reviewing')}>Cancelar</button>
            <button className="btn primary" onClick={() => setState('applied')}>
              <Icon.Check size={14}/>Sim, aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

window.Coach = Coach;
window.ProposalCard = ProposalCard;
