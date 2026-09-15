/** Chat turns. The agent speaks in the display serif (it is the voice of the
 *  product); the tourist's own words sit in a filled pill. */
import { motion } from "motion/react";

import { cn } from "../lib/utils";

export function ChatBubble({ role, text, time, children, index = 0 }) {
  const mine = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2), ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex w-full flex-col gap-2", mine ? "items-end" : "items-start")}
    >
      <div className={cn("max-w-[85%] sm:max-w-[560px]", mine && "flex flex-col items-end")}>
        {mine ? (
          <p className="card-inset bg-surface-strong px-4 py-2.5 text-[13.5px] leading-relaxed text-ink">{text}</p>
        ) : (
          <p className="font-reading text-[16.5px] leading-[1.6] text-ink">{text}</p>
        )}
        {time && <time className="mt-1.5 block text-[10.5px] text-ink-faint">{time}</time>}
      </div>
      {children && <div className="w-full max-w-[85%] sm:max-w-[560px]">{children}</div>}
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="size-[5px] rounded-full bg-ink-faint"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.18 }}
        />
      ))}
      <span className="ml-1.5 text-[11.5px] text-ink-faint">Atithya is planning…</span>
    </motion.div>
  );
}
