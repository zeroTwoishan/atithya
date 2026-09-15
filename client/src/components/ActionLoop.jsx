/** The agent's reasoning, as a vertical timeline.
 *
 *  This is the screen the whole product argues for: an agent that books
 *  things on your behalf is only trustworthy if every step it took is
 *  visible afterwards. Done steps carry a filled check and their detail
 *  lines; the step in flight pulses; steps not reached yet are hairline
 *  circles with nothing under them.
 */

import { motion } from "motion/react";
import { Check } from "@phosphor-icons/react";

import { cn } from "../lib/utils";

function Node({ state }) {
  if (state === "done") {
    return (
      <span className="relative z-10 flex size-[19px] shrink-0 items-center justify-center rounded-full bg-positive/18 text-positive">
        <Check size={11} weight="bold" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="relative z-10 flex size-[19px] shrink-0 items-center justify-center rounded-full border border-ink-faint">
        <motion.span
          className="size-[7px] rounded-full bg-ink"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.3, repeat: Infinity }}
        />
      </span>
    );
  }
  return <span className="relative z-10 size-[19px] shrink-0 rounded-full border border-hairline" />;
}

export function ActionLoop({ steps, progress }) {
  return (
    <ol className="relative">
      {steps.map((step, index) => {
        const state = index < progress ? "done" : index === progress ? "active" : "pending";
        const last = index === steps.length - 1;

        return (
          <li key={step.key} className="relative flex gap-3.5 pb-5 last:pb-0">
            {/* Connector, drawn behind the node and stopped at the last step.
                It greens out as the loop advances, so progress is legible from
                the shape of the line alone. */}
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[9px] top-[19px] h-full w-px transition-colors duration-500",
                  index < progress ? "bg-positive/35" : "bg-hairline",
                )}
              />
            )}

            <Node state={state} />

            <div className="min-w-0 flex-1 pt-px">
              <p
                className={cn(
                  "text-[13px] leading-snug transition-colors",
                  state === "pending" ? "text-ink-faint" : "font-medium text-ink",
                )}
              >
                {step.label}
              </p>

              {state !== "pending" && step.summary && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-0.5 text-[11.5px] leading-snug text-ink-soft"
                >
                  {step.summary}
                </motion.p>
              )}

              {state === "done" && step.detail?.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="mt-1.5 space-y-0.5 overflow-hidden"
                >
                  {step.detail.map((line) => (
                    <li key={line} className="text-[11px] leading-relaxed text-ink-faint">
                      {line}
                    </li>
                  ))}
                </motion.ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
