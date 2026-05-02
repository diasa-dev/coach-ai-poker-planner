function Monthly() {
  const targets = [
    { label:'Grind',  cur:42, tgt:80, unit:'h', tone:'',     pace:'no ritmo' },
    { label:'Estudo', cur:11.5, tgt:24, unit:'h', tone:'warn', pace:'−2h vs ritmo' },
    { label:'Review', cur:5,    tgt:12, unit:'h', tone:'',     pace:'no ritmo' },
    { label:'Sport',  cur:8,    tgt:16, unit:'h', tone:'',     pace:'no ritmo' },
  ];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Maio · 14º dia</div>
          <h1>Objetivos mensais</h1>
          <p>O ritmo esperado é o caminho linear até ao final do mês.</p>
        </div>
        <div className="page-actions">
          <Btn variant="ghost" icon={<Icon.Edit size={14}/>}>Editar objetivos</Btn>
        </div>
      </div>

      <Card>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{width:160}}>Categoria</th>
              <th style={{width:120}}>Atual</th>
              <th style={{width:120}}>Objetivo</th>
              <th>Progresso</th>
              <th style={{width:160}}>Ritmo</th>
            </tr>
          </thead>
          <tbody>
            {targets.map(t => (
              <tr key={t.label}>
                <td><CategoryChip category={t.label}/></td>
                <td className="num">{t.cur}{t.unit}</td>
                <td className="num" style={{color:'var(--fg-3)'}}>{t.tgt}{t.unit}</td>
                <td><ProgressBar value={t.cur} max={t.tgt} tone={t.tone}/></td>
                <td className="num" style={{color: t.tone==='warn'?'var(--ep-state-warning)':'var(--fg-2)'}}>{t.pace}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{height:20}}/>
      <Card refl>
        <CoachInsight
          text="Estudo está 2h abaixo do ritmo do mês. Nas próximas duas semanas, três blocos de 45 min recuperam-te sem comprometer o volume de grind."
          ctx="plano do mês + estudo da semana"/>
      </Card>
    </div>
  );
}
window.Monthly = Monthly;
