function Sessions({ setRoute }) {
  const rows = [
    { date:'14 Mai', focus:'Disciplina em ICM até bolha', tournaments:6, dur:'2h 04m', dq:4, tilt:1, status:'pending' },
    { date:'13 Mai', focus:'Não jogar em autopiloto', tournaments:8, dur:'3h 12m', dq:3, tilt:2, status:'reviewed' },
    { date:'12 Mai', focus:'Aproveitar fold equity nos bubbles', tournaments:7, dur:'2h 48m', dq:4, tilt:1, status:'reviewed' },
    { date:'10 Mai', focus:'Voltar a jogar com clareza', tournaments:5, dur:'1h 50m', dq:3, tilt:3, status:'reviewed' },
    { date:'09 Mai', focus:'Disciplina em open ranges', tournaments:9, dur:'3h 30m', dq:4, tilt:0, status:'reviewed' },
  ];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Histórico</div>
          <h1>Sessões</h1>
          <p>Cada sessão alimenta o Coach com contexto real.</p>
        </div>
        <div className="page-actions">
          <Btn variant="ghost" icon={<Icon.Search size={14}/>}>Filtrar</Btn>
          <Btn variant="primary" icon={<Icon.Play size={14}/>} onClick={() => setRoute('active')}>Iniciar sessão</Btn>
        </div>
      </div>

      <Card>
        <table className="tbl">
          <thead>
            <tr>
              <th>Data</th><th>Foco</th><th>Torneios</th><th>Duração</th><th>Qual.</th><th>Tilt</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i}>
                <td className="num">{r.date}</td>
                <td>{r.focus}</td>
                <td className="num">{r.tournaments}</td>
                <td className="num">{r.dur}</td>
                <td className="num">{r.dq}/5</td>
                <td className="num">{r.tilt}/5</td>
                <td>{r.status === 'pending'
                  ? <Pill status="adj">Review pendente</Pill>
                  : <Pill status="done">Revista</Pill>}</td>
                <td><button className="icon-btn" aria-label="abrir"><Icon.Arrow size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
window.Sessions = Sessions;
