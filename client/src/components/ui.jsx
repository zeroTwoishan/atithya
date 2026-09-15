/** Every small piece the screens are built from.
 *
 *  One file on purpose: these are a few lines each, always imported together,
 *  and keeping them adjacent is what stops a second, slightly-different card
 *  from appearing three screens later.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  Circle,
  Clock,
  Prohibit,
  SpinnerGap,
  WarningCircle,
} from "@phosphor-icons/react";

import { cn } from "../lib/utils";

/* ── Surfaces ──────────────────────────────────────────────────────────── */

export const Card = ({ className, children, ...props }) => (
  <div className={cn("card p-5", className)} {...props}>
    {children}
  </div>
);

export const Inset = ({ className, children, ...props }) => (
  <div className={cn("card-inset p-4", className)} {...props}>
    {children}
  </div>
);

/** An eyebrow label with a hairline running out to the right. */
export const SectionLabel = ({ children, action, className }) => (
  <div className={cn("flex items-center gap-3 mb-3", className)}>
    <span className="eyebrow shrink-0">{children}</span>
    <span className="h-px flex-1 bg-hairline" />
    {action}
  </div>
);

/* ── Figures ───────────────────────────────────────────────────────────── */

/** The reference's stat tile: a serif figure with a quiet caption under it. */
export const Stat = ({ label, value, caption, tone, size = 26, className }) => (
  <div className={cn("min-w-0", className)}>
    {label && <p className="eyebrow mb-1.5">{label}</p>}
    <p className={cn("figure leading-none", tone ?? "text-ink")} style={{ fontSize: size }}>
      {value}
    </p>
    {caption && <p className="caption mt-1.5">{caption}</p>}
  </div>
);

/** Three figures in a row, hairline-divided — the strip under the headline
 *  figure on the reference's home screen. */
export const StatRow = ({ items, className }) => (
  <div className={cn("card-inset grid grid-cols-3 divide-x divide-hairline", className)}>
    {items.map((item) => (
      <div key={item.label} className="px-3 py-3.5 text-center">
        <p className="figure text-[22px] leading-none text-ink">{item.value}</p>
        <p className="caption mt-1.5 truncate">{item.label}</p>
      </div>
    ))}
  </div>
);

/** A spend/capacity bar. `tone` colours the filled half. */
export function Meter({ value, max, tone = "positive", className }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const fill = {
    positive: "bg-positive",
    caution: "bg-caution",
    negative: "bg-negative",
    ink: "bg-ink",
  }[tone];

  return (
    <div className={cn("relative h-[3px] w-full rounded-full bg-hairline", className)}>
      <motion.span
        className={cn("absolute inset-y-0 left-0 rounded-full", fill)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* The ceiling tick, always at the far end */}
      <span className="absolute right-0 top-1/2 h-2.5 w-px -translate-y-1/2 bg-ink-faint" />
    </div>
  );
}

/* ── Badges & chips ────────────────────────────────────────────────────── */

const STATUS = {
  live: { label: "Live", icon: CheckCircle, tone: "text-positive" },
  needs_review: { label: "Needs review", icon: WarningCircle, tone: "text-caution" },
  pending_verification: { label: "Pending", icon: Clock, tone: "text-ink-faint" },
  inactive: { label: "Inactive", icon: Prohibit, tone: "text-ink-faint" },
  draft: { label: "Draft", icon: Circle, tone: "text-ink-faint" },
  awaiting_approval: { label: "Needs you", icon: WarningCircle, tone: "text-caution" },
  booked: { label: "Booked", icon: CheckCircle, tone: "text-positive" },
  declined: { label: "Declined", icon: Prohibit, tone: "text-negative" },
  completed: { label: "Completed", icon: CheckCircle, tone: "text-ink-soft" },
  info: { label: "Good to know", icon: CheckCircle, tone: "text-positive" },
  caution: { label: "Caution", icon: WarningCircle, tone: "text-caution" },
  warning: { label: "Warning", icon: WarningCircle, tone: "text-negative" },
};

/** Status is never colour alone — every badge carries an icon and a word
 *  (WCAG 1.4.1), which also survives a projector that eats saturation. */
export function StatusBadge({ status, className }) {
  const meta = STATUS[status] ?? { label: status, icon: Clock, tone: "text-ink-faint" };
  return (
    <span className={cn("pill inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium", meta.tone, className)}>
      <meta.icon size={12} weight="fill" />
      {meta.label}
    </span>
  );
}

export const Chip = ({ children, className, ...props }) => (
  <span className={cn("pill inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-ink-soft", className)} {...props}>
    {children}
  </span>
);

