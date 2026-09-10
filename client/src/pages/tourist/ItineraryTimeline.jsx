// ItineraryTimeline — editable day-by-day trip view with budget tracker
import { motion } from "motion/react";
import { useState } from "react";
import {
  ArrowLeft, ShieldCheck, CurrencyInr, ArrowClockwise,
  CheckCircle, Warning, MapPin, CalendarBlank,
} from "@phosphor-icons/react";
import { ItineraryStopCard } from "../../components/ItineraryStopCard";

// ── Trip data (Tirthan Valley) ────────────────────────────────
const TRIP = {
  title: "4-Day Tirthan & Parvati Journey",
  destination: "Himachal Pradesh",
  dates: "Sep 14 – Sep 17, 2026",
  totalBudget: 15000,
  spent: 7800,
};

const STOPS = [
  {
    day: 1,
    title: "Overnight Volvo from Kashmere Gate",
    location: "Delhi → Aut Tunnel",
    description: "Depart 9 PM, arrive Aut 6 AM. Scenic riverside cab to Gushaini.",
    cost: 1200,
    type: "travel",
    status: "done",
  },
  {
    day: 2,
    title: "Chhoie Waterfall Trek",
    location: "Gushaini, Tirthan Valley",
    description: "Gentle 6 km pine trail to Chhoie sacred waterfall. Evening riverside chai.",
    cost: 300,
    type: "activity",
    status: "done",
  },
  {
    day: 2,
    title: "Stay — Meera Devi's Himalayan Homestay",
    location: "Near Chehni Kothi, Tirthan",
    description: "Kathkuni cedar wood rooms. Bukhari heating + Kangri Dham dinner included.",
    cost: 1850,
    type: "stay",
    status: "active",
  },
  {
    day: 3,
    title: "Jalori Pass Drive",
    location: "Banjar → Jalori → Kasol",
    description: "Morning drive over the 3,120m pass. Old Chalal village walk, herbal siddu tasting.",
    cost: 800,
    type: "travel",
    status: "upcoming",
  },
  {
    day: 3,
    title: "Parvati Valley Excursion",
    location: "Kasol, Parvati Valley",
    description: "Local artisan shawl market + café lunch. Return by 6 PM.",
    cost: 650,
    type: "activity",
    status: "upcoming",
  },
  {
    day: 4,
    title: "Apple Orchard Morning & Departure",
    location: "Gushaini → Aut",
    description: "Orchard stroll with Meera Devi. Evening cab to Aut, Volvo to Delhi 8 PM.",
    cost: 1200,
    type: "travel",
    status: "upcoming",
    isLast: true,
  },
];

