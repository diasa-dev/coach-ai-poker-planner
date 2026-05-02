function Settings() {
  const [perms, setPerms] = React.useState({
    plan:true, sessions:true, study:true, review:true, fin:false, hands:true, mood:true
  });
  const set = (k,v) => setPerms(p => ({...p, [k]:v}));
  const rows = [
    { k:'plan', t:'Plano semanal e mensal', d:'Foco, blocos planeados e ajustes da semana.' },
    { k:'sessions', t:'Dados de sessão', d:'Foco, duração, número de torneios, qualidade.' },
    { k:'study', t:'Registos de estudo', d:'Tipo, duração, qualidade. Necessário para detetar padrões.' },
    { k:'review', t:'Reviews semanais', d:'Reflexão escrita, ratings. Usado pelo Coach com cuidado.' },
    { k:'mood', t:'Energia / foco / tilt', d:'Check-ups durante a sessão. Sensível — usado para alertas.' },
    { k:'hands', t:'Mãos marcadas', d:'Templates e notas das mãos para revisão.' },
  ];
  return (
    <div className="page reflective">
      <div className="page-head">
        <div>
          <div className="eyebrow">Definições</div>
          <h1>Privacidade</h1>
          <p>Controla, por tipo de dados, o que o Coach pode usar como contexto.</p>
        </div>
      </div>

      <Card refl>
        <div className="card-head"><h3>Permissões para o Coach</h3></div>
        {rows.map(r => (
          <div key={r.k} className="setting-row">
            <div className="body"><div className="ttl">{r.t}</div><div className="desc">{r.d}</div></div>
            <Toggle on={perms[r.k]} onChange={v=>set(r.k,v)}/>
          </div>
        ))}
      </Card>

      <div style={{height:20}}/>
      <Card refl>
        <div className="card-head"><h3>Dados sensíveis</h3></div>
        <div className="setting-row">
          <div className="body">
            <div className="ttl" style={{display:'flex',alignItems:'center',gap:8}}><Icon.Lock size={14}/>Resultado financeiro</div>
            <div className="desc">Opcional, secundário. Nunca aparece em painéis nem em gráficos. Só é incluído no contexto do Coach quando autorizado em cada sessão.</div>
          </div>
          <Toggle on={perms.fin} onChange={v=>set('fin',v)}/>
        </div>
      </Card>

      <div style={{height:20}}/>
      <Card>
        <div className="card-head"><h3>Exportar e apagar</h3></div>
        <div style={{display:'flex',gap:10}}>
          <Btn variant="ghost">Exportar dados (JSON)</Btn>
          <Btn variant="ghost" icon={<Icon.Trash size={14}/>}>Apagar conta</Btn>
        </div>
      </Card>
    </div>
  );
}
window.Settings = Settings;
