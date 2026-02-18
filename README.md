# 💰 DebtFree v2.0 — AI-Powered Debt Stress Analyzer & Payoff Strategist

A comprehensive, interactive tool that helps Indian households analyze their debt burden, compare payoff strategies, and get AI-powered financial insights for a personalized debt-freedom roadmap. 

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## 🎯 The Problem

Indian household debt-to-GDP has crossed 40%. Millions juggle multiple EMIs — home loans, car loans, personal loans, credit cards — without understanding their true debt burden or the optimal repayment order. Most tools handle individual loans. None provide a unified, actionable debt-freedom roadmap with intelligent recommendations.

## ✨ Features

### 📊 Debt Stress Score (0–100)
Composite metric factoring EMI-to-income ratio, debt-to-annual-income, weighted average interest rate, toxic debt exposure, and debt complexity.

### 🧮 3 Payoff Strategies Compared
| Strategy | Logic | Best For |
|----------|-------|----------|
| **Avalanche** | Highest interest rate first | Minimizing total interest paid |
| **Snowball** | Smallest balance first | Quick psychological wins |
| **Hybrid** | Weighted by rate × balance | Balanced approach |

### ✦ AI-Powered Financial Insights
- Toxic debt alerts with cost-per-month calculations
- EMI overload detection with restructuring suggestions
- Consolidation opportunity identification
- Emergency buffer analysis
- Untapped payoff potential recommendations

### 📋 Personalized Action Plan
- Priority-ordered repayment sequence
- Monthly cashflow breakdown
- Key milestones timeline with debt-free date
- Visual paydown charts

### 🔧 Fully Interactive
- Add/remove/edit unlimited debts
- Debt type classification (secured, unsecured, revolving)
- Real-time per-loan cost breakdowns
- Adjustable income and extra payment amounts
- All metrics recalculate instantly

## 🚀 Quick Start

```bash
git clone https://github.com/babubl/debtfree.git
cd debtfree
npm install
npm run dev
```

Open [http://localhost:5173/debtfree/](http://localhost:5173/debtfree/)

## 🌐 Live Demo

[https://babubl.github.io/debtfree/](https://babubl.github.io/debtfree/)

## 📦 Deployment

### GitHub Pages (Automatic)
Push to `main` → GitHub Actions auto-deploys to Pages.

1. Go to **Settings → Pages → Source → GitHub Actions**
2. Push any commit to `main`
3. Live in ~2 minutes

### Vercel / Netlify
Connect your repo — zero config needed. Remove the `base` option in `vite.config.js` for root domain deployments.

## 🛠 Tech Stack

- **React 18** — Hooks-based UI
- **Recharts** — Interactive Area, Bar charts
- **Vite 5** — Lightning-fast builds
- **Custom Design System** — Dark theme with carefully crafted tokens

## ⚠️ Disclaimer

This tool provides general financial analysis for educational purposes only. It does not constitute professional financial advice. Consult a certified financial planner (CFP) for personalized advice.

## 📄 License

MIT — Free to use, modify, and distribute.

---

**Built with ☕ in India**