// ── Budget Arc ────────────────────────────────────────────────
function BudgetArc({ spent, total }) {
  const pct = Math.min(spent / total, 1);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
          <motion.circle
            cx="44" cy="44" r={r} fill="none"
            stroke="url(#budgetGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
          <defs>
            <linearGradient id="budgetGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFE28D" />
              <stop offset="100%" stopColor="#BF4E30" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-bhraman text-[13px] font-bold text-white leading-none">
            {Math.round(pct * 100)}%
          </span>
          <span className="font-sans-bhraman text-[9px] text-white/50 mt-0.5">used</span>
        </div>
      </div>
      <div className="text-center mt-1">
        <p className="font-mono-bhraman text-[11px] text-white/60">
          ₹{spent.toLocaleString("en-IN")} of ₹{total.toLocaleString("en-IN")}
        </p>
        <p className="font-sans-bhraman text-[10px]" style={{ color: "#86efac" }}>
          ₹{(total - spent).toLocaleString("en-IN")} remaining
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export function ItineraryTimeline() {
  const [safetyDismissed, setSafetyDismissed] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="glass border-b border-white/10 px-4 pt-4 pb-3 z-30 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-itinerary"
              className="w-9 h-9 rounded-full glass-sm btn-icon flex items-center justify-center text-white"
              aria-label="Go back"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <h1 className="font-display text-[18px] font-semibold text-white leading-tight">
                {TRIP.title}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin size={10} style={{ color: "#FAC1A8" }} />
                <span className="font-accent text-[11px] font-medium" style={{ color: "#FAC1A8" }}>
                  {TRIP.destination}
                </span>
                <span className="text-white/30">•</span>
                <CalendarBlank size={10} className="text-white/50" />
                <span className="font-sans-bhraman text-[11px] text-white/50">{TRIP.dates}</span>
              </div>
            </div>
          </div>
          <button
            id="btn-replan"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-accent text-[11.5px] font-semibold text-white btn-primary"
            style={{ background: "#e8643a" }}
            aria-label="Re-plan trip"
          >
            <ArrowClockwise size={13} weight="bold" />
            Re-plan
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-36 space-y-4">

        {/* Safety Pulse Banner */}
        {!safetyDismissed && (
          <motion.div
            id="safety-pulse-banner"
            className="glass-green rounded-[14px] px-4 py-3 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35 }}
          >
            <div className="relative shrink-0">
              <ShieldCheck size={22} weight="fill" style={{ color: "#86efac" }} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping-slow" />
            </div>
            <div className="flex-1">
              <p className="font-accent font-bold text-[12px] text-white">Safety Pulse — All Clear</p>
              <p className="font-sans-bhraman text-[11px] text-white/65">
                Tirthan Valley route is safe. Weather: partly cloudy, 18°C.
              </p>
            </div>
            <button
              className="text-white/40 hover:text-white transition text-[18px] leading-none shrink-0"
              onClick={() => setSafetyDismissed(true)}
              aria-label="Dismiss safety banner"
            >
              ×
            </button>
          </motion.div>
        )}

        {/* Budget Card */}
        <motion.div
          className="glass rounded-[16px] p-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center justify-between gap-4">
            <BudgetArc spent={TRIP.spent} total={TRIP.totalBudget} />
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2">
                <CurrencyInr size={14} style={{ color: "#FFE28D" }} />
                <span className="font-accent font-semibold text-[12px] text-white">Budget Tracker</span>
              </div>
              {[
                { label: "Accommodation", amount: 5550, pct: 71 },
                { label: "Transport", amount: 2400, pct: 71 },
                { label: "Activities", amount: 950, pct: 71 },
              ].map(({ label, amount, pct }) => (
                <div key={label}>
                  <div className="flex justify-between mb-0.5">
                    <span className="font-sans-bhraman text-[10px] text-white/60">{label}</span>
                    <span className="font-mono-bhraman text-[10px] text-white/70">₹{amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #FFE28D, #FAC1A8)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Status legend */}
        <div className="flex items-center gap-4 px-1">
          {[
            { dot: "#34c77b", label: "Done", id: "legend-done" },
            { dot: "#FFE28D", label: "Active", id: "legend-active" },
            { dot: "rgba(255,255,255,0.35)", label: "Upcoming", id: "legend-upcoming" },
          ].map(({ dot, label, id }) => (
            <div key={id} id={id} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: dot }} />
              <span className="font-sans-bhraman text-[10.5px] text-white/50">{label}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {STOPS.map((stop, i) => (
            <ItineraryStopCard
              key={`${stop.day}-${stop.title}`}
              {...stop}
              isLast={i === STOPS.length - 1}
              index={i}
            />
          ))}
        </div>

        {/* Adaptive note */}
        <motion.div
          className="glass-sm rounded-[12px] px-4 py-3 flex items-start gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Warning size={16} weight="duotone" style={{ color: "#e8a33d" }} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-accent font-semibold text-[11.5px] text-white">Adaptive Re-planning Active</p>
            <p className="font-sans-bhraman text-[11px] text-white/60 leading-relaxed mt-0.5">
              Weather disruption detected near Jalori Pass for Sep 16. Tap Re-plan to get auto-optimized route.
            </p>
          </div>
        </motion.div>

      </main>
    </div>
  );
}
