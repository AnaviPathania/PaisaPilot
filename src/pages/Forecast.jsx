import { Card, LineChart } from '../components/ui.jsx';
import { forecast } from '../domain/engine.js';
import { formatINR as f } from '../domain/utils.js';

export default function Forecast({ fin }) {
  const { state, asOf } = fin;
  const fc = forecast(state, asOf);
  const days = fc.series.filter((p) => p.events.length > 0);
  return (<>
    <Card title="Future Me timeline">
      <LineChart series={fc.series} protectedAmt={fc.protectedAmt} />
      <p className="muted">Dashed line = protected savings. Dots = days with events. Same-day rule: income is counted before outflows.</p>
      <p>Projected end balance: <strong>{f(fc.projectedEnd)}</strong> · Lowest point: <strong>{f(fc.minBalance)}</strong></p>
      {fc.firstUnsafe
        ? <p className="err">⚠ Your balance first drops below protected savings on {fc.firstUnsafe.date}, caused by: {fc.firstUnsafe.causes.map((c) => `${c.label} (${f(c.amount)})`).join(', ')}.</p>
        : <p className="pos">✔ No unsafe day in this plan period.</p>}
    </Card>
    <Card title="Scheduled events">
      {days.length === 0 && <p className="muted">No scheduled events.</p>}
      {days.map((p) => p.events.map((e, i) => (
        <div className="item" key={p.date + i}><span>{p.date} · {e.label} · {e.kind}</span>
          <span className={e.kind === 'income' ? 'pos' : ''}>{e.kind === 'income' ? '+' : '−'}{f(e.amount)}</span></div>)))}
    </Card></>);
}