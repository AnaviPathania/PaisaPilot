import { useState } from 'react';
import { useFinance } from './store.js';
import Overview from './pages/Overview.jsx';
import Lab from './pages/Lab.jsx';
import Forecast from './pages/Forecast.jsx';
import { Splash } from './components/Fx.jsx';
import { Transactions, Goals, Subscriptions } from './pages/Lists.jsx';

const TABS = [['overview', '◉', 'Home', 'Where you stand today'], ['lab', '✦', 'Money Lab', 'Test a decision before you spend'],
  ['tx', '⇄', 'Spending', 'Add what you spend or earn'], ['goals', '◎', 'Goals', 'Savings you want to protect'],
  ['subs', '↻', 'Subscriptions', 'Recurring charges'], ['forecast', '≈', 'Future', 'Your next 30 days']];
const SLIDES = [
  ['👋', 'Welcome to PaisaPilot', 'You have a fixed amount of money for the next 30 days. PaisaPilot tells you how much you can safely spend each day, after your bills and savings are protected.'],
  ['✦', 'Test before you spend', 'Thinking of buying something? Open Money Lab, type the price, and see instantly what it does to your daily budget. Nothing changes until you say Apply.'],
  ['🛟', 'No surprises', 'Try a surprise expense to see if you would cope, and get cheaper or later options if not. Start in Home, then try the guided tour there.'],
];

export default function App() {
  const fin = useFinance();
  const [splash, setSplash] = useState(true);
  const [tab, setTab] = useState('overview');
  const [slide, setSlide] = useState(() => (localStorage.getItem('pp.seen') ? -1 : 0));
  const close = () => { localStorage.setItem('pp.seen', '1'); setSlide(-1); };
  const reset = () => window.confirm('Reset to the demo data? Your changes will be lost.') && fin.reset();
  const fresh = () => window.confirm('Start fresh with ₹10,000 and no bills or goals?') && fin.fresh();
  const Page = { overview: Overview, lab: Lab, tx: Transactions, goals: Goals, subs: Subscriptions, forecast: Forecast }[tab];
  const cur = TABS.find(([k]) => k === tab);
  return (
    <div className="shell">
      {splash && <Splash onDone={() => setSplash(false)} />}
      <div className="orb o1" /><div className="orb o2" />
      <nav className="nav" aria-label="Main">
        <div className="brand"><span className="logo">₹</span><div><h1>PaisaPilot</h1><p className="tag">Know before you spend</p></div></div>
        {TABS.map(([k, ic, l]) => <button key={k} className={tab === k ? 'active' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}><span className="ic">{ic}</span><span>{l}</span></button>)}
        <div className="spacer" />
        <button className="mini" onClick={() => setSlide(0)}>? How it works</button>
        <button className="mini" onClick={reset}>Reset demo</button>
        <button className="mini" onClick={fresh}>Start fresh</button>
      </nav>
      <main>
        <header className="top"><div><h2>{cur[2]}</h2><p className="muted">{cur[3]}</p></div>
          {fin.state.isDemo && <span className="demo" title="Sample numbers so you can explore safely">Demo data</span>}</header>
        <div key={tab} className="page"><Page fin={fin} go={setTab} /></div>
        <footer className="foot">Data stays in this browser. Projections are estimates, not financial advice. No real bank is connected.</footer>
      </main>
      {slide >= 0 && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Welcome">
          <div className="sheet pop">
            <div className="big-ic">{SLIDES[slide][0]}</div><h2>{SLIDES[slide][1]}</h2><p>{SLIDES[slide][2]}</p>
            <div className="dots">{SLIDES.map((_, i) => <i key={i} className={i === slide ? 'on' : ''} />)}</div>
            <div className="row center"><button className="btn" onClick={close}>Skip</button>
              <button className="btn primary" autoFocus onClick={() => (slide === SLIDES.length - 1 ? close() : setSlide(slide + 1))}>{slide === SLIDES.length - 1 ? 'Start exploring' : 'Next'}</button></div>
          </div>
        </div>)}
    </div>
  );
}