/** A chip you can press — the suggestion row under the search field. */
export const ChipButton = ({ children, className, ...props }) => (
  <button
    type="button"
    className={cn("pill shrink-0 whitespace-nowrap px-3.5 py-2 text-[12px] text-ink-soft", className)}
    {...props}
  >
    {children}
  </button>
);

/* ── Controls ──────────────────────────────────────────────────────────── */

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-on={checked}
      onClick={() => onChange(!checked)}
      className="toggle"
    />
  );
}

/** A settings row: icon, title, subtitle, and whatever control sits on the
 *  right — a chevron, a toggle, a value. */
export function Row({ icon: Icon, title, subtitle, right, onClick, to, className }) {
  const navigate = useNavigate();
  const interactive = Boolean(onClick || to);
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={interactive ? (onClick ?? (() => navigate(to))) : undefined}
      className={cn(
        "card-inset flex w-full items-center gap-3.5 px-4 py-3.5 text-left",
        interactive && "transition-colors hover:bg-surface-strong",
        className,
      )}
    >
      {Icon && <Icon size={17} weight="duotone" className="shrink-0 text-ink-soft" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] text-ink">{title}</span>
        {subtitle && <span className="caption mt-0.5 block truncate">{subtitle}</span>}
      </span>
      {right ?? (interactive && to ? <CaretRight size={14} className="shrink-0 text-ink-faint" /> : null)}
    </Tag>
  );
}

/** Two or three mutually exclusive options in a pill track. */
export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cn("pill flex p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 rounded-full px-4 py-2 text-[12.5px] transition-colors",
              active ? "text-ink" : "text-ink-faint hover:text-ink-soft",
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${options.map((entry) => entry.value).join("-")}`}
                className="absolute inset-0 rounded-full bg-surface-strong"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Discrete money steps — the reference's ₹500 / ₹1,000 / ₹2,000 row. */
export function StepChips({ steps, value, onChange, format = (step) => step }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {steps.map((step) => (
        <button
          key={step}
          type="button"
          onClick={() => onChange(step)}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] transition-colors",
            step === value
              ? "border-transparent bg-surface-strong font-medium text-ink"
              : "border-hairline text-ink-faint hover:text-ink-soft",
          )}
        >
          {format(step)}
        </button>
      ))}
    </div>
  );
}

/** A labelled range with its value in serif above it. */
export function Slider({ label, value, min, max, step, onChange, format, note }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-ink">{label}</span>
        <span className="figure text-[17px] text-ink">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        className="range mt-1.5"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
      {note && <p className="caption">{note}</p>}
    </div>
  );
}

/* ── Feedback ──────────────────────────────────────────────────────────── */

export const Spinner = ({ size = 18, className }) => (
  <SpinnerGap size={size} className={cn("animate-spin text-ink-faint", className)} />
);

/** Centred icon, a line of serif, a line of sans, optional action — the
 *  reference's "No approvals waiting" screen. */
export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      {Icon && <Icon size={26} weight="thin" className="mb-5 text-ink-faint" />}
      <p className="font-display text-[21px] leading-snug text-ink">{title}</p>
      {body && <p className="mt-2 max-w-[300px] text-[12.5px] leading-relaxed text-ink-faint">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ── Bottom sheet ──────────────────────────────────────────────────────── */

/** Slides up from the bottom on every viewport — the reference never centres
 *  a dialog, and keeping one behaviour means one mental model. Escape and a
 *  backdrop press both dismiss. */
export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="safe-bottom relative max-h-[88dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[26px] border border-hairline bg-canvas px-5 pb-7 pt-3 sm:mb-6 sm:rounded-[26px]"
          >
            <span aria-hidden="true" className="mx-auto mb-5 block h-[3px] w-9 rounded-full bg-hairline" />
            {title && <h2 className="mb-5 font-display text-[24px] leading-tight text-ink">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ── Sub-page header ───────────────────────────────────────────────────── */

/** Back chevron, title, optional action — used by every screen that is not a
 *  dock destination. */
export function SubHeader({ title, subtitle, action, back }) {
  const navigate = useNavigate();
  return (
    <header className="safe-top flex items-center gap-3 px-5 pb-4 pt-5 lg:px-9 lg:pt-8">
      <button
        onClick={() => (back ? navigate(back) : navigate(-1))}
        aria-label="Back"
        className="pill flex size-9 shrink-0 items-center justify-center text-ink-soft"
      >
        <CaretLeft size={15} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-[21px] leading-tight text-ink">{title}</h1>
        {subtitle && <p className="caption truncate">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/* ── Motion ────────────────────────────────────────────────────────────── */

/** The one page transition, so routes never each invent their own. */
export const Page = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);
