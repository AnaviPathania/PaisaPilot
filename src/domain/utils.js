// Money is stored as integer paise. Dates are ISO 'YYYY-MM-DD' handled in UTC.
export const toPaise = (r) => Math.round(Number(r) * 100);
export const formatINR = (p) => {
  const whole = p % 100 === 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR',
    minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(p / 100);
};
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const MS = 86400000;
const parse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fmt = (ms) => new Date(ms).toISOString().slice(0, 10);
export const today = () => fmt(Date.now());
export const addDays = (iso, n) => fmt(parse(iso) + n * MS);
export const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / MS);
export function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return fmt(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(d, last)));
}
export const eachDay = (from, to) => {
  const out = []; for (let d = from; diffDays(to, d) >= 0; d = addDays(d, 1)) out.push(d); return out;
};