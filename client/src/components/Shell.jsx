/** The app frame.
 *
 *  Navigation changes shape with the viewport: a floating dock of four
 *  circles on phones (thumb reach, and it is what the reference does), a
 *  labelled rail beside the content from `lg` up (a 1400px screen should not
 *  be navigated with four unlabelled circles). One definition, two
 *  renderings, so a route can never exist in one and be missing from the
 *  other.
 */

import { NavLink, useLocation } from "react-router-dom";
import { Moon, Sun } from "@phosphor-icons/react";

import { cn } from "../lib/utils";
import { NAV, WORDMARK } from "../lib/nav";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/useTheme";

/** The masthead: diamond wordmark left, one round action right. Present on
 *  every dock destination, absent on sub-pages (they carry SubHeader). */
export function Masthead({ action }) {
  const role = useStore((state) => state.session?.role ?? "tourist");
  const { dark, toggle } = useTheme();

  return (
    <header className="safe-top flex items-center justify-between px-5 pb-1 pt-5 lg:hidden">
      <span className="wordmark text-[11px] text-ink">◇ {WORDMARK[role]}</span>
      {action ?? (
        <button
          onClick={toggle}
          aria-label={dark ? "Light appearance" : "Dark appearance"}
          className="pill flex size-9 items-center justify-center text-ink-soft"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      )}
    </header>
  );
}

export function Shell({ children, dock = true, masthead = true, mastheadAction, wide = false }) {
  const location = useLocation();
  const role = useStore((state) => state.session?.role ?? "tourist");
  const { dark, toggle } = useTheme();
  const tabs = NAV[role] ?? NAV.tourist;

  return (
    <div className="aurora min-h-dvh">
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col lg:flex-row">
        {/* Desktop rail */}
        <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1 lg:border-r lg:border-hairline lg:px-5 lg:py-7">
          <div className="wordmark mb-8 px-3 text-[12px] text-ink">◇ {WORDMARK[role]}</div>
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-full px-4 py-2.5 text-[13.5px] transition-colors",
                  isActive ? "bg-surface-strong font-medium text-ink" : "text-ink-soft hover:text-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <tab.icon size={18} weight={isActive ? "fill" : "duotone"} />
                  {tab.label}
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={toggle}
            className="mt-auto flex items-center gap-3 rounded-full px-4 py-2.5 text-[13.5px] text-ink-soft hover:text-ink"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? "Light appearance" : "Dark appearance"}
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {masthead && <Masthead action={mastheadAction} />}
          {/* pb-32 clears the floating dock; the rail needs no such gap */}
          <main className={cn("flex-1 px-5 lg:px-9 lg:py-8", dock ? "pb-32 lg:pb-10" : "pb-10", wide ? "" : "")}>
            {children}
          </main>
        </div>
      </div>

      {dock && <Dock tabs={tabs} key={location.pathname.split("/")[1]} />}
    </div>
  );
}

/** Four circles, centred, floating over the content. The active one inverts
 *  to solid ink; the rest stay frosted. */
function Dock({ tabs }) {
  return (
    <nav
      className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-4 lg:hidden"
      aria-label="Main navigation"
    >
      <div className="pointer-events-auto flex items-center gap-2.5">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} aria-label={tab.label}>
            {({ isActive }) => (
              <span
                className={cn(
                  "flex size-[52px] items-center justify-center rounded-full border transition-all duration-200",
                  isActive
                    ? "scale-105 border-transparent bg-ink text-canvas shadow-lg"
                    : "border-hairline bg-surface-strong text-ink-soft backdrop-blur-xl",
                )}
              >
                <tab.icon size={20} weight={isActive ? "fill" : "regular"} />
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
