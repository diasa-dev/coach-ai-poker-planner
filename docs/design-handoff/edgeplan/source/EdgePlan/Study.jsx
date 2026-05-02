function Study() {
  const [duration, setDuration] = React.useState(45);
  const [type, setType] = React.useState('icm');
  const [quality, setQuality] = React.useState(4);
  const rows = [
    { date:'14 Mai', dur:'45m', type:'ICM até bolha', quality:4, block:'sim' },
    { date:'13 Mai', dur:'45m', type:'Push/fold spots', quality:3, block:'sim' },
    { date:'12 Mai', dur:'25m', type:'Open ranges', quality:4, block:'—' },
    { date:'10 Mai', dur:'60m', type:'Bluff catch', quality:5, block:'sim' },
  ];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Quinta · semana 18</div>
          <h1>Estudo</h1>
          <p>Registo rápido. 60 segundos no máximo.</p>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.1fr 1fr',gap:20}}>
        <Card>
          <div className="card-head"><h3>Novo registo</h3></div>
          <div className="field"><label>Duração</label>
            <Segmented value={duration} onChange={setDuration} options={[
              {value:25,label:'25 m'},{value:45,label:'45 m'},{value:60,label:'60 m'},{value:90,label:'90 m'}
            ]}/>
          </div>
          <div style={{height:14}}/>
          <div className="field"><label>Tipo</label>
            <select className="select" value={type} onChange={e=>setType(e.target.value)}>
              <option value="icm">ICM</option>
              <option value="ranges">Open ranges</option>
              <option value="pf">Push / fold</option>
              <option value="bluff">Bluff catch</option>
              <option value="exploit">Exploits</option>
            </select>
          </div>
          <div style={{height:14}}/>
          <div className="field"><label>Qualidade</label><Rating value={quality} onChange={setQuality}/></div>
          <div style={{height:14}}/>
          <div className="field"><label>Bloco semanal (opcional)</label>
            <select className="select"><option>Estudo · ICM até bolha (45m)</option><option>—</option></select>
          </div>
          <div style={{height:14}}/>
          <div className="field"><label>Nota (opcional)</label>
            <textarea className="textarea" placeholder="O que ficou claro? O que ficou por resolver?"/>
          </div>
          <div style={{height:18}}/>
          <Btn variant="primary" icon={<Icon.Check size={14}/>}>Registar estudo</Btn>
        </Card>

        <div>
          <Card>
            <div className="card-head"><h4>Esta semana</h4><div className="card-meta">3h 15m / 5h</div></div>
            <ProgressBar value={3.25} max={5} tone="warn"/>
            <div style={{font:'var(--t-mono-sm)',color:'var(--fg-3)',marginTop:8}}>−1h 45m até final da semana</div>
          </Card>
          <div style={{height:16}}/>
          <Card>
            <div className="card-head"><h4>Recente</h4></div>
            <table className="tbl">
              <thead><tr><th>Data</th><th>Tipo</th><th>Dur.</th><th>Qual.</th></tr></thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={i}>
                    <td className="num">{r.date}</td>
                    <td>{r.type}</td>
                    <td className="num">{r.dur}</td>
                    <td className="num">{r.quality}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
window.Study = Study;
