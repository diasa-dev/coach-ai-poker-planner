function EndReview({ onClose }) {
  const [dq, setDq] = React.useState(4);
  const [energy, setEnergy] = React.useState(3);
  const [focus, setFocus] = React.useState(4);
  const [tilt, setTilt] = React.useState(1);
  const [includeFin, setIncludeFin] = React.useState(false);
  return (
    <Modal title="Terminar e rever sessão" onClose={onClose}
      footer={<>
        <Btn variant="ghost" onClick={onClose}>Guardar rascunho</Btn>
        <Btn variant="primary" onClick={onClose}>Confirmar review</Btn>
      </>}
      width={680}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
        <div className="field"><label>Torneios jogados</label><input className="input" defaultValue="6"/></div>
        <div className="field"><label>Duração</label><input className="input" defaultValue="2h 04m" disabled/></div>
        <div className="field" style={{gridColumn:'1/-1'}}>
          <label>Resumo automático (com base em 4 check-ups)</label>
          <textarea className="textarea" defaultValue="Energia média 3.5, foco constante (4), tilt baixo (1). 2 mesas extras pediram-te concentração — mantiveste a disciplina."/>
        </div>
        <div className="field"><label>Qualidade de decisão</label><Rating value={dq} onChange={setDq}/></div>
        <div className="field"><label>Energia final</label><Rating value={energy} onChange={setEnergy}/></div>
        <div className="field"><label>Foco final</label><Rating value={focus} onChange={setFocus}/></div>
        <div className="field"><label>Tilt final</label><Rating max={5} value={tilt} onChange={setTilt}/></div>

        <div className="field" style={{gridColumn:'1/-1'}}>
          <label>Boa decisão</label>
          <input className="input" defaultValue="Foldar AQs em SB para shove de 18bb"/>
        </div>
        <div className="field" style={{gridColumn:'1/-1'}}>
          <label>Principal leak / problema</label>
          <input className="input" placeholder="Opcional"/>
        </div>
        <div className="field" style={{gridColumn:'1/-1'}}>
          <label>Próxima ação</label>
          <input className="input" defaultValue="Rever a mão de QQ marcada"/>
        </div>

        <div style={{gridColumn:'1/-1',padding:'14px',background:'var(--bg-inset)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-1)'}}>
          <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
            <Icon.Lock size={16}/>
            <div style={{font:'var(--t-body-strong)'}}>Resultado financeiro <span style={{color:'var(--fg-3)',fontWeight:400}}>· opcional</span></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'120px 1fr',gap:12,marginBottom:10}}>
            <select className="select"><option>EUR €</option><option>USD $</option></select>
            <input className="input" placeholder="+ ou − valor líquido"/>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
            <Toggle on={includeFin} onChange={setIncludeFin}/>
            <div style={{font:'var(--t-small)',color:'var(--fg-2)'}}>
              Incluir resultado financeiro no contexto do Coach. Os dados financeiros nunca aparecem em painéis nem em gráficos.
            </div>
          </div>
        </div>

        <div className="field" style={{gridColumn:'1/-1'}}>
          <label>Mãos prioritárias para rever</label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <span className="chip" style={{background:'var(--bg-surface-2)',color:'var(--fg-1)'}}>QQ vs shove · ICM</span>
            <span className="chip" style={{background:'var(--bg-surface-2)',color:'var(--fg-1)'}}>A♠ J♣ · river difícil</span>
            <button className="chip-btn"><Icon.Plus size={12}/>Adicionar mão</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
window.EndReview = EndReview;
