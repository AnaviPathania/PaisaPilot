import { useEffect, useRef, useState } from 'react';

// Fades a section in once when it scrolls into view.
export function Reveal({ children, className = '', as: Tag = 'div' }) {
  const ref = useRef(null); const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el || !('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${on ? 'in' : ''} ${className}`}>{children}</Tag>;
}

export const Section = ({ id, title, sub, children }) => (
  <Reveal as="section" className="sect"><div id={id} className="sect-head"><h3>{title}</h3>{sub && <p>{sub}</p>}</div>{children}</Reveal>
);

// Opening screen: name types in, rupee coins fall into a savings jar that fills up.
const COINS = Array.from({ length: 26 }, (_, i) => ({ l: (i * 37) % 100, d: (i * 0.17) % 3.2, t: 2.4 + ((i * 7) % 10) / 10, s: 18 + ((i * 5) % 16) }));
export function Splash({ onDone }) {
  const [out, setOut] = useState(false);
  const finish = () => { setOut(true); setTimeout(onDone, 600); };
  useEffect(() => { const t = setTimeout(finish, 5200); return () => clearTimeout(t); }, []);
  return (
    <div className={`splash ${out ? 'out' : ''}`} role="dialog" aria-label="PaisaPilot intro" onClick={finish}>
      {COINS.map((c, i) => <span key={i} className="coin" style={{ left: `${c.l}%`, animationDelay: `${c.d}s`, animationDuration: `${c.t}s`, width: c.s, height: c.s, fontSize: c.s * 0.6 }}>₹</span>)}
      <div className="splash-mid">
        <h1 className="splash-title" aria-label="PaisaPilot">{'PaisaPilot'.split('').map((ch, i) => <span key={i} style={{ animationDelay: `${0.15 + i * 0.07}s` }}>{ch}</span>)}</h1>
        <p className="splash-tag">Your money. Your choices. Your future.</p>
        <svg className="jar" viewBox="0 0 120 140" aria-hidden="true">
          <defs><clipPath id="jc"><path d="M22 30h76l8 12v70q0 18-18 18H32q-18 0-18-18V42z" /></clipPath>
            <linearGradient id="jg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9ff6a" /><stop offset="1" stopColor="#2dd4bf" /></linearGradient></defs>
          <rect className="jar-fill" x="0" y="0" width="120" height="140" fill="url(#jg)" clipPath="url(#jc)" />
          <path d="M22 30h76l8 12v70q0 18-18 18H32q-18 0-18-18V42z" fill="none" stroke="#b6f23a" strokeWidth="3" />
          <rect x="30" y="16" width="60" height="12" rx="6" fill="#b6f23a" />
        </svg>
        <p className="splash-skip">Tap anywhere to skip</p>
      </div>
    </div>
  );
}
