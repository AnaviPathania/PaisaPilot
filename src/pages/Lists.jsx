import { useState } from 'react';
import { Card, Bar } from '../components/ui.jsx';
import { applyScenario, goalProgress, projectCharges } from '../domain/engine.js';
import { formatINR as f, toPaise, addDays } from '../domain/utils.js';

const uid = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
const ok = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

export function Transactions({ fin }) {
  const { state, setState, asOf } = fin;
  const [d, setD] = useState({ description: '', amount: '', type: 'expense', date: asOf, essential: false });
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('all');
  const add = (e) => {
    e.preventDefault();
    if (!d.description.trim()) return setErr('Please add a description.');
    if (!ok(d.amount)) return setErr('Amount must be a positive number.');
    setErr('');
    setState(applyScenario(state, [{ type: d.type, amount: toPaise(d.amount), date: d.date, description: d.description.trim(), essential: d.essential }], [], asOf));
    setD({ ...d, description: '', amount: '' });
  };
  const del = (t) => window.confirm(`Delete "${t.description}"?`) &&
    setState({ ...state, transactions: state.transactions.filter((x) => x.id !== t.id) });
  const list = state.transactions.filter((t) => filter === 'all' || t.type === filter).sort((a, b) => b.date.localeCompare(a.date));
  return (<>
    <Card title="Add transaction">
      <form className="form" onSubmit={add}>
        <label>Description<input value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></label>
        <label>Amount (₹)<input type="number" value={d.amount} onChange={(e) => setD({ ...d, amount: e.target.value })} /></label>
        <label>Type<select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select></label>
        <label>Date<input type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></label>
        <label className="check"><input type="checkbox" checked={d.essential} onChange={(e) => setD({ ...d, essential: e.target.checked })} /> Essential</label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary" type="submit">Add</button>
      </form>
      <p className="muted">Dates after today are saved as planned/expected and only affect forecasts.</p>
    </Card>
    <Card title="Transactions">
      <label>Show <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All</option><option value="expense">Expenses</option><option value="income">Income</option></select></label>
      {list.length === 0 && <p className="muted">Nothing here yet. Add a transaction above.</p>}
      {list.map((t) => <div className="item" key={t.id}><span>{t.description} · {t.date} · {t.status}</span>
        <span>{t.type === 'income' ? '+' : '−'}{f(t.amount)} <button className="btn" onClick={() => del(t)}>Delete</button></span></div>)}
    </Card></>);
}

export function Goals({ fin }) {
  const { state, setState, asOf } = fin;
  const [g, setG] = useState({ name: '', target: '', saved: '0', deadline: addDays(asOf, 90), protected: true });
  const [err, setErr] = useState('');
  const add = (e) => {
    e.preventDefault();
    if (!g.name.trim() || !ok(g.target) || Number(g.saved) < 0) return setErr('Give a name, a positive target and a saved amount of 0 or more.');
    setErr('');
    setState({ ...state, goals: [...state.goals, { id: uid(), name: g.name.trim(), target: toPaise(g.target), saved: toPaise(g.saved), deadline: g.deadline, protected: g.protected }] });
    setG({ ...g, name: '', target: '', saved: '0' });
  };
  const del = (x) => window.confirm(`Delete goal "${x.name}"?`) && setState({ ...state, goals: state.goals.filter((y) => y.id !== x.id) });
  const days = (x) => Math.max(1, Math.round((new Date(x.deadline) - new Date(asOf)) / 86400000));
  return (<>
    <Card title="Add goal">
      <form className="form" onSubmit={add}>
        <label>Name<input value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} /></label>
        <label>Target (₹)<input type="number" value={g.target} onChange={(e) => setG({ ...g, target: e.target.value })} /></label>
        <label>Saved so far (₹)<input type="number" value={g.saved} onChange={(e) => setG({ ...g, saved: e.target.value })} /></label>
        <label>Deadline<input type="date" value={g.deadline} onChange={(e) => setG({ ...g, deadline: e.target.value })} /></label>
        <label className="check"><input type="checkbox" checked={g.protected} onChange={(e) => setG({ ...g, protected: e.target.checked })} /> Protected (not spendable)</label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary" type="submit">Add goal</button>
      </form>
    </Card>
    <Card title="Goals">
      {state.goals.length === 0 && <p className="muted">No goals yet.</p>}
      {state.goals.map((x) => { const p = goalProgress(x); const per = Math.ceil(p.remaining / days(x)); return (
        <div key={x.id} className="goal"><div className="item"><span>{x.name}{x.protected ? ' · protected' : ''}</span>
          <span>{f(x.saved)} / {f(x.target)} <button className="btn" onClick={() => del(x)}>Delete</button></span></div>
          <Bar percent={p.percent} />
          <p className="muted">{p.remaining === 0 ? 'Target reached 🎉' : `Remaining ${f(p.remaining)} · about ${f(per)}/day to reach it by ${x.deadline}`}</p></div>); })}
    </Card></>);
}

export function Subscriptions({ fin }) {
  const { state, setState, asOf } = fin;
  const [s, setS] = useState({ name: '', amount: '', frequency: 'monthly', nextChargeDate: asOf });
  const [err, setErr] = useState('');
  const add = (e) => {
    e.preventDefault();
    if (!s.name.trim() || !ok(s.amount)) return setErr('Give a name and a positive amount.');
    setErr('');
    setState({ ...state, subscriptions: [...state.subscriptions, { id: uid(), name: s.name.trim(), amount: toPaise(s.amount), frequency: s.frequency, nextChargeDate: s.nextChargeDate, status: 'active' }] });
    setS({ ...s, name: '', amount: '' });
  };
  const setStatus = (id, status) => setState({ ...state, subscriptions: state.subscriptions.map((x) => x.id === id ? { ...x, status } : x) });
  const del = (x) => window.confirm(`Delete "${x.name}"?`) && setState({ ...state, subscriptions: state.subscriptions.filter((y) => y.id !== x.id) });
  const next30 = state.subscriptions.flatMap((x) => projectCharges(x, asOf, addDays(asOf, 29), state.transactions));
  const total = next30.reduce((a, c) => a + c.amount, 0);
  return (<>
    <Card title="Add subscription">
      <form className="form" onSubmit={add}>
        <label>Name<input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></label>
        <label>Amount (₹)<input type="number" value={s.amount} onChange={(e) => setS({ ...s, amount: e.target.value })} /></label>
        <label>Frequency<select value={s.frequency} onChange={(e) => setS({ ...s, frequency: e.target.value })}>
          {['weekly', 'monthly', 'quarterly', 'yearly'].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Next charge<input type="date" value={s.nextChargeDate} onChange={(e) => setS({ ...s, nextChargeDate: e.target.value })} /></label>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn primary" type="submit">Add</button>
      </form>
    </Card>
    <Card title={`Subscriptions · ${f(total)} due in the next 30 days`}>
      <p className="muted">Pause/cancel only changes your PaisaPilot plan. It does not cancel the real service.</p>
      {state.subscriptions.length === 0 && <p className="muted">No subscriptions yet.</p>}
      {[...state.subscriptions].sort((a, b) => a.nextChargeDate.localeCompare(b.nextChargeDate)).map((x) => (
        <div className="item" key={x.id}><span>{x.name} · {f(x.amount)} {x.frequency} · next {x.nextChargeDate}</span>
          <span><select aria-label={`Status of ${x.name}`} value={x.status} onChange={(e) => setStatus(x.id, e.target.value)}>
            <option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option></select>
            <button className="btn" onClick={() => del(x)}>Delete</button></span></div>))}
    </Card></>);
}