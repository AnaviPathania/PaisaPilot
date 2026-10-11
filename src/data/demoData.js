import { toPaise, addDays } from '../domain/utils.js';
// Demo assumptions: ₹10,000 over 30 days; ₹2,000 essential bills unpaid; ₹2,000 reserved for a
// protected goal (inside the balance but never spendable); no subscriptions at the start.
export const demoState = (start) => ({
  schemaVersion: 1, isDemo: true,
  plan: { currency: 'INR', startDate: start, endDate: addDays(start, 29), startingFunds: toPaise(10000) },
  transactions: [],
  commitments: [
    { id: 'c-mess', name: 'Hostel mess fee', amount: toPaise(1500), dueDate: addDays(start, 9), paid: false, essential: true },
    { id: 'c-phone', name: 'Phone recharge', amount: toPaise(500), dueDate: addDays(start, 14), paid: false, essential: true },
  ],
  goals: [{ id: 'g-laptop', name: 'Laptop fund', target: toPaise(8000), saved: toPaise(2000), deadline: addDays(start, 120), protected: true }],
  subscriptions: [],
});