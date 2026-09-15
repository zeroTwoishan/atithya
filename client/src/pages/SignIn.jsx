/** docs/TRD.md §4 — three fixed demo accounts, not a signup flow. One tap per
 *  role keeps the stage demo fast; underneath it is a real credential POST
 *  returning a real JWT. */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Compass, House, ChartBar, ArrowRight } from "@phosphor-icons/react";

import { Spinner } from "../components/Primitives";
import { signIn, apiError } from "../lib/api";

const ROLES = [
  { username: "tourist_demo", label: "Tourist", icon: Compass, home: "/tourist", blurb: "Plan, book and re-plan a trip" },
  { username: "host_demo", label: "Host", icon: House, home: "/host", blurb: "Listings, occupancy and payouts" },
  { username: "gov_demo", label: "Government", icon: ChartBar, home: "/gov", blurb: "Where rural spend lands" },
];

export function SignIn() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);

  async function enter(role) {
    setPending(role.username);
    try {
      // Demo accounts seed with password == username (server/src/db/seed.js).
      await signIn(role.username, role.username);
      navigate(role.home, { replace: true });
    } catch (error) {
      toast.error(apiError(error));
      setPending(null);
    }
  }

  return (
    <div className="aurora flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[560px]"
      >
        <header className="mb-10">
          <p className="wordmark mb-6 text-[12px] text-ink-soft">◇ Atithya</p>
          {/* text-balance keeps the two lines even instead of leaving one
              orphaned word, at every width */}
          <h1 className="text-balance font-display text-[40px] leading-[1.08] text-ink sm:text-[52px]">
            Hospitality every village already has.
          </h1>
          <p className="mt-4 max-w-[420px] text-[13.5px] leading-relaxed text-ink-soft">
            A host sends one WhatsApp message. The agent interviews them, writes the listing, publishes it — then
            sells it to tourists.
          </p>
        </header>

        <div className="flex flex-col gap-2.5">
          {ROLES.map((role) => (
            <button
              key={role.username}
              onClick={() => enter(role)}
              disabled={pending !== null}
              className="pill flex items-center gap-4 px-5 py-4 text-left"
            >
              <role.icon size={20} weight="duotone" className="shrink-0 text-ink-soft" />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-ink">Continue as {role.label}</span>
                <span className="mt-0.5 block text-[11.5px] text-ink-faint">{role.blurb}</span>
              </span>
              {pending === role.username ? (
                <Spinner size={16} />
              ) : (
                <ArrowRight size={15} className="shrink-0 text-ink-faint" />
              )}
            </button>
          ))}
        </div>

        <p className="mt-7 text-center text-[10.5px] leading-relaxed text-ink-faint">
          Demo build. Three fixed role accounts, real JWTs, password matches the username.
          <br />
          Every price and payment is simulated.
        </p>
      </motion.div>
    </div>
  );
}
