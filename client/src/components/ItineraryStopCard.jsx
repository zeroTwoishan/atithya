// ItineraryStopCard — single day stop with timeline dot connector
import { motion } from "motion/react";
import { MapPin, Footprints, Bus, Coffee } from "@phosphor-icons/react";
import { clsx } from "clsx";

const TYPE_ICON = {
  travel: <Bus size={13} weight="duotone" />,
  activity: <Footprints size={13} weight="duotone" />,
  stay: <MapPin size={13} weight="duotone" />,
  meal: <Coffee size={13} weight="duotone" />,
};

const DOT_COLOR = {
  active: "#FFE28D",
  done: "#34c77b",
  upcoming: "rgba(255,255,255,0.35)",
};

export function ItineraryStopCard({
  day,
  title,
  location,
  description,
  cost,
  type = "activity",
  status = "upcoming", // 'done' | 'active' | 'upcoming'
  isLast = false,
  index = 0,
}) {
  return (
    <motion.div
      className="relative flex gap-3.5"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        {/* Dot */}
        <div
          className="w-3 h-3 rounded-full shrink-0 mt-1 z-10 ring-2 ring-white/10"
          style={{ background: DOT_COLOR[status] }}
        />
        {/* Connector line */}
        {!isLast && (
          <div className="flex-1 w-[1.5px] mt-1.5 mb-0"
            style={{ background: "linear-gradient(to bottom, rgba(255,226,141,0.4), rgba(255,255,255,0.1))" }}
          />
        )}
      </div>

      {/* Card body */}
      <div className={clsx("flex-1 pb-4", isLast && "pb-0")}>
        {day && (
          <p className="font-accent font-bold text-[10px] uppercase tracking-widest mb-1"
            style={{ color: "#FAC1A8" }}>
            Day {day}
          </p>
        )}
        <div className="glass-sm rounded-xl p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-white/60">{TYPE_ICON[type]}</span>
                <h4 className="font-accent font-semibold text-[13px] text-white leading-snug">
                  {title}
                </h4>
              </div>
              {location && (
                <p className="font-sans-bhraman text-[11px] text-white/55 flex items-center gap-1">
                  <MapPin size={10} />
                  {location}
                </p>
              )}
              {description && (
                <p className="font-sans-bhraman text-[12px] text-white/70 leading-relaxed mt-1.5">
                  {description}
                </p>
              )}
            </div>
            {cost && (
              <span className="font-mono-bhraman text-[12px] font-semibold shrink-0"
                style={{ color: "#FFE28D" }}>
                ₹{cost.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
