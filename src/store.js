import { useState, useEffect } from 'react';
import { demoState } from './data/demoData.js';
import { today } from './domain/utils.js';

const KEY = 'paisapilot.v1';
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw); if (s.schemaVersion === 1) return s; } }
  catch { /* corrupted or unavailable storage: fall back to demo */ }
  return demoState(today());
}
export function useFinance() {
  const [state, setState] = useState(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }, [state]);
  const reset = () => setState(demoState(today()));
  const fresh = () => setState({ ...demoState(today()), isDemo: false, commitments: [], goals: [] });
  return { state, setState, reset, fresh, asOf: today() };
}