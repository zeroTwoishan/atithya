// StatusBadge — color + text label badges (never color-only, per a11y rules)
import { ShieldCheck, Leaf, Warning, Star, SealCheck } from "@phosphor-icons/react";
import { clsx } from "clsx";

const CONFIG = {
  verified: {
    icon: <SealCheck size={12} weight="fill" />,
    label: "Verified",
    cls: "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30",
  },
  eco: {
    icon: <Leaf size={12} weight="fill" />,
    label: "Eco-Certified",
    cls: "bg-green-500/20 text-green-200 border border-green-400/30",
  },
  safety: {
    icon: <ShieldCheck size={12} weight="fill" />,
    label: "Safety Checked",
    cls: "bg-blue-400/20 text-blue-200 border border-blue-400/30",
  },
  caution: {
    icon: <Warning size={12} weight="fill" />,
    label: "Caution",
    cls: "bg-amber-400/20 text-amber-200 border border-amber-400/30",
  },
  rated: {
    icon: <Star size={12} weight="fill" />,
    label: "Top Rated",
    cls: "bg-yellow-400/20 text-yellow-100 border border-yellow-300/30",
  },
};

export function StatusBadge({ type = "verified", label, size = "sm", className = "" }) {
  const config = CONFIG[type] ?? CONFIG.verified;
  const displayLabel = label ?? config.label;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full font-accent font-semibold",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1",
        config.cls,
        className
      )}
    >
      {config.icon}
      {displayLabel}
    </span>
  );
}
