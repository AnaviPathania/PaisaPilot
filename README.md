# PaisaPilot

**Your money. Your choices. Your future.**

Live demo: https://paisapilot-eta.vercel.app/
## challenge brief
Build a modern, interactive personal finance experience for Gen Z that helps users manage a limited ₹10,000 budget over 30 days and make informed financial decisions.

The application should go beyond basic expense tracking by connecting income, balance, spending, commitments, savings goals, subscriptions, unexpected expenses, financial risk, and financial health.

Users should be able to simulate financial decisions before taking them and clearly understand how each decision affects their remaining balance, daily allowance, savings goals, monthly forecast, financial risk, and overall financial health.

The experience should feel like a real consumer-facing financial product where financial decisions have visible and interconnected consequences.
## Problem
Students and young adults in India manage a fixed amount of money, for
example ₹10,000 for 30 days. Expense trackers show where money went. They
do not show what a decision will do to the rest of the month.

## Solution
PaisaPilot lets you test a purchase, surprise expense or extra income
before committing. The What-If Money Lab shows the effect on your daily
spending limit, free money, savings and month-end balance. Nothing changes
until you press Apply.

## Features
- Money Lab: preview a purchase, surprise expense, extra income or a
  cancelled subscription, then Apply or Discard
- Cheaper and wait-a-week alternatives compared side by side
- Safe-to-spend per day, based on bills and protected savings
- Health score (0-100) with a transparent, rule-based explanation
- 30-day balance forecast chart with the first unsafe day highlighted
- Spending, Goals, Subscriptions and Future pages
- Animated intro and sectioned home page
- Demo data, Reset demo and Start fresh
- Data saved in the browser (LocalStorage), no account or bank needed

## Tech stack
React 18, Vite 5, plain CSS design tokens, LocalStorage, Node test runner.

## Project structure
- `src/domain/` pure finance logic: engine.js (balance, forecast,
  scenarios, risk score) and utils.js (money and date helpers)
- `src/pages/` Overview, Lab, Forecast, Lists
- `src/components/` shared UI (ui.jsx) and effects (Fx.jsx)
- `src/data/` demo data
- `src/store.js` shared state and persistence
- `src/test/` unit tests for the engine

## Financial model
- Money is stored as integer paise to avoid rounding errors.
- Free money = balance - upcoming bills - protected savings.
- Daily allowance = free money / days left. A negative result is shown as
  a shortfall and is never clamped to zero.
- Scenario previews run on a copy of the data and never change the real
  plan. Only Apply saves them.
- Same-day events: income is counted before expenses.

## Run locally
npm install
npm run dev
npm test
npm run build

## Accessibility and responsiveness
Keyboard focus styles, labelled controls, status shown with text as well as
color, reduced-motion support, and a mobile bottom navigation below 800px.

## Limitations
Prototype only. No real bank connection. Projections are estimates, not
financial advice.
