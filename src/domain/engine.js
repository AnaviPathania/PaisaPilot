import { addDays, addMonths, diffDays, eachDay, clamp } from './utils.js';

const st = (t) => t.status ?? 'paid';
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

/* ---------- subscriptions ---------- */
const STEP = { weekly: (a, k) => addDays(a, 7 * k), monthly: (a, k) => addMonths(a, k),
  quarterly: (a, k) => addMonths(a, 3 * k), yearly: (a, k) => addMonths(a, 12 * k) };
// paused -> no charges; cancelled -> none (or only before cancelledOn); paid duplicates skipped.
export function projectCharges(sub, from, to, txns = []) {
  if (sub.status === 'paused') return [];
  if (sub.status === 'cancelled' && !sub.cancelledOn) return [];
  const step = STEP[sub.frequency]; if (!step) return [];
  const out = [];
  for (let k = 0; k < 500; k++) {
    const date = step(sub.nextChargeDate, k);
    if (diffDays(date, to) > 0) break;
    if (sub.status === 'cancelled' && diffDays(date, sub.cancelledOn) >= 0) break;
    if (diffDays(date, from) < 0) continue;
    if (txns.some((t) => t.subscriptionId === sub.id && t.date === date && st(t) === 'paid')) continue;
    out.push({ date, amount: sub.amount, label: sub.name, essential: !!sub.essential });
  }
  return out;
}

/* ---------- calculations ---------- */
export const actualBalance = (s) => s.plan.startingFunds
  + sum(s.transactions.filter((t) => t.type === 'income' && st(t) === 'paid').map((t) => t.amount))
  - sum(s.transactions.filter((t) => t.type === 'expense' && st(t) === 'paid').map((t) => t.amount));
export const remainingDays = (plan, asOf) => Math.max(0, diffDays(plan.endDate, asOf) + 1);
export const protectedSavings = (s) => sum(s.goals.filter((g) => g.protected).map((g) => g.saved));

export function upcomingOutflows(s, asOf) {
  const end = s.plan.endDate, due = (d) => (diffDays(d, asOf) < 0 ? asOf : d), ev = [];
  for (const c of s.commitments) if (!c.paid && diffDays(c.dueDate, end) <= 0)
    ev.push({ kind: 'commitment', date: due(c.dueDate), amount: c.amount, label: c.name, essential: !!c.essential });
  for (const t of s.transactions) if (t.type === 'expense' && st(t) === 'planned' && diffDays(t.date, end) <= 0)
    ev.push({ kind: 'planned', date: due(t.date), amount: t.amount, label: t.description, essential: !!t.essential });
  for (const sub of s.subscriptions) for (const c of projectCharges(sub, asOf, end, s.transactions))
    ev.push({ kind: 'subscription', date: c.date, amount: c.amount, label: c.label, essential: c.essential });
  return ev;
}
const expectedIncome = (s, asOf) => s.transactions
  .filter((t) => t.type === 'income' && st(t) === 'expected' && diffDays(t.date, s.plan.endDate) <= 0)
  .map((t) => ({ kind: 'income', date: diffDays(t.date, asOf) < 0 ? asOf : t.date, amount: t.amount, label: t.description }));

// Same-day rule: income first, then outflows. Negative balances are kept.
export function forecast(s, asOf) {
  const events = [...upcomingOutflows(s, asOf), ...expectedIncome(s, asOf)];
  let bal = actualBalance(s); const start = bal, prot = protectedSavings(s);
  let firstUnsafe = null; const series = [];
  for (const date of eachDay(asOf, s.plan.endDate)) {
    const day = events.filter((e) => e.date === date);
    for (const e of day.filter((e) => e.kind === 'income')) bal += e.amount;
    for (const e of day.filter((e) => e.kind !== 'income')) bal -= e.amount;
    if (bal - prot < 0 && !firstUnsafe) firstUnsafe = { date, balance: bal, causes: day.filter((e) => e.kind !== 'income') };
    series.push({ date, balance: bal, events: day });
  }
  return { series, firstUnsafe, protectedAmt: prot,
    projectedEnd: series.length ? series.at(-1).balance : start,
    minBalance: series.length ? Math.min(...series.map((p) => p.balance)) : start };
}

export const goalProgress = (g) => ({
  percent: g.target > 0 ? clamp((g.saved / g.target) * 100, 0, 100) : (g.saved > 0 ? 100 : 0),
  over: Math.max(0, g.saved - g.target), remaining: Math.max(0, g.target - g.saved),
});

