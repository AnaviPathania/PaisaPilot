import { useEffect, useRef, useState } from 'react';
import { formatINR } from '../domain/utils.js';

export const Card = ({ title, children, className = '', hint }) => (
  <section className={`card rise ${className}`}>
    {title && <h3>{title}{hint && <span className="hint-i" title={hint} tabIndex={0} aria-label={hint}>?</span>}</h3>}
    {children}
  </section>
);
export const Metric = ({ label, value, hint, tone }) => (
  <div className={`metric rise ${tone || ''}`}>
    <span className="m-label">{label}</span><strong className="m-value">{value}</strong>
    {hint && <span className="m-hint">{hint}</span>}
  </div>
);
export const Bar = ({ percent }) => (
  <div className="bar" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
    <div style={{ width: `${percent}%` }} />
  </div>
);
export const Badge = ({ label }) => {
  const tone = label === 'Comfortable' ? 'ok' : label === 'Shortfall risk' ? 'bad' : 'warn';
  return <span className={`badge ${tone}`}>{tone === 'ok' ? '✔' : tone === 'bad' ? '⚠' : '●'} {label}</span>;
};
// Animated money number (respects reduced motion).
export function Money({ paise }) {
  const [v, setV] = useState(paise); const from = useRef(paise);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(paise); from.current = paise; return; }
    const a = from.current, t0 = performance.now(); let id;
    const tick = (t) => { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(a + (paise - a) * e)); if (k < 1) id = requestAnimationFrame(tick); else from.current = paise; };
    id = requestAnimationFrame(tick); return () => cancelAnimationFrame(id);
  }, [paise]);
  return <>{formatINR(v)}</>;
}
export function LineChart({ series, protectedAmt }) {
  if (!series.length) return <p className="muted">No days left in this plan.</p>;
  const W = 640, H = 220, P = 30;
  const vals = series.map((p) => p.balance).concat([protectedAmt, 0]);
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const x = (i) => P + (i * (W - 2 * P)) / Math.max(1, series.length - 1);
  const y = (v) => H - P - ((v - min) / span) * (H - 2 * P);
  const pts = series.map((p, i) => `${x(i)},${y(p.balance)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Projected balance over the plan period">
      <polygon points={`${x(0)},${H - P} ${pts} ${x(series.length - 1)},${H - P}`} className="area" />
      <line x1={P} x2={W - P} y1={y(0)} y2={y(0)} className="axis" />
      <line x1={P} x2={W - P} y1={y(protectedAmt)} y2={y(protectedAmt)} className="prot" />
      <polyline points={pts} className="line" fill="none" pathLength="1" />
      {series.map((p, i) => p.events.length > 0 && <circle key={p.date} cx={x(i)} cy={y(p.balance)} r="4.5" className="dot"><title>{p.date}</title></circle>)}
      <text x={P} y={12} className="lbl">{formatINR(max)}</text>
      <text x={P} y={H - 8} className="lbl">{series[0].date}</text>
      <text x={W - P} y={H - 8} textAnchor="end" className="lbl">{series.at(-1).date}</text>
    </svg>
  );
}
