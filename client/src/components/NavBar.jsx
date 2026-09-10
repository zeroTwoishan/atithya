// NavBar — glassmorphic bottom tab bar with animated active indicator
import { NavLink } from "react-router-dom";
import { Compass, MapTrifold, Sparkle } from "@phosphor-icons/react";
import { motion } from "motion/react";

const TABS = [
  {
    to: "/tourist/chat",
    icon: Sparkle,
    label: "Plan",
    id: "tab-plan",
  },
  {
    to: "/tourist/itinerary",
    icon: MapTrifold,
    label: "Itinerary",
    id: "tab-itinerary",
  },
  {
    to: "/tourist/discover",
    icon: Compass,
    label: "Discover",
    id: "tab-discover",
  },
];

export function NavBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-50 safe-bottom"
      role="navigation"
      aria-label="Main navigation"
    >
      <div
        className="mx-3 mb-3 rounded-[20px] glass border border-white/20 px-2 py-2"
        style={{ boxShadow: "0 -4px 30px rgba(19,25,112,0.30), 0 8px 32px rgba(19,25,112,0.25)" }}
      >
        <div className="flex items-center justify-around">
          {TABS.map(({ to, icon: Icon, label, id }) => (
            <NavLink
              key={to}
              to={to}
              id={id}
              className="flex-1"
              aria-label={label}
            >
              {({ isActive }) => (
                <motion.button
                  className="w-full flex flex-col items-center gap-0.5 py-2 px-3 rounded-[14px] relative btn-base"
                  animate={{
                    background: isActive
                      ? "rgba(232,100,58,0.15)"
                      : "transparent",
                  }}
                  transition={{ duration: 0.22 }}
                >
                  {/* Active dot */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-dot"
                      className="absolute top-1 w-1 h-1 rounded-full"
                      style={{ background: "#FFE28D" }}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}

                  <motion.div
                    animate={{ scale: isActive ? 1.12 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Icon
                      size={22}
                      weight={isActive ? "duotone" : "regular"}
                      style={{ color: isActive ? "#e8643a" : "rgba(255,255,255,0.45)" }}
                    />
                  </motion.div>

                  <span
                    className="font-accent font-semibold text-[10px] tracking-wide"
                    style={{ color: isActive ? "#e8643a" : "rgba(255,255,255,0.40)" }}
                  >
                    {label}
                  </span>
                </motion.button>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
