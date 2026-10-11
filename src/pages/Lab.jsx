import { useState } from 'react';
import { Card, Badge, Money } from '../components/ui.jsx';
import { previewScenario, applyScenario } from '../domain/engine.js';
import { formatINR as f, toPaise, addDays } from '../domain/utils.js';

const TYPES = [['purchase', '🛍', 'Buy something'], ['emergency', '⚡', 'Surprise expense'], ['income', '💰', 'Extra money'], ['subscription', '↻', 'Cancel a subscription']];
const PRESETS = [500, 900, 1500, 2000, 3000];
const sign = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + f(Math.abs(n));

export default function Lab({ fin, go }) {
  const { state, setState, asOf } = fin;
  const [type, setType] = useState('purchase'), [amt, setAmt] = useState(2000), [date, setDate] = useState(asOf);
  const [note, setNote] = useState(''), [subId, setSubId] = useState(''), [msg, setMsg] = useState('');
  const mk = (a, d) => type === 'subscription' ? [] : [{ type: type === 'income' ? 'income' : 'expense', amount: toPaise(a), date: d,
    description: note || ({ emergency: 'Surprise expense', income: 'Extra money', purchase: 'Purchase' }[type]), essential: type === 'emergency' }];
  const changes = type === 'subscription' && subId ? [{ subscriptionId: subId, status: 'cancelled' }] : [];
  const valid = type === 'subscription' ? !!subId : Number(amt) > 0 && !!date;
  const events = mk(amt, date), p = valid ? previewScenario(state, events, changes, asOf) : null;
  const verdict = !p ? null : p.scenario.flexible < 0
    ? { t: 'bad', h: 'Not safely right now', s: `You'd be ${f(p.scenario.shortfall)} short once your bills and savings are covered.` }
    : p.riskScenario.label === 'Comfortable' || type === 'income' || type === 'subscription'
    ? { t: 'ok', h: type === 'income' || type === 'subscription' ? 'This helps your plan' : 'Yes, you can afford this', s: `You'd still have ${f(p.scenario.flexible)} free to spend this month.` }
    : { t: 'warn', h: 'Possible, but it eats your buffer', s: `Only ${f(p.scenario.flexible)} would be left, so a surprise bill could hurt.` };
  const alts = (type === 'purchase' && valid) ? [
    ['Buy now', mk(amt, date), amt, date], ['Wait a week', mk(amt, addDays(date, 7)), amt, addDays(date, 7)],
    ['Half the price', mk(Math.round(amt / 2), date), Math.round(amt / 2), date]].map(([n, ev, a, d]) => ({ n, a, d, r: previewScenario(state, ev, [], asOf) })) : [];
  const apply = () => { setState(applyScenario(state, events, changes, asOf)); setMsg('Applied ✔ Your real plan is updated. Check Home.'); };
  const discard = () => { setAmt(2000); setNote(''); setSubId(''); setMsg('Discarded. Nothing in your real plan changed.'); };
  const pick = (k) => { setType(k); setMsg(''); setSubId(''); };
  return (<>
    <Card title="Step 1 · What are you thinking about?">
      <div className="tiles">{TYPES.map(([k, ic, l]) => <button key={k} className={`tile ${type === k ? 'on' : ''}`} onClick={() => pick(k)}><span>{ic}</span>{l}</button>)}</div>
    </Card>
    <Card title="Step 2 · How much, and when?">
      {type === 'subscription' ? (
        state.subscriptions.filter((s) => s.status === 'active').length === 0
          ? <p className="muted">No active subscriptions yet. <button className="link" onClick={() => go('subs')}>Add one</button> to test cancelling it.</p>
          : <label>Which one?<select value={subId} onChange={(e) => setSubId(e.target.value)}><option value="">Choose…</option>
            {state.subscriptions.filter((s) => s.status === 'active').map((s) => <option key={s.id} value={s.id}>{s.name} ({f(s.amount)})</option>)}</select></label>
      ) : (<div className="form">
        <div className="amount"><span>₹</span><input aria-label="Amount in rupees" type="number" min="1" value={amt} onChange={(e) => setAmt(e.target.value)} /></div>
        <input aria-label="Amount slider" type="range" min="100" max="10000" step="100" value={Number(amt) || 0} onChange={(e) => setAmt(e.target.value)} />
        <div className="row wrap">{PRESETS.map((v) => <button key={v} className={`chip ${Number(amt) === v ? 'on' : ''}`} onClick={() => setAmt(v)}>{f(v * 100)}</button>)}</div>
        <div className="two-in"><label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label>Note (optional)<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. headphones" /></label></div>
      </div>)}
      {!valid && type !== 'subscription' && <p className="err" role="alert">Enter an amount above ₹0 and a date.</p>}
    </Card>
    {p && (<Card title="Step 3 · What happens? (preview only)" className={`hypo ${verdict.t}`}>
      <div className={`verdict ${verdict.t}`}><div><h3>{verdict.h}</h3><p>{verdict.s}</p></div><Badge label={p.riskScenario.label} /></div>
      <div className="compare">
        <div><span>Safe to spend / day</span><s>{f(p.base.dailyAllowance)}</s><b><Money paise={p.scenario.dailyAllowance} /></b></div>
        <div><span>Free to spend this month</span><s>{f(p.base.flexible)}</s><b><Money paise={p.scenario.flexible} /></b></div>
        <div><span>Expected on day 30</span><s>{f(p.base.projectedEnd)}</s><b><Money paise={p.scenario.projectedEnd} /></b></div>
        <div><span>Health score</span><s>{p.riskBase.score}</s><b>{p.riskScenario.score} <small className={p.deltas.score < 0 ? 'neg' : 'pos'}>({p.deltas.score > 0 ? '+' : ''}{p.deltas.score})</small></b></div>
      </div>
      {p.scenario.firstUnsafe && <p className="err">⚠ Your balance would dip below your savings on {p.scenario.firstUnsafe.date}.</p>}
      {p.riskScenario.reasons.map((x) => <p key={x} className="muted">• {x}</p>)}
      <div className="row wrap"><button className="btn primary" onClick={apply}>Apply decision</button><button className="btn" onClick={discard}>Discard</button></div>
      <p className="muted small">Estimates from your current plan. Apply records it; Discard changes nothing.</p>
    </Card>)}
    {msg && <p className="toast pop" role="status">{msg}</p>}
    {alts.length > 0 && (<Card title="Smarter options" hint="Compares timing and price only. Waiting doesn't create money unless income arrives.">
      <div className="alts">{alts.map((o) => (<button key={o.n} className="alt" onClick={() => { setAmt(o.a); setDate(o.d); }}>
        <b>{o.n}</b><span>{f(toPaise(o.a))} on {o.d}</span><em>{f(o.r.scenario.dailyAllowance)}/day</em><small>{f(o.r.scenario.projectedEnd)} on day 30</small></button>))}</div>
      <p className="muted small">Tap an option to load it into the preview above.</p></Card>)}
  </>);
}
