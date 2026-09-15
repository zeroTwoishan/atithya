/** The public home page.
 *
 *  Same shape as the reference's opening screen: a fanned stack of cards
 *  floating over the aurora, a two-line serif headline, one filled action and
 *  one outlined one, then the fine print. Everything below the fold is the
 *  product argument — what the three agents do, who the three dashboards are
 *  for, and what the platform has actually moved.
 */

import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  ChartLineUp,
  ChatCircleDots,
  Compass,
  House,
  MagnifyingGlass,
  ShieldCheck,
  Sliders,
} from "@phosphor-icons/react";

import { cn } from "../lib/utils";
import { rupees, compactRupees } from "../lib/format";
import { REGIONS, KNOWN_SITES } from "../data/catalog";
import { useTheme } from "../lib/useTheme";
import { Card, Chip } from "../components/ui";

/* ── The fanned cards over the headline ────────────────────────────────── */

const FAN = [
  {
    id: "left",
    caption: "Munsiyari",
    amount: 1600,
    className: "left-0 -rotate-[8deg]",
  },
  {
    id: "right",
    caption: "Spiti",
    amount: 2200,
    className: "right-0 rotate-[8deg]",
  },
];

/** Three cards fanned, the middle one lifted forward — the reference's
 *  opening image. The rear two are deliberately narrow and clipped by the
 *  container, so the fan reads as depth rather than as three loose cards. */
