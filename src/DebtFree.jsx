import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, RadialBarChart, RadialBar,
} from "recharts";

/* ─────────────────────── DESIGN TOKENS ─────────────────────── */
const T = {
  bg: "#06090f", bgCard: "#0c1220", bgCardHover: "#111a2e",
  bgInput: "#080c16", border: "#162036", borderLight: "#1e3050",
  accent: "#00e8b8", accentDim: "rgba(0,232,184,0.08)", accentMid: "rgba(0,232,184,0.2)",
  danger: "#ff3b5c", dangerDim: "rgba(255,59,92,0.1)",
  warn: "#ffb020", warnDim: "rgba(255,176,32,0.1)",
  safe: "#00e87b", safeDim: "rgba(0,232,123,0.1)",
  blue: "#3b82f6", blueDim: "rgba(59,130,246,0.1)",
  purple: "#a855f7", purpleDim: "rgba(168,85,247,0.1)",
  cyan: "#06b6d4",
  text: "#e8edf5", textSec: "#8899b4", textMut: "#4a5e7a",
  font: "'Instrument Sans', 'SF Pro Display', system-ui, sans-serif",
  mono: "'IBM Plex Mono', 'SF Mono', monospace",
  display: "'Bricolage Grotesque', 'SF Pro Display', system-ui, sans-serif",
  radius: 14, radiusSm: 10, radiusXs: 7,
};

/* ─────────────────────── UTILITIES ─────────────────────── */
const fmt = (n) => {
  if (n >= 1e7) return `₹${(n/1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n/1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(n/1e3).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
};
const fmtFull = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const pct = (n) => `${n.toFixed(1)}%`;
const months2str = (m) => {
  const y = Math.floor(m / 12);
  const mo = m % 12;
  return y > 0 ? `${y}y ${mo}m` : `${mo}m`;
};

/* ─────────────────────── AI INSIGHTS ENGINE ─────────────────────── */
function generateAIInsights(debts, income, stressScore, strategies, extraPayment) {
  const insights = [];
  const { factors } = stressScore;
  if (!debts.length || !income) return [{ type: "info", icon: "💡", title: "Add your debts to get started", body: "Enter your loans and income to receive personalized AI-powered insights." }];

  // Critical alerts
  if (factors.emiToIncome > 50) {
    insights.push({ type: "critical", icon: "🚨", title: "EMI Overload Detected", body: `Your EMIs consume ${pct(factors.emiToIncome)} of income — well above the safe limit of 40%. This leaves critically thin margins for emergencies. Consider restructuring or consolidating high-rate debts immediately.` });
  }

  const highRateDebts = debts.filter(d => d.rate > 18);
  if (highRateDebts.length > 0) {
    const names = highRateDebts.map(d => d.name).join(", ");
    const totalHigh = highRateDebts.reduce((s, d) => s + d.balance, 0);
    insights.push({ type: "danger", icon: "🔥", title: "Toxic Debt Alert", body: `${names} ${highRateDebts.length > 1 ? 'carry' : 'carries'} interest above 18% — totaling ${fmtFull(totalHigh)}. Every month delayed costs you ${fmtFull(totalHigh * (highRateDebts[0].rate / 100 / 12))} in interest. This is the single biggest drain on your wealth.` });
  }

  // Strategic recommendations
  const bestStrat = ["avalanche","snowball","hybrid"].reduce((best, key) => strategies[key].totalInterest < strategies[best].totalInterest ? key : best, "avalanche");
  const savedVsBaseline = strategies.baseline.totalInterest - strategies[bestStrat].totalInterest;
  const monthsSaved = strategies.baseline.months - strategies[bestStrat].months;
  if (savedVsBaseline > 0) {
    insights.push({ type: "success", icon: "🎯", title: `${bestStrat.charAt(0).toUpperCase() + bestStrat.slice(1)} Saves You The Most`, body: `With just ${fmtFull(extraPayment)}/month extra, the ${bestStrat} strategy saves you ${fmtFull(savedVsBaseline)} in interest and gets you debt-free ${monthsSaved} months earlier. That's ${months2str(monthsSaved)} of financial freedom gained.` });
  }

  // Income-based guidance
  const remainingIncome = income - factors.totalEMI - extraPayment;
  const savingsRate = (remainingIncome / income) * 100;
  if (savingsRate < 20) {
    insights.push({ type: "warn", icon: "⚠️", title: "Emergency Buffer Thin", body: `After EMIs and extra payments, only ${pct(savingsRate)} of income remains (${fmtFull(remainingIncome)}/mo). Financial planners recommend keeping at least 20% free. Consider building a 3-month emergency fund of ${fmtFull(factors.totalEMI * 3)} before aggressive repayment.` });
  } else if (savingsRate > 40) {
    const couldPayExtra = Math.round((remainingIncome - income * 0.3) / 1000) * 1000;
    if (couldPayExtra > extraPayment) {
      insights.push({ type: "opportunity", icon: "💰", title: "Untapped Payoff Potential", body: `You have ${fmtFull(remainingIncome)}/mo after all payments. You could safely increase extra payments to ${fmtFull(couldPayExtra)}/mo while keeping 30% income buffer. This would dramatically accelerate your debt-free date.` });
    }
  }

  // Debt consolidation check
  const avgRate = factors.weightedRate;
  const spreadDebts = debts.filter(d => d.rate > avgRate + 3);
  if (spreadDebts.length >= 2 && avgRate > 10) {
    insights.push({ type: "info", icon: "🔄", title: "Consolidation Opportunity", body: `You have ${spreadDebts.length} debts with rates significantly above your weighted average of ${pct(avgRate)}. A balance transfer or consolidation loan at a lower rate could simplify payments and reduce total interest.` });
  }

  // Positive reinforcement
  if (stressScore.score >= 70) {
    insights.push({ type: "success", icon: "✅", title: "Strong Financial Position", body: `Your Debt Stress Score of ${stressScore.score} indicates healthy debt management. Stay the course — your debt structure is sustainable and you're well-positioned to accelerate payoff with even modest extra payments.` });
  }

  // Debt-to-income ratio insight
  if (factors.debtToAnnualIncome > 3) {
    insights.push({ type: "warn", icon: "📊", title: "High Debt-to-Income Ratio", body: `Your total debt is ${factors.debtToAnnualIncome.toFixed(1)}x your annual income. Lenders typically flag ratios above 3x. This may affect your ability to get new credit at favorable rates. Focus on reducing the principal aggressively.` });
  }

  return insights.slice(0, 5);
}

/* ─────────────────────── CALCULATION ENGINE ─────────────────────── */
function calcStressScore(debts, income) {
  if (!debts.length || !income) return { score: 0, grade: "N/A", color: T.textMut, factors: { emiToIncome: 0, debtToAnnualIncome: 0, weightedRate: 0, highRateRatio: 0, numDebts: 0, totalEMI: 0, totalBalance: 0 } };
  const totalEMI = debts.reduce((s, d) => s + d.emi, 0);
  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const weightedRate = totalBalance > 0 ? debts.reduce((s, d) => s + d.rate * (d.balance / totalBalance), 0) : 0;
  const emiToIncome = (totalEMI / income) * 100;
  const debtToAnnualIncome = totalBalance / (income * 12);
  const highRateDebt = debts.filter(d => d.rate > 15).reduce((s, d) => s + d.balance, 0);
  const highRateRatio = totalBalance > 0 ? (highRateDebt / totalBalance) * 100 : 0;

  let score = 100;
  // EMI burden
  if (emiToIncome > 55) score -= 40;
  else if (emiToIncome > 45) score -= 30;
  else if (emiToIncome > 35) score -= 20;
  else if (emiToIncome > 25) score -= 10;
  else if (emiToIncome > 15) score -= 3;
  // Leverage
  if (debtToAnnualIncome > 6) score -= 25;
  else if (debtToAnnualIncome > 4) score -= 18;
  else if (debtToAnnualIncome > 2.5) score -= 12;
  else if (debtToAnnualIncome > 1) score -= 5;
  // Rate
  if (weightedRate > 24) score -= 22;
  else if (weightedRate > 16) score -= 14;
  else if (weightedRate > 10) score -= 7;
  // Toxic debt
  if (highRateRatio > 40) score -= 18;
  else if (highRateRatio > 25) score -= 12;
  else if (highRateRatio > 10) score -= 5;
  // Complexity
  if (debts.length > 5) score -= 10;
  else if (debts.length > 3) score -= 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  let grade, color;
  if (score >= 80) { grade = "Excellent"; color = T.safe; }
  else if (score >= 65) { grade = "Good"; color = T.accent; }
  else if (score >= 45) { grade = "Stressed"; color = T.warn; }
  else { grade = "Critical"; color = T.danger; }

  return { score, grade, color, factors: { emiToIncome, debtToAnnualIncome, weightedRate, highRateRatio, numDebts: debts.length, totalEMI, totalBalance } };
}

function simulatePayoff(debts, strategy, extra = 0) {
  if (!debts.length) return { months: 0, totalInterest: 0, timeline: [], milestones: [] };
  let bals = debts.map(d => ({ ...d, rem: d.balance }));
  let month = 0, totalInterest = 0;
  const timeline = [], milestones = [];
  const startTotal = bals.reduce((s, d) => s + d.rem, 0);

  while (bals.some(d => d.rem > 0.5) && month < 600) {
    month++;
    let mInt = 0, mPrin = 0;
    bals.forEach(d => {
      if (d.rem <= 0) return;
      const interest = d.rem * (d.rate / 1200);
      const principal = Math.min(d.emi - interest, d.rem);
      d.rem = Math.max(0, d.rem - principal);
      mInt += interest; mPrin += principal; totalInterest += interest;
    });
    // Extra payments
    let ex = extra;
    if (ex > 0) {
      let sorted;
      if (strategy === "avalanche") sorted = [...bals].sort((a, b) => b.rate - a.rate);
      else if (strategy === "snowball") sorted = [...bals].sort((a, b) => a.rem - b.rem);
      else sorted = [...bals].sort((a, b) => (b.rate * b.rem) - (a.rate * a.rem));
      for (const d of sorted) {
        if (d.rem <= 0 || ex <= 0) continue;
        const pay = Math.min(ex, d.rem);
        d.rem -= pay; ex -= pay; mPrin += pay;
      }
    }
    const totalRem = bals.reduce((s, d) => s + d.rem, 0);
    // Check milestones
    const pctPaid = ((startTotal - totalRem) / startTotal) * 100;
    if (milestones.length === 0 && pctPaid >= 25) milestones.push({ month, label: "25% paid off", pct: 25 });
    if (milestones.length === 1 && pctPaid >= 50) milestones.push({ month, label: "Halfway!", pct: 50 });
    if (milestones.length === 2 && pctPaid >= 75) milestones.push({ month, label: "75% done", pct: 75 });
    // Check individual debt payoffs
    bals.forEach(d => {
      if (d.rem <= 0 && !d._cleared) {
        d._cleared = true;
        milestones.push({ month, label: `${d.name} cleared!`, pct: Math.round(pctPaid) });
      }
    });

    if (month <= 360 && (month % 3 === 0 || totalRem <= 0.5)) {
      timeline.push({ month, balance: Math.round(totalRem), interest: Math.round(mInt), principal: Math.round(mPrin) });
    }
  }
  if (milestones.length < 4) milestones.push({ month, label: "DEBT FREE! 🎉", pct: 100 });
  return { months: month, totalInterest: Math.round(totalInterest), timeline, milestones };
}

/* ─────────────────────── COMPONENTS ─────────────────────── */

// Animated number display
function AnimNum({ value, prefix = "", suffix = "", color = T.text, size = 28 }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef(null);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (Math.abs(diff) < 1) { setDisplay(value); return; }
    const duration = 600;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);
  return <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: size, color, letterSpacing: -0.5 }}>{prefix}{typeof display === 'number' ? display.toLocaleString("en-IN") : display}{suffix}</span>;
}

// Score ring
function ScoreRing({ score, grade, color, size = 170 }) {
  const r = (size - 24) / 2;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const offset = arc - (score / 100) * arc;
  const center = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size * 0.85, margin: "0 auto" }}>
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`}>
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d={`M ${size * 0.11} ${size * 0.72} A ${r} ${r} 0 1 1 ${size * 0.89} ${size * 0.72}`}
          fill="none" stroke={T.border} strokeWidth="10" strokeLinecap="round" />
        <path d={`M ${size * 0.11} ${size * 0.72} A ${r} ${r} 0 1 1 ${size * 0.89} ${size * 0.72}`}
          fill="none" stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={arc} strokeDashoffset={offset} filter="url(#glow)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
        <div style={{ fontFamily: T.mono, fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2.5, marginTop: 4 }}>{grade}</div>
      </div>
    </div>
  );
}

// Card wrapper
function Card({ children, style: s = {}, glow, ...rest }) {
  return (
    <div style={{
      background: T.bgCard, borderRadius: T.radius, border: `1px solid ${glow ? glow + "33" : T.border}`,
      padding: 24, position: "relative", overflow: "hidden",
      boxShadow: glow ? `0 0 40px ${glow}11` : "none",
      transition: "border-color 0.3s, box-shadow 0.3s", ...s
    }} {...rest}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 11, color: T.textMut, textTransform: "uppercase", letterSpacing: 2, fontWeight: 600, marginBottom: 14 }}>{children}</div>;
}

function MetricRow({ label, value, color = T.text, sub }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 13, color: T.textSec }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 14, color }}>{value}</span>
        {sub && <div style={{ fontSize: 10, color: T.textMut }}>{sub}</div>}
      </div>
    </div>
  );
}

// Insight card
function InsightCard({ insight, index }) {
  const typeColors = { critical: T.danger, danger: T.danger, warn: T.warn, success: T.safe, opportunity: T.accent, info: T.blue };
  const c = typeColors[insight.type] || T.blue;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${c}08, ${c}03)`,
      border: `1px solid ${c}25`, borderRadius: T.radiusSm, padding: "16px 18px",
      animation: `fadeSlideIn 0.4s ease ${index * 0.1}s both`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{insight.icon}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{insight.title}</span>
      </div>
      <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.65, margin: 0 }}>{insight.body}</p>
    </div>
  );
}

// Input field
function Field({ label, value, onChange, prefix = "", mono = true, small }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, color: T.textMut, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMut, fontSize: 13, fontFamily: T.mono }}>{prefix}</span>}
        <input type="number" value={value || ""} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: T.radiusXs,
            padding: prefix ? "11px 14px 11px 28px" : "11px 14px", color: T.text,
            fontSize: small ? 13 : 15, fontFamily: mono ? T.mono : T.font, fontWeight: 600,
            outline: "none", transition: "border 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = T.accent}
          onBlur={e => e.target.style.borderColor = T.border}
        />
      </div>
    </div>
  );
}

/* ─────────────────────── SAMPLE DATA ─────────────────────── */
const SAMPLE_DEBTS = [
  { id: 1, name: "Home Loan (SBI)", balance: 3200000, rate: 8.50, emi: 32000, type: "secured" },
  { id: 2, name: "Car Loan (HDFC)", balance: 520000, rate: 9.25, emi: 14500, type: "secured" },
  { id: 3, name: "Personal Loan (ICICI)", balance: 300000, rate: 13.5, emi: 10500, type: "unsecured" },
  { id: 4, name: "Credit Card (Axis)", balance: 145000, rate: 42.0, emi: 12000, type: "revolving" },
];

/* ─────────────────────── MAIN APP ─────────────────────── */
export default function DebtFree() {
  const [debts, setDebts] = useState(SAMPLE_DEBTS);
  const [income, setIncome] = useState(125000);
  const [extra, setExtra] = useState(5000);
  const [tab, setTab] = useState("dashboard");
  const [nextId, setNextId] = useState(5);
  const [showWelcome, setShowWelcome] = useState(true);

  const handleDebtChange = useCallback((id, key, val) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, [key]: val } : d));
  }, []);

  const stress = useMemo(() => calcStressScore(debts, income), [debts, income]);

  const strategies = useMemo(() => ({
    baseline: simulatePayoff(debts, "baseline", 0),
    avalanche: simulatePayoff(debts, "avalanche", extra),
    snowball: simulatePayoff(debts, "snowball", extra),
    hybrid: simulatePayoff(debts, "hybrid", extra),
  }), [debts, extra]);

  const best = useMemo(() => {
    return ["avalanche", "snowball", "hybrid"].reduce((b, k) =>
      strategies[k].totalInterest < strategies[b].totalInterest ? k : b, "avalanche");
  }, [strategies]);

  const insights = useMemo(() => generateAIInsights(debts, income, stress, strategies, extra), [debts, income, stress, strategies, extra]);

  const chartData = useMemo(() => {
    const maxLen = Math.max(strategies.avalanche.timeline.length, strategies.snowball.timeline.length, strategies.hybrid.timeline.length);
    return Array.from({ length: maxLen }, (_, i) => ({
      month: strategies.avalanche.timeline[i]?.month || strategies.snowball.timeline[i]?.month || strategies.hybrid.timeline[i]?.month || 0,
      Avalanche: strategies.avalanche.timeline[i]?.balance ?? null,
      Snowball: strategies.snowball.timeline[i]?.balance ?? null,
      Hybrid: strategies.hybrid.timeline[i]?.balance ?? null,
    }));
  }, [strategies]);

  const saved = strategies.baseline.totalInterest - strategies[best].totalInterest;
  const monthsSaved = strategies.baseline.months - strategies[best].months;

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: "◈" },
    { id: "debts", label: "Debts", icon: "◇" },
    { id: "strategies", label: "Strategies", icon: "△" },
    { id: "insights", label: "AI Insights", icon: "✦" },
    { id: "plan", label: "Action Plan", icon: "→" },
  ];

  const debtColors = [T.accent, T.blue, T.purple, "#fb923c", T.warn, T.cyan, T.danger];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font }}>
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        background: `linear-gradient(180deg, ${T.bgCard} 0%, ${T.bg} 100%)`,
        borderBottom: `1px solid ${T.border}`, padding: "18px 28px",
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.accent}, ${T.cyan})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 900, color: T.bg, fontFamily: T.mono,
            }}>₹</div>
            <div>
              <h1 style={{
                margin: 0, fontSize: 20, fontWeight: 800, fontFamily: T.display, letterSpacing: -0.5,
                background: `linear-gradient(135deg, ${T.accent} 0%, ${T.cyan} 50%, ${T.blue} 100%)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundSize: "200% auto", animation: "shimmer 4s linear infinite",
              }}>DebtFree</h1>
              <p style={{ margin: 0, fontSize: 11, color: T.textMut, letterSpacing: 0.5 }}>AI-Powered Debt Stress Analyzer</p>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: `${stress.color}15`, padding: "7px 14px", borderRadius: 20,
            border: `1px solid ${stress.color}30`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: stress.color, animation: stress.score < 40 ? "pulse 1.5s infinite" : "none" }} />
            <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: stress.color }}>{stress.score}</span>
            <span style={{ fontSize: 11, color: T.textSec }}>{stress.grade}</span>
          </div>
        </div>
      </header>

      {/* ── NAV TABS ── */}
      <nav style={{ borderBottom: `1px solid ${T.border}`, background: `${T.bgCard}cc`, backdropFilter: "blur(10px)", position: "sticky", top: 72, zIndex: 99 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 0, padding: "0 28px", overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", padding: "13px 18px", cursor: "pointer",
              color: tab === t.id ? T.accent : T.textMut, fontSize: 13, fontWeight: 600,
              borderBottom: tab === t.id ? `2px solid ${T.accent}` : "2px solid transparent",
              transition: "all 0.25s", fontFamily: T.font, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 7,
            }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 28px 80px" }}>

        {/* ════════ DASHBOARD ════════ */}
        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Welcome banner */}
            {showWelcome && (
              <div style={{
                background: `linear-gradient(135deg, ${T.accentDim}, ${T.blueDim})`,
                borderRadius: T.radius, padding: "20px 24px", border: `1px solid ${T.accent}20`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                animation: "fadeSlideIn 0.5s ease",
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: T.display, marginBottom: 4 }}>Welcome to DebtFree</div>
                  <div style={{ fontSize: 13, color: T.textSec }}>
                    This tool analyzes your complete debt portfolio, compares payoff strategies, and generates AI-powered insights to help you become debt-free faster. Start by reviewing the sample data or edit your debts in the "Debts" tab.
                  </div>
                </div>
                <button onClick={() => setShowWelcome(false)} style={{ background: "none", border: "none", color: T.textMut, cursor: "pointer", fontSize: 18, padding: 8 }}>✕</button>
              </div>
            )}

            {/* Income controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Card>
                <Field label="Monthly Net Income" prefix="₹" value={income} onChange={setIncome} />
              </Card>
              <Card>
                <Field label="Extra Payment / Month" prefix="₹" value={extra} onChange={setExtra} />
              </Card>
            </div>

            {/* Score + Metrics + Best Strategy */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 16 }}>
              <Card glow={stress.color}>
                <Label>Debt Stress Score</Label>
                <ScoreRing score={stress.score} grade={stress.grade} color={stress.color} />
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { l: "EMI/Income", v: pct(stress.factors.emiToIncome), c: stress.factors.emiToIncome > 40 ? T.danger : T.accent },
                    { l: "Debt/Income", v: `${stress.factors.debtToAnnualIncome.toFixed(1)}x`, c: stress.factors.debtToAnnualIncome > 3 ? T.warn : T.accent },
                    { l: "Avg Rate", v: pct(stress.factors.weightedRate), c: stress.factors.weightedRate > 15 ? T.danger : T.text },
                    { l: "Toxic Debt", v: pct(stress.factors.highRateRatio), c: stress.factors.highRateRatio > 25 ? T.danger : T.text },
                  ].map(m => (
                    <div key={m.l} style={{ background: T.bg, borderRadius: T.radiusXs, padding: "8px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMut, textTransform: "uppercase", letterSpacing: 1 }}>{m.l}</div>
                      <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: m.c, marginTop: 2 }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <Label>Debt Portfolio</Label>
                <MetricRow label="Total Outstanding" value={fmtFull(stress.factors.totalBalance)} color={T.text} />
                <MetricRow label="Monthly EMI Outflow" value={fmtFull(stress.factors.totalEMI)} color={T.warn} />
                <MetricRow label="Active Loans" value={`${debts.length}`} />
                <MetricRow label="Annual Income" value={fmtFull(income * 12)} />
                <MetricRow label="Free Cash After EMI" value={fmtFull(income - stress.factors.totalEMI)} color={income - stress.factors.totalEMI > 0 ? T.safe : T.danger} />
                {/* Mini composition bar */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", borderRadius: 5, overflow: "hidden", height: 8 }}>
                    {debts.map((d, i) => {
                      const total = stress.factors.totalBalance || 1;
                      return <div key={d.id} style={{ width: `${(d.balance / total) * 100}%`, background: debtColors[i % debtColors.length], transition: "width 0.5s" }} />;
                    })}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", marginTop: 10 }}>
                    {debts.map((d, i) => (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: debtColors[i % debtColors.length] }} />
                        <span style={{ color: T.textSec }}>{d.name}</span>
                        <span style={{ color: debtColors[i % debtColors.length], fontFamily: T.mono, fontWeight: 600 }}>{d.rate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card glow={T.accent}>
                <Label>Optimal Strategy</Label>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: T.display, color: T.accent, lineHeight: 1, marginBottom: 6 }}>
                  {best.charAt(0).toUpperCase() + best.slice(1)}
                </div>
                <p style={{ fontSize: 12, color: T.textMut, marginBottom: 16 }}>
                  {best === "avalanche" ? "Target highest interest first" : best === "snowball" ? "Clear smallest balance first" : "Weighted rate × balance"}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ background: T.safeDim, borderRadius: T.radiusXs, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: T.safe, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Interest Saved</div>
                    <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color: T.safe, marginTop: 2 }}>{fmt(saved)}</div>
                  </div>
                  <div style={{ background: T.accentDim, borderRadius: T.radiusXs, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: T.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Debt-Free In</div>
                    <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 800, color: T.accent, marginTop: 2 }}>{months2str(strategies[best].months)}</div>
                    <div style={{ fontSize: 11, color: T.textMut }}>{monthsSaved}mo earlier than baseline</div>
                  </div>
                  <div style={{ background: T.blueDim, borderRadius: T.radiusXs, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: T.blue, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Total Interest</div>
                    <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.blue, marginTop: 2 }}>{fmtFull(strategies[best].totalInterest)}</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Top AI Insight */}
            {insights.length > 0 && (
              <InsightCard insight={insights[0]} index={0} />
            )}
          </div>
        )}

        {/* ════════ DEBTS TAB ════════ */}
        {tab === "debts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 800, margin: 0 }}>Manage Debts</h2>
                <p style={{ fontSize: 13, color: T.textMut, margin: "4px 0 0" }}>Add all your active loans, credit cards, and EMI obligations</p>
              </div>
              <button onClick={() => { setDebts(p => [...p, { id: nextId, name: "", balance: 0, rate: 0, emi: 0, type: "unsecured" }]); setNextId(n => n + 1); }}
                style={{
                  background: `linear-gradient(135deg, ${T.accent}, ${T.cyan})`, border: "none", borderRadius: T.radiusSm,
                  padding: "11px 22px", color: T.bg, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: T.font,
                }}>+ Add Debt</button>
            </div>

            {debts.map((d, idx) => (
              <Card key={d.id} style={{ animation: `fadeSlideIn 0.3s ease ${idx * 0.05}s both` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: debtColors[idx % debtColors.length] }} />
                    <input type="text" value={d.name} placeholder="Loan Name"
                      onChange={e => handleDebtChange(d.id, "name", e.target.value)}
                      style={{
                        background: "transparent", border: "none", color: T.text,
                        fontSize: 16, fontWeight: 700, fontFamily: T.font, outline: "none", width: 300,
                      }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <select value={d.type || "unsecured"} onChange={e => handleDebtChange(d.id, "type", e.target.value)}
                      style={{
                        background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: T.radiusXs,
                        padding: "7px 12px", color: T.textSec, fontSize: 12, fontFamily: T.font, outline: "none",
                      }}>
                      <option value="secured">Secured</option>
                      <option value="unsecured">Unsecured</option>
                      <option value="revolving">Revolving</option>
                    </select>
                    <button onClick={() => setDebts(p => p.filter(x => x.id !== d.id))}
                      style={{ background: T.dangerDim, border: `1px solid ${T.danger}30`, borderRadius: T.radiusXs, color: T.danger, cursor: "pointer", padding: "7px 12px", fontSize: 13 }}>
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                  <Field label="Outstanding Balance" prefix="₹" value={d.balance} onChange={v => handleDebtChange(d.id, "balance", v)} small />
                  <Field label="Interest Rate (% p.a.)" value={d.rate} onChange={v => handleDebtChange(d.id, "rate", v)} small />
                  <Field label="Monthly EMI" prefix="₹" value={d.emi} onChange={v => handleDebtChange(d.id, "emi", v)} small />
                </div>
                {d.rate > 0 && d.balance > 0 && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: T.bg, borderRadius: T.radiusXs, display: "flex", gap: 24, fontSize: 12 }}>
                    <span style={{ color: T.textMut }}>Monthly interest cost: <span style={{ color: T.warn, fontFamily: T.mono, fontWeight: 600 }}>{fmtFull(d.balance * d.rate / 1200)}</span></span>
                    <span style={{ color: T.textMut }}>Principal in EMI: <span style={{ color: T.safe, fontFamily: T.mono, fontWeight: 600 }}>{fmtFull(Math.max(0, d.emi - d.balance * d.rate / 1200))}</span></span>
                    {d.emi > 0 && <span style={{ color: T.textMut }}>Payoff: <span style={{ color: T.text, fontFamily: T.mono, fontWeight: 600 }}>~{months2str(Math.ceil(d.balance / Math.max(1, d.emi - d.balance * d.rate / 1200)))}</span></span>}
                  </div>
                )}
              </Card>
            ))}
            {debts.length === 0 && (
              <Card style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No debts added</div>
                <div style={{ fontSize: 13, color: T.textMut }}>Click "+ Add Debt" to begin your analysis</div>
              </Card>
            )}
          </div>
        )}

        {/* ════════ STRATEGIES TAB ════════ */}
        {tab === "strategies" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 800, margin: 0 }}>Strategy Comparison</h2>
              <p style={{ fontSize: 13, color: T.textMut, margin: "4px 0 0" }}>See which repayment approach saves you the most money and time</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {[
                { key: "avalanche", name: "Avalanche", desc: "Targets highest interest rate first. Mathematically optimal — minimizes total interest paid.", color: T.danger, icon: "🔺" },
                { key: "snowball", name: "Snowball", desc: "Clears smallest balance first. Builds momentum through quick wins — great for motivation.", color: T.blue, icon: "⚪" },
                { key: "hybrid", name: "Hybrid", desc: "Weights by rate × balance product. Balances mathematical efficiency with practical impact.", color: T.purple, icon: "◆" },
              ].map(s => {
                const data = strategies[s.key];
                const isBest = s.key === best;
                return (
                  <Card key={s.key} glow={isBest ? s.color : null}>
                    {isBest && (
                      <div style={{
                        position: "absolute", top: 14, right: 14,
                        background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`,
                        color: "#fff", padding: "4px 12px", borderRadius: 20,
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5,
                      }}>Recommended</div>
                    )}
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: T.display, color: s.color, marginBottom: 6 }}>{s.name}</div>
                    <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, marginBottom: 20, minHeight: 54 }}>{s.desc}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ background: T.bg, borderRadius: T.radiusXs, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10, color: T.textMut, textTransform: "uppercase", letterSpacing: 1 }}>Debt-Free In</div>
                        <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 800, marginTop: 2 }}>
                          {months2str(data.months)}
                        </div>
                      </div>
                      <div style={{ background: T.bg, borderRadius: T.radiusXs, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10, color: T.textMut, textTransform: "uppercase", letterSpacing: 1 }}>Total Interest</div>
                        <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.warn, marginTop: 2 }}>{fmtFull(data.totalInterest)}</div>
                      </div>
                      <div style={{ background: `${s.color}10`, borderRadius: T.radiusXs, padding: "12px 14px", border: `1px solid ${s.color}20` }}>
                        <div style={{ fontSize: 10, color: s.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Savings vs No Extra</div>
                        <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 800, color: T.safe, marginTop: 2 }}>
                          {fmt(strategies.baseline.totalInterest - data.totalInterest)}
                        </div>
                        <div style={{ fontSize: 11, color: T.textMut }}>{strategies.baseline.months - data.months} months earlier</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Timeline chart */}
            <Card>
              <Label>Balance Paydown Timeline</Label>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    {[["gA", T.danger], ["gS", T.blue], ["gH", T.purple]].map(([id, c]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize: 11, fill: T.textMut }} tickFormatter={fmt} />
                  <Tooltip
                    contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, fontFamily: T.mono }}
                    formatter={(v) => fmtFull(v)} labelFormatter={l => `Month ${l}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Area type="monotone" dataKey="Avalanche" stroke={T.danger} fill="url(#gA)" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="Snowball" stroke={T.blue} fill="url(#gS)" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="Hybrid" stroke={T.purple} fill="url(#gH)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Interest comparison bar */}
            <Card>
              <Label>Total Interest Comparison</Label>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: "No Extra", interest: strategies.baseline.totalInterest },
                  { name: "Avalanche", interest: strategies.avalanche.totalInterest },
                  { name: "Snowball", interest: strategies.snowball.totalInterest },
                  { name: "Hybrid", interest: strategies.hybrid.totalInterest },
                ]} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11, fill: T.textMut }} stroke={T.textMut} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: T.text, fontWeight: 600 }} stroke={T.textMut} width={80} />
                  <Tooltip contentStyle={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12, fontFamily: T.mono }} formatter={v => fmtFull(v)} />
                  <Bar dataKey="interest" radius={[0, 6, 6, 0]}>
                    {[T.textMut, T.danger, T.blue, T.purple].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ════════ AI INSIGHTS TAB ════════ */}
        {tab === "insights" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${T.accent}20, ${T.purple}20)`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>✦</div>
              <div>
                <h2 style={{ fontFamily: T.display, fontSize: 20, fontWeight: 800, margin: 0 }}>AI Financial Insights</h2>
                <p style={{ fontSize: 13, color: T.textMut, margin: 0 }}>Personalized analysis based on your debt profile</p>
              </div>
            </div>

            {insights.map((ins, i) => <InsightCard key={i} insight={ins} index={i} />)}

            <Card style={{ marginTop: 8, background: `linear-gradient(135deg, ${T.bgCard}, ${T.bg})` }}>
              <Label>How AI Analysis Works</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[
                  { icon: "📊", title: "Stress Scoring", desc: "Composite score from 5 financial health factors weighted by severity" },
                  { icon: "🧮", title: "Strategy Simulation", desc: "Month-by-month amortization across 3 payoff strategies with extra payments" },
                  { icon: "🎯", title: "Smart Recommendations", desc: "Context-aware advice based on your income, debt mix, and risk profile" },
                ].map(f => (
                  <div key={f.title} style={{ textAlign: "center", padding: "16px 12px" }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ════════ ACTION PLAN TAB ════════ */}
        {tab === "plan" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Summary banner */}
            <div style={{
              background: `linear-gradient(135deg, ${T.accentDim}, transparent)`,
              borderRadius: T.radius, padding: "24px 28px", border: `1px solid ${T.accent}25`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: T.display, color: T.accent, marginBottom: 8 }}>
                Your Debt-Freedom Roadmap
              </div>
              <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.7, margin: 0 }}>
                Using the <span style={{ color: T.accent, fontWeight: 700 }}>{best.charAt(0).toUpperCase() + best.slice(1)}</span> strategy with
                <span style={{ color: T.text, fontWeight: 700 }}> {fmtFull(extra)}/mo</span> extra, you'll be debt-free in
                <span style={{ color: T.safe, fontWeight: 700 }}> {months2str(strategies[best].months)}</span>, saving
                <span style={{ color: T.safe, fontWeight: 700 }}> {fmtFull(saved)}</span> in interest versus minimum payments.
              </p>
            </div>

            {/* Monthly cashflow */}
            <Card>
              <Label>Monthly Cashflow Breakdown</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                {[
                  { l: "Regular EMIs", v: stress.factors.totalEMI, c: T.text, bg: T.bg },
                  { l: "Extra Payment", v: extra, c: T.accent, bg: T.accentDim },
                  { l: "Total Debt Outflow", v: stress.factors.totalEMI + extra, c: T.warn, bg: T.warnDim },
                  { l: "Remaining Income", v: income - stress.factors.totalEMI - extra, c: income - stress.factors.totalEMI - extra > 0 ? T.safe : T.danger, bg: income - stress.factors.totalEMI - extra > 0 ? T.safeDim : T.dangerDim },
                ].map(m => (
                  <div key={m.l} style={{ background: m.bg, borderRadius: T.radiusSm, padding: "16px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: T.textMut, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{m.l}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 800, color: m.c }}>{fmt(m.v)}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Priority order */}
            <Card>
              <Label>Repayment Priority Order</Label>
              {(() => {
                let sorted;
                if (best === "avalanche") sorted = [...debts].sort((a, b) => b.rate - a.rate);
                else if (best === "snowball") sorted = [...debts].sort((a, b) => a.balance - b.balance);
                else sorted = [...debts].sort((a, b) => (b.rate * b.balance) - (a.rate * a.balance));
                return sorted.map((d, i) => (
                  <div key={d.id} style={{
                    display: "flex", alignItems: "center", gap: 16, padding: "18px 0",
                    borderBottom: i < sorted.length - 1 ? `1px solid ${T.border}` : "none",
                    animation: `fadeSlideIn 0.4s ease ${i * 0.08}s both`,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: T.radiusSm,
                      background: `${debtColors[i % debtColors.length]}18`,
                      color: debtColors[i % debtColors.length],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 18, fontFamily: T.mono, flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{d.name || "Unnamed Debt"}</div>
                      <div style={{ fontSize: 12, color: T.textSec }}>
                        {fmtFull(d.balance)} outstanding · {d.rate}% p.a. · {fmtFull(d.emi)} EMI
                      </div>
                    </div>
                    <div style={{
                      background: i === 0 ? `${T.accent}15` : T.bg,
                      border: `1px solid ${i === 0 ? T.accent + "30" : T.border}`,
                      padding: "8px 16px", borderRadius: T.radiusXs,
                      fontSize: 12, fontWeight: 700,
                      color: i === 0 ? T.accent : T.textSec,
                      fontFamily: T.mono, textAlign: "center",
                    }}>
                      {i === 0 ? `EMI + ${fmt(extra)}` : "Standard EMI"}
                    </div>
                  </div>
                ));
              })()}
            </Card>

            {/* Milestones */}
            <Card>
              <Label>Key Milestones</Label>
              <div style={{ position: "relative", paddingLeft: 24 }}>
                <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 2, background: `linear-gradient(to bottom, ${T.accent}, ${T.safe})` }} />
                {strategies[best].milestones.map((m, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
                    animation: `fadeSlideIn 0.4s ease ${i * 0.1}s both`,
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      background: m.pct === 100 ? T.safe : T.accent,
                      border: `3px solid ${T.bg}`, marginLeft: -31, flexShrink: 0,
                      boxShadow: `0 0 10px ${m.pct === 100 ? T.safe : T.accent}44`,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: m.pct === 100 ? T.safe : T.text }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: T.textMut }}>Month {m.month} · {months2str(m.month)}</div>
                    </div>
                    <div style={{
                      fontFamily: T.mono, fontSize: 13, fontWeight: 700,
                      color: m.pct === 100 ? T.safe : T.accent,
                      background: m.pct === 100 ? T.safeDim : T.accentDim,
                      padding: "4px 12px", borderRadius: 20,
                    }}>{m.pct}%</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Disclaimer */}
            <div style={{ fontSize: 11, color: T.textMut, lineHeight: 1.6, padding: "0 4px" }}>
              <strong>Disclaimer:</strong> This tool provides general financial analysis for educational purposes only. It does not constitute professional financial advice. Actual loan calculations may vary based on bank-specific terms, prepayment penalties, floating rate changes, and processing fees. Consult a certified financial planner (CFP) for personalized advice.
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "20px 28px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: T.textMut }}>
          DebtFree v2.0 · Built with ☕ in India · Open Source on GitHub
        </div>
      </footer>
    </div>
  );
}
