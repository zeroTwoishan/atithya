/** The small shared pieces every screen is built from. One file: they are a
 *  few lines each and always used together. */
import { CheckCircle, WarningCircle, Clock, Prohibit, SpinnerGap } from "@phosphor-icons/react";

import { cn } from "../lib/utils";

export const Card = ({ className, children, ...props }) => (
  <div className={cn("card p-5", className)} {...props}>
    {children}
  </div>
);

/** An eyebrow label with a hairline running out to the right. */
export const SectionLabel = ({ children, className }) => (
  <div className={cn("rule-row mb-3", className)}>
    <span className="eyebrow">{children}</span>
  </div>
);

/** A figure with its caption — the reference's stat tile. */
export const Stat = ({ label, value, caption, tone }) => (
  <div className="min-w-0">
    <p className="eyebrow mb-1.5">{label}</p>
    <p className={cn("figure text-[26px] leading-none", tone ?? "text-ink")}>{value}</p>
    {caption && <p className="mt-1.5 text-[11.5px] leading-snug text-ink-faint">{caption}</p>}
  </div>
);

const STATUS = {
  live: { label: "Live", icon: CheckCircle, tone: "text-positive" },
  needs_review: { label: "Needs review", icon: WarningCircle, tone: "text-caution" },
  pending_verification: { label: "Pending", icon: Clock, tone: "text-ink-faint" },
  inactive: { label: "Inactive", icon: Prohibit, tone: "text-ink-faint" },
  confirmed: { label: "Confirmed", icon: CheckCircle, tone: "text-positive" },
  planning: { label: "Planning", icon: Clock, tone: "text-ink-faint" },
  completed: { label: "Completed", icon: CheckCircle, tone: "text-ink-soft" },
  cancelled: { label: "Cancelled", icon: Prohibit, tone: "text-negative" },
  info: { label: "Info", icon: CheckCircle, tone: "text-positive" },
  caution: { label: "Caution", icon: WarningCircle, tone: "text-caution" },
  warning: { label: "Warning", icon: WarningCircle, tone: "text-negative" },
};

/** Status is never colour alone — every badge carries an icon and a word
 *  (docs/UI_UX_DESIGN.md; WCAG 1.4.1). */
export function StatusBadge({ status, className }) {
  const meta = STATUS[status] ?? { label: status, icon: Clock, tone: "text-ink-faint" };
  return (
    <span className={cn("pill inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium", meta.tone, className)}>
      <meta.icon size={12} weight="fill" />
      {meta.label}
    </span>
  );
}

export const Chip = ({ children, className }) => (
  <span className={cn("pill inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-ink-soft", className)}>
    {children}
  </span>
);

export const Spinner = ({ size = 18, className }) => (
  <SpinnerGap size={size} className={cn("animate-spin text-ink-faint", className)} />
);

/** One empty/loading/error treatment, so no screen invents its own. */
export function Placeholder({ loading, error, empty, children }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-14 text-[13px] text-ink-faint">
        <Spinner /> Loading…
      </div>
    );
  }
  if (error) {
    return (
      <Card className="text-center">
        <p className="font-display text-[19px] text-ink">That didn&apos;t load</p>
        <p className="mt-1.5 text-[12.5px] text-ink-soft">{error}</p>
      </Card>
    );
  }
  if (empty) {
    return (
      <Card className="text-center">
        <p className="text-[13px] text-ink-soft">{empty}</p>
      </Card>
    );
  }
  return children;
}
