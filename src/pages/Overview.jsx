import { Card, Metric, Bar, Badge, Money, LineChart } from '../components/ui.jsx';
import { Section } from '../components/Fx.jsx';
import { metrics, riskScore, goalProgress, payCommitment, forecast } from '../domain/engine.js';
import { formatINR as f } from '../domain/utils.js';

export default function Overview({ fin, go }) {
  const { state, setState, asOf } = fin;
  const m = metrics(state, asOf), r = riskScore(m, state.plan), fc = forecast(state, asOf);
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const unpaid = state.commitments.filter((c) => !c.paid);
  const tone = r.label === 'Comfortable' ? 'ok' : r.label === 'Shortfall risk' ? 'bad' : 'warn';
  const say = m.flexible < 0 ? `You are short by ${f(m.shortfall)} once bills and savings are covered. Open Money Lab to find a fix.`
    : r.label === 'Comfortable' ? 'You are in good shape. Spend within this and your bills and savings stay safe.'
    : 'Your buffer is getting thin. Check a purchase in Money Lab before you buy.';
  return (<>
    <section className={`hero rise ${tone}`}>
      <span className="coin-float c1">₹</span><span className="coin-float c2">₹</span><span className="coin-float c3">₹</span>
      <p className="eyebrow">Safe to spend per day · {m.days} days left</p>
      <div className="hero-num"><Money paise={m.dailyAllowance} /></div>
      <p className="hero-say">{say}</p>
      <div className="row wrap"><button className="btn primary big" onClick={() => go('lab')}>✦ Can I afford something?</button><Badge label={r.label} /></div>
      <div className="split"><div><b><Money paise={m.flexible} /></b><span>free to spend this month</span></div>
        <div><b>{f(m.essentialDue)}</b><span>bills still to pay</span></div>
        <div><b>{f(m.protectedSavings)}</b><span>savings locked away</span></div></div>
    </section>

    <Section id="tour" title="Try the 30-second tour" sub="The fastest way to see what PaisaPilot does.">
      <div className="steps3">
        {[['Open Money Lab', 'Keep “Buy something” at ₹2,000.'], ['Read the verdict', 'Compare it with the cheaper and wait-a-week options.'], ['Test a ₹1,500 surprise', 'Press Discard. Nothing real changes until you press Apply.']].map(([h, p], i) => (
          <button key={h} className="step3" onClick={() => go('lab')}><b>{i + 1}</b><strong>{h}</strong><span>{p}</span></button>))}
      </div>
    </Section>

    <Section id="glance" title="Your month at a glance" sub="Where the money is right now.">
      <div className="grid">
        <Metric label="Money in account" value={f(m.balance)} hint="Includes locked savings" />
        <Metric label="Spent so far" value={f(m.spent)} />
        <Metric label="Earned so far" value={f(m.income)} />
        <Metric label="Expected on day 30" value={f(m.projectedEnd)} hint="If nothing else changes" tone={m.projectedEnd < 0 ? 'bad' : ''} />
      </div>
    </Section>

    <Section id="health" title="Health and future" sub="How safe the plan is, and where your balance is heading.">
      <div className="two">
        <Card title="Health score" hint="A simple 0–100 indicator from your bills, lowest balance and free money. It is not a credit score.">
          <p className="score"><Money paise={r.score * 100} /></p>
          <ul className="plain">{r.factors.map((x) => <li key={x.label}>{x.label}<Bar percent={x.value * 100} /></li>)}</ul>
          {r.reasons.map((x) => <p key={x} className="muted">• {x}</p>)}
        </Card>
        <Card title="Your next 30 days"><LineChart series={fc.series} protectedAmt={fc.protectedAmt} />
          <p className="muted">Dashed line = savings you shouldn't touch.</p></Card>
      </div>
    </Section>

    <Section id="plan" title="Bills and goals" sub="What you owe, and what you are protecting.">
      <div className="two">
        <Card title="Bills to pay">
          {unpaid.length === 0 && <p className="muted">All bills paid. Nice.</p>}
          {unpaid.map((c) => (<div className="item" key={c.id}><span>{c.name}<small>due {c.dueDate}</small></span>
            <span>{f(c.amount)}<button className="btn" onClick={() => setState(payCommitment(state, c.id, asOf))}>Mark paid</button></span></div>))}
        </Card>
        <Card title="Savings goals">
          {state.goals.length === 0 && <p className="muted">No goals yet. <button className="link" onClick={() => go('goals')}>Add one</button></p>}
          {state.goals.map((g) => { const p = goalProgress(g); return (<div key={g.id}><div className="item"><span>{g.name}</span><span>{f(g.saved)} / {f(g.target)}</span></div><Bar percent={p.percent} /></div>); })}
        </Card>
      </div>
    </Section>

    <Section id="recent" title="Recent activity">
      <Card>
        {recent.length === 0 && <p className="muted">Nothing yet. Apply a decision in Money Lab or add spending.</p>}
        {recent.map((t) => <div className="item" key={t.id}><span>{t.description}<small>{t.date} · {t.status}</small></span><span className={t.type === 'income' ? 'pos' : ''}>{t.type === 'income' ? '+' : '−'}{f(t.amount)}</span></div>)}
        <details><summary>What do these words mean?</summary>
          <p><b>Safe to spend:</b> money left after bills and locked savings, split across the days remaining.</p>
          <p><b>Locked savings:</b> goal money marked “protected”. It stays in your account but isn't counted as spendable.</p>
          <p><b>Expected on day 30:</b> your balance at the end, using known bills, subscriptions and planned income.</p></details>
      </Card>
    </Section>
  </>);
}