function FanStack() {
  return (
    <div className="relative mx-auto mb-11 h-[170px] w-full max-w-[400px] overflow-hidden">
      {FAN.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 0.55, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={cn("absolute top-12 w-[52%]", card.className)}
        >
          <div className="card px-3.5 py-3">
            <p className="caption truncate">{card.caption}</p>
            <p className="figure mt-0.5 text-[17px] text-ink">{rupees(card.amount)}</p>
            <div className="mt-2 h-[3px] w-full rounded-full bg-hairline">
              <span className="block h-full w-1/2 rounded-full bg-positive" />
            </div>
          </div>
        </motion.div>
      ))}

      {/* The front card: a trip that stopped at the traveller's ceiling and is
          waiting on them — the whole proposition in one object. */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="float-slow absolute left-1/2 top-7 w-[74%] -translate-x-1/2"
      >
        <div className="card px-4 py-3.5 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <p className="caption truncate">Tirthan · Ghost Pine</p>
            <Chip className="shrink-0 border-caution/35 px-2 py-0.5 text-[10px] text-caution">needs you</Chip>
          </div>
          <p className="figure mt-1 text-[25px] leading-none text-ink">{rupees(12400)}</p>
          <div className="relative mt-3 h-[3px] w-full rounded-full bg-hairline">
            <span
              className="block h-full rounded-full"
              style={{
                width: "74%",
                background: "linear-gradient(90deg, var(--color-positive), var(--color-caution), var(--color-negative))",
              }}
            />
            <span className="absolute right-0 top-1/2 h-2.5 w-px -translate-y-1/2 bg-ink-faint" />
          </div>
          <p className="caption mt-2">Past your line, so it stopped here</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Below the fold ────────────────────────────────────────────────────── */

const AGENTS = [
  {
    icon: ChatCircleDots,
    title: "Onboards over WhatsApp",
    body: "A host sends one message in Hindi, Garhwali or Bhoti. The agent interviews them, writes the listing and publishes it. No app, no English, no field visit.",
  },
  {
    icon: MagnifyingGlass,
    title: "Plans and books the trip",
    body: "Say the budget, the days and what you're after. It searches verified stays, scores them on fit and crowding, and holds the rooms.",
  },
  {
    icon: ShieldCheck,
    title: "Screens before it publishes",
    body: "Every listing is checked for price, capacity and photo mismatches before a traveller ever sees it — and the host is told exactly what to fix.",
  },
  {
    icon: Sliders,
    title: "Stops at your ceiling",
    body: "You set what it may spend without asking. Above that line it stops dead and waits, however good the deal looks to it.",
  },
];

const DASHBOARDS = [
  { icon: Compass, role: "tourist", title: "Travellers", body: "Plan, book and re-plan a trip that stays inside a number you set.", to: "/start?role=tourist" },
  { icon: House, role: "host", title: "Hosts", body: "Everything the onboarding agent captured, plus bookings, payouts and pricing.", to: "/start?role=host" },
  { icon: ChartLineUp, role: "gov", title: "Tourism boards", body: "Where rural tourism spend actually lands, and which schemes converted.", to: "/start?role=gov" },
];

/* Computed from the same rows the board dashboard reads, so the landing page
   can never quote a figure the product then contradicts. */
const quietest = [...KNOWN_SITES].sort((a, b) => a.load - b.load)[0];

const NUMBERS = [
  { value: String(REGIONS.reduce((total, region) => total + region.homestays, 0)), label: "verified rural hosts" },
  { value: compactRupees(REGIONS.reduce((total, region) => total + region.income, 0)), label: "reaching villages" },
  { value: `${quietest.load}%`, label: `load at ${quietest.name.split(" ")[0]}, the gap` },
];

/* ── Page ──────────────────────────────────────────────────────────────── */

export function Landing() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  return (
    <div className="aurora min-h-dvh">
      <div className="relative z-10 mx-auto w-full max-w-[1120px] px-5 pb-20 sm:px-8">
        {/* Masthead */}
        <header className="safe-top flex items-center justify-between py-5">
          <span className="wordmark text-[11.5px] text-ink">◇ Atithya</span>
          <button
            onClick={toggle}
            aria-label={dark ? "Light appearance" : "Dark appearance"}
            className="pill flex size-9 items-center justify-center text-[13px] text-ink-soft"
          >
            {dark ? "☀" : "☾"}
          </button>
        </header>

        {/* ── Hero ── */}
        <section className="mx-auto flex max-w-[560px] flex-col pt-6 sm:pt-10">
          <FanStack />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-balance font-display text-[40px] leading-[1.06] text-ink sm:text-[54px]">
              It plans the trip.
              <br />
              You draw the line.
            </h1>
            <p className="mt-4 max-w-[430px] text-[13.5px] leading-relaxed text-ink-soft">
              Atithya searches India&apos;s unlisted village homestays, compares them and books for you — then
              stops dead at the number you set.
            </p>

            <div className="mt-8 flex flex-col gap-2.5">
              <button onClick={() => navigate("/start?role=tourist")} className="pill-primary flex items-center justify-center gap-2 py-3.5 text-[13.5px] font-medium">
                <Compass size={16} weight="duotone" />
                Continue as a traveller
              </button>
              <button onClick={() => navigate("/start?role=host")} className="pill flex items-center justify-center gap-2 py-3.5 text-[13.5px] text-ink">
                <House size={16} weight="duotone" />
                Continue as a host
              </button>
            </div>

            <button
              onClick={() => navigate("/start?role=gov")}
              className="mx-auto mt-5 block text-[12px] text-ink-soft underline-offset-4 hover:underline"
            >
              Open the tourism board view instead
            </button>

            <p className="mt-7 text-center text-[10.5px] leading-relaxed text-ink-faint">
              Prototype build. No account is created — everything stays on this device,
              <br className="hidden sm:block" /> and every price, payment and booking is simulated.
            </p>
          </motion.div>
        </section>

        {/* ── What it does ── */}
        <section className="mt-28">
          <div className="mb-6 flex items-center gap-3">
            <span className="eyebrow shrink-0">Four agents, one platform</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {AGENTS.map((agent) => (
              <Card key={agent.title} className="flex flex-col gap-2.5">
                <agent.icon size={20} weight="duotone" className="text-ink-soft" />
                <h3 className="font-display text-[20px] leading-snug text-ink">{agent.title}</h3>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">{agent.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── The numbers ── */}
        <section className="mt-16">
          <Card className="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {NUMBERS.map((entry) => (
              <div key={entry.label} className="px-2 py-5 text-center sm:py-2">
                <p className="figure text-[30px] leading-none text-ink">{entry.value}</p>
                <p className="caption mt-2">{entry.label}</p>
              </div>
            ))}
          </Card>
          <p className="mt-3 text-center text-[10.5px] text-ink-faint">
            Seeded demo figures, drawn from Himachal and Uttarakhand district data.
          </p>
        </section>

        {/* ── The three dashboards ── */}
        <section className="mt-20">
          <div className="mb-6 flex items-center gap-3">
            <span className="eyebrow shrink-0">Three views of the same database</span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {DASHBOARDS.map((entry) => (
              <button key={entry.role} onClick={() => navigate(entry.to)} className="card flex flex-col gap-2.5 p-5 text-left transition-colors hover:bg-surface-strong">
                <entry.icon size={20} weight="duotone" className="text-ink-soft" />
                <h3 className="font-display text-[20px] leading-snug text-ink">{entry.title}</h3>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">{entry.body}</p>
                <span className="mt-1 flex items-center gap-1.5 text-[12px] text-ink">
                  Open <ArrowRight size={13} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── The explainer row ── */}
        <section className="mt-16">
          <button
            onClick={() => navigate("/about")}
            className="card flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-surface-strong"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[19px] text-ink">How Atithya decides, and where it stops</span>
              <span className="caption mt-1 block">The rules that run before every booking</span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-ink-faint" />
          </button>
        </section>

        <footer className="mt-20 flex flex-col items-center gap-2">
          <span className="wordmark text-[10.5px] text-ink-soft">◇ Atithya</span>
          <p className="text-center text-[10.5px] text-ink-faint">
            The first layer between a village and the people looking for it.
          </p>
        </footer>
      </div>
    </div>
  );
}