// flexible = balance - upcoming outflows - protected savings. Negative = shortfall (never clamped).
export function metrics(s, asOf) {
  const balance = actualBalance(s), prot = protectedSavings(s), out = upcomingOutflows(s, asOf);
  const essentialDue = sum(out.filter((e) => e.kind === 'commitment' && e.essential).map((e) => e.amount));
  const otherDue = sum(out.map((e) => e.amount)) - essentialDue;
  const flexible = balance - essentialDue - otherDue - prot, days = remainingDays(s.plan, asOf), f = forecast(s, asOf);
  return { balance, protectedSavings: prot, essentialDue, otherDue, flexible, days,
    shortfall: flexible < 0 ? -flexible : 0,
    dailyAllowance: flexible < 0 || days === 0 ? 0 : Math.round(flexible / days),
    projectedEnd: f.projectedEnd, minBalance: f.minBalance, firstUnsafe: f.firstUnsafe,
    spent: sum(s.transactions.filter((t) => t.type === 'expense' && st(t) === 'paid').map((t) => t.amount)),
    income: sum(s.transactions.filter((t) => t.type === 'income' && st(t) === 'paid').map((t) => t.amount)) };
}

/* ---------- risk score (0-100, transparent; not a credit score) ---------- */
export const STRESS_EXPENSE = 150000; // ₹1,500
export function riskScore(m, plan) {
  const coverage = m.essentialDue === 0 ? 1 : clamp((m.balance - m.protectedSavings) / m.essentialDue, 0, 1);
  const cushion = clamp((m.minBalance - m.protectedSavings) / STRESS_EXPENSE, 0, 1);
  const target = plan.startingFunds * 0.5;
  const buffer = target > 0 ? clamp(m.flexible / target, 0, 1) : 0;
  const factors = [
    { label: 'Essential bills covered', weight: 35, value: coverage },
    { label: 'Lowest projected balance vs ₹1,500 stress', weight: 35, value: cushion },
    { label: 'Flexible money vs 50% of starting funds', weight: 30, value: buffer }];
  const score = Math.round(factors.reduce((a, f) => a + f.weight * f.value, 0));
  let label = score >= 70 ? 'Comfortable' : score >= 40 ? 'Watch your buffer' : 'Shortfall risk';
  const reasons = [];
  if (m.flexible < 0 || m.firstUnsafe) { label = 'Shortfall risk'; reasons.push('Planned outflows push your balance below your protected savings.'); }
  if (coverage < 1) reasons.push('Essential bills are not fully covered by unprotected funds.');
  if (buffer < 0.5 && m.flexible >= 0) reasons.push('Flexible money is under 25% of your starting funds.');
  return { score, label, factors, reasons };
}

/* ---------- scenarios: preview is a pure overlay; apply commits it; discard does nothing ---------- */
let seq = 0;
const newId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${++seq}`;
const toTxn = (e, asOf, id) => ({ id, type: e.type, amount: e.amount, date: e.date,
  description: e.description ?? 'Scenario', category: e.category ?? 'other', essential: !!e.essential,
  status: diffDays(e.date, asOf) <= 0 ? 'paid' : e.type === 'income' ? 'expected' : 'planned' });

export function overlay(state, events = [], changes = [], asOf, idGen = newId) {
  return { ...state,
    transactions: [...state.transactions, ...events.map((e) => toTxn(e, asOf, idGen()))],
    subscriptions: state.subscriptions.map((sub) => {
      const c = changes.find((x) => x.subscriptionId === sub.id);
      return c ? { ...sub, status: c.status, cancelledOn: c.cancelledOn } : sub;
    }) };
}
export function previewScenario(state, events, changes, asOf) {
  const base = metrics(state, asOf), next = metrics(overlay(state, events, changes, asOf), asOf);
  const rb = riskScore(base, state.plan), rn = riskScore(next, state.plan), d = (k) => next[k] - base[k];
  return { base, scenario: next, riskBase: rb, riskScenario: rn,
    deltas: { balance: d('balance'), flexible: d('flexible'), dailyAllowance: d('dailyAllowance'),
      projectedEnd: d('projectedEnd'), score: rn.score - rb.score } };
}
export const applyScenario = (state, events, changes, asOf, idGen = newId) => overlay(state, events, changes, asOf, idGen);

export const payCommitment = (state, id, date, idGen = newId) => {
  const c = state.commitments.find((x) => x.id === id);
  if (!c || c.paid) return state;
  return { ...state,
    commitments: state.commitments.map((x) => (x.id === id ? { ...x, paid: true } : x)),
    transactions: [...state.transactions, { id: idGen(), type: 'expense', amount: c.amount, date,
      description: c.name, category: 'bills', essential: true, status: 'paid' }] };
};