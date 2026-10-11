import test from 'node:test';
import assert from 'node:assert/strict';
import { demoState } from '../data/demoData.js';
import { metrics, previewScenario, applyScenario, payCommitment, projectCharges } from '../domain/engine.js';
import { toPaise } from '../domain/utils.js';

const D = '2026-10-01';
const buy = (r, date = D) => ({ type: 'expense', amount: toPaise(r), date, description: 'Test' });
let n = 0; const ids = () => `t${++n}`;
const freeze = (o) => { Object.values(o).forEach((v) => typeof v === 'object' && v && freeze(v)); return Object.freeze(o); };

test('baseline: ₹6,000 flexible, ₹200/day', () => {
  const m = metrics(demoState(D), D);
  assert.equal(m.flexible, toPaise(6000)); assert.equal(m.dailyAllowance, toPaise(200));
});
test('₹2,000 purchase: flexible ₹4,000, ₹133.33/day', () => {
  const r = previewScenario(demoState(D), [buy(2000)], [], D);
  assert.equal(r.scenario.flexible, toPaise(4000)); assert.equal(r.scenario.dailyAllowance, 13333);
});
test('paying a bill keeps flexible money unchanged', () => {
  const a = demoState(D), b = payCommitment(a, 'c-mess', D, ids);
  assert.equal(metrics(b, D).flexible, metrics(a, D).flexible);
});
test('preview never mutates; apply adds once', () => {
  const s = freeze(demoState(D));
  previewScenario(s, [buy(2000)], [], D);
  assert.equal(applyScenario(s, [buy(500)], [], D, ids).transactions.length, 1);
  assert.equal(s.transactions.length, 0);
});
test('cancelled and paused subscriptions create no charges', () => {
  const sub = { id: 's', name: 'X', amount: 100, frequency: 'monthly', nextChargeDate: D, status: 'cancelled' };
  assert.equal(projectCharges(sub, D, '2026-12-31').length, 0);
  assert.equal(projectCharges({ ...sub, status: 'paused' }, D, '2026-12-31').length, 0);
});