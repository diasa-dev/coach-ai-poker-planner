// Reusable EdgePlan components — buttons, pills, plan blocks, etc.
const { useState } = React;

function Btn({ variant = 'primary', size = 'md', icon, children, onClick, className = '', ...rest }) {
  return (
    <button className={`btn ${variant} ${size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : ''} ${className}`} onClick={onClick} {...rest}>
      {icon ? icon : null}
      {children}
    </button>
  );
}
function IconBtn({ icon, onClick, className = '', ...rest }) {
  return <button className={`icon-btn ${className}`} onClick={onClick} {...rest}>{icon}</button>;
}

function Pill({ status, children }) {
  return <span className={`pill ${status}`}>{children}</span>;
}
const STATUS_LABEL = { planned: 'Planeado', done: 'Feito', adj: 'Ajustado', nd: 'Não feito', active: 'Ativo' };

const CAT_COLOR = {
  Grind: '#1E3A8A', Estudo: '#22C5D5', Review: '#7A6CE8',
  Sport: '#2BAD7E', Rest: '#93A2B5', Admin: '#C28A2C',
};

function CategoryChip({ category }) {
  return (
    <span className="chip">
      <span className="dot" style={{ background: CAT_COLOR[category] }} />
      {category}
    </span>
  );
}

function PlanBlock({ block, onAction }) {
  const color = CAT_COLOR[block.category] || '#93A2B5';
  return (
    <div className="plan-block" style={{ '--cat': color }}>
      <div className="type">{block.category}</div>
      <div className="ttl">{block.title}</div>
      <div className="target">{block.target}</div>
      <Pill status={block.status}>{STATUS_LABEL[block.status]}</Pill>
      <button className="icon-btn" onClick={onAction} aria-label="ações"><Icon.More size={16}/></button>
    </div>
  );
}

function Card({ children, refl = false, className = '' }) {
  return <div className={`card ${refl ? 'refl' : ''} ${className}`}>{children}</div>;
}

function Metric({ label, value, sub, valStyle }) {
  return (
    <div className="metric">
      <div className="lbl">{label}</div>
      <div className="val" style={valStyle}>{value}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
  );
}

function ProgressBar({ value, max = 100, tone = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return <div className={`bar ${tone}`}><span style={{ width: pct + '%' }} /></div>;
}

function CoachInsight({ text, ctx, onAsk }) {
  return (
    <div className="insight">
      <div className="ico"><Icon.Sparkles size={18}/></div>
      <div className="body">
        <p>{text}</p>
        {ctx ? <div className="ctx"><span className="dot"/>Contexto: {ctx}</div> : null}
        <a className="ask" onClick={onAsk}>Pedir ao Coach <Icon.Arrow size={14}/></a>
      </div>
    </div>
  );
}

function AttRow({ tone = 'info', icon, title, desc, action, onAction }) {
  return (
    <div className={`att-row ${tone}`}>
      <div className="ico">{icon}</div>
      <div className="body">
        <div className="ttl">{title}</div>
        <div className="desc">{desc}</div>
      </div>
      {action ? <a className="act" onClick={onAction}>{action}</a> : null}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return <div className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on}/>;
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

function Rating({ max = 5, value, onChange }) {
  return (
    <div className="rating">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <div key={n} className={`r ${n <= value ? 'on' : ''}`} onClick={() => onChange(n)}>{n}</div>
      ))}
    </div>
  );
}

// SegRate — segmented 1..5 control. Used in tight surfaces where a row of
// chunky chips would feel disconnected. Set tone="tilt" for warm/danger styling.
function SegRate({ value, onChange, max = 5, tone }) {
  return (
    <div className={`seg-rate ${tone || ''}`} role="radiogroup">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" role="radio" aria-checked={value === n}
          className={value === n ? 'on' : ''} onClick={() => onChange(n)}>{n}</button>
      ))}
    </div>
  );
}

function PromptChip({ children, onClick }) {
  return <button className="chip-btn" onClick={onClick}>{children}</button>;
}

function Drawer({ title, onClose, children, footer }) {
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <aside className="drawer" role="dialog">
        <div className="drawer-head">
          <h3>{title}</h3>
          <IconBtn icon={<Icon.X size={18}/>} onClick={onClose} aria-label="fechar"/>
        </div>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-foot">{footer}</div> : null}
      </aside>
    </>
  );
}

function Modal({ title, onClose, children, footer, width }) {
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="modal" style={width ? { width } : undefined} role="dialog">
        <div className="modal-head">
          <h3>{title}</h3>
          <IconBtn icon={<Icon.X size={18}/>} onClick={onClose} aria-label="fechar"/>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </>
  );
}

Object.assign(window, {
  Btn, IconBtn, Pill, CategoryChip, PlanBlock, Card, Metric, ProgressBar,
  CoachInsight, AttRow, Toggle, Segmented, Rating, SegRate, PromptChip, Drawer, Modal,
  STATUS_LABEL, CAT_COLOR
});
