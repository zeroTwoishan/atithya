/** "Who is Atithya planning for?" — the reference's name-entry screen.
 *
 *  There is no account and no password: the session is a name, an optional
 *  email and a role, all of which live in localStorage. The role arrives as a
 *  query parameter from whichever button on the landing page was pressed, and
 *  stays changeable here.
 */

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";

import { actions } from "../lib/store";
import { Segmented } from "../components/ui";

const HOME_FOR = { tourist: "/app", host: "/host", gov: "/gov" };

const ROLES = [
  { value: "tourist", label: "Travelling" },
  { value: "host", label: "Hosting" },
  { value: "gov", label: "Board" },
];

const BLURB = {
  tourist: "Plan a trip, set the ceiling, and let it book inside that.",
  host: "See what the onboarding agent captured, and what it earned.",
  gov: "Where rural tourism spend landed, district by district.",
};

export function Start() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState(ROLES.some((entry) => entry.value === params.get("role")) ? params.get("role") : "tourist");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function enter(event) {
    event.preventDefault();
    actions.signIn({ name, email, role });
    navigate(HOME_FOR[role], { replace: true });
  }

  return (
    <div className="aurora flex min-h-dvh flex-col">
      <header className="safe-top px-5 py-5">
        <button onClick={() => navigate("/")} className="wordmark text-[11.5px] text-ink">
          ◇ Atithya
        </button>
      </header>

      <motion.form
        onSubmit={enter}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-5 pb-16"
      >
        <h1 className="font-display text-[30px] leading-tight text-ink">Who is Atithya planning for?</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">{BLURB[role]}</p>

        <div className="mt-8">
          <label htmlFor="name" className="eyebrow mb-2 block">
            Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="field"
          />
        </div>

        <div className="mt-5">
          <label htmlFor="email" className="eyebrow mb-2 block">
            Email — optional
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="field !text-[16px]"
          />
        </div>

        <div className="mt-5">
          <span className="eyebrow mb-2 block">Using Atithya as</span>
          <Segmented options={ROLES} value={role} onChange={setRole} />
        </div>

        <button type="submit" className="pill-primary mt-8 flex items-center justify-center gap-2 py-3.5 text-[13.5px] font-medium">
          <ArrowRight size={15} />
          Enter Atithya
        </button>

        <p className="mt-4 text-center text-[10.5px] text-ink-faint">
          You can change this later in Settings. Nothing leaves this device.
        </p>
      </motion.form>
    </div>
  );
}
