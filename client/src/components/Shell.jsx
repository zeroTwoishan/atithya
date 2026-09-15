/** The app frame: aurora backdrop, wordmark header, and navigation that
 *  changes shape with the viewport — a floating circular dock on phones
 *  (thumb reach), a labelled rail beside the content from `lg` up (pointer
 *  reach, and the dock would waste a 1400px screen). One nav definition,
 *  two renderings, so a route can never exist in one and not the other. */
import { NavLink, useNavigate } from "react-router-dom";
import { Moon, Sun, SignOut } from "@phosphor-icons/react";

import { cn } from "../lib/utils";
import { getUser, signOut } from "../lib/api";
import { useTheme } from "../lib/useTheme";

export function Shell({ tabs, children, title }) {
  const navigate = useNavigate();
  const user = getUser();
  const { dark, toggle } = useTheme();

  function leave() {
    signOut();
    navigate("/signin", { replace: true });
  }

  return (
    <div className="aurora min-h-dvh">
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col lg:flex-row">
        {/* Desktop rail */}
        <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:gap-1 lg:border-r lg:border-hairline lg:px-5 lg:py-7">
          <div className="wordmark mb-8 text-[13px] text-ink">◇ Atithya</div>
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-full px-4 py-2.5 text-[13.5px] transition-colors",
                  isActive ? "bg-surface-strong font-medium text-ink" : "text-ink-soft hover:text-ink",
                )
              }
            >
              <tab.icon size={18} weight={"duotone"} />
              {tab.label}
            </NavLink>
          ))}
          <div className="mt-auto flex flex-col gap-1 pt-6">
            <button onClick={toggle} className="flex items-center gap-3 rounded-full px-4 py-2.5 text-[13.5px] text-ink-soft hover:text-ink">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
              {dark ? "Light appearance" : "Dark appearance"}
            </button>
            <button onClick={leave} className="flex items-center gap-3 rounded-full px-4 py-2.5 text-[13.5px] text-ink-soft hover:text-ink">
              <SignOut size={18} />
              Sign out
            </button>
            {user && <p className="px-4 pt-3 text-[11px] text-ink-faint">{user.name}</p>}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header — the rail carries this on desktop */}
          <header className="safe-top flex items-center justify-between px-5 pb-2 pt-5 lg:hidden">
            <span className="wordmark text-[11.5px] text-ink">◇ Atithya</span>
            <div className="flex items-center gap-2">
              <button onClick={toggle} aria-label={dark ? "Light appearance" : "Dark appearance"} className="pill flex size-9 items-center justify-center text-ink-soft">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={leave} aria-label="Sign out" className="pill flex size-9 items-center justify-center text-ink-soft">
                <SignOut size={16} />
              </button>
            </div>
          </header>

          {title && (
            <h1 className="px-5 pb-1 font-display text-[30px] leading-tight text-ink lg:px-9 lg:pt-8 lg:text-[38px]">
              {title}
            </h1>
          )}

          {/* pb-28 clears the floating dock; the rail needs no such gap */}
          <main className="flex-1 px-5 pb-28 lg:px-9 lg:pb-10">{children}</main>
        </div>
      </div>

      {/* Mobile dock */}
      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-50 flex justify-center pb-4 lg:hidden"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-2.5">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} aria-label={tab.label}>
              {({ isActive }) => (
                <span
                  className={cn(
                    "flex size-[52px] items-center justify-center rounded-full border transition-colors",
                    isActive
                      ? "border-transparent bg-ink text-canvas"
                      : "border-hairline bg-surface-strong text-ink-soft backdrop-blur-xl",
                  )}
                >
                  <tab.icon size={21} weight={isActive ? "fill" : "regular"} />
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
