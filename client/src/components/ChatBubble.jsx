// ChatBubble — user and AI message bubbles with glassmorphic styling
import { motion } from "motion/react";
import { clsx } from "clsx";

// Typing indicator shown while AI is thinking
export function TypingIndicator() {
  return (
    <motion.div
      className="flex items-start gap-2.5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full glass-dark flex items-center justify-center shrink-0 mt-0.5 border border-white/20">
        <span className="font-display text-sm text-white font-bold">भ</span>
      </div>
      <div className="glass-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/70 inline-block" />
      </div>
    </motion.div>
  );
}

// User bubble (right-aligned, warmer glass)
function UserBubble({ text, time, index }) {
  return (
    <motion.div
      className="flex justify-end"
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-[82%] glass rounded-2xl rounded-tr-sm px-4 py-3">
        <p className="font-sans-bhraman text-[13.5px] leading-relaxed text-white">{text}</p>
        {time && (
          <p className="font-mono-bhraman text-[10px] text-white/50 text-right mt-1">{time}</p>
        )}
      </div>
    </motion.div>
  );
}

// AI bubble (left-aligned, with avatar, softer glass)
function AiBubble({ text, highlightText, time, index, children }) {
  return (
    <motion.div
      className="flex items-start gap-2.5"
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.38, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Bhraman Avatar */}
      <div className="w-8 h-8 rounded-full glass-dark flex items-center justify-center shrink-0 mt-0.5 border border-white/20 shadow-sm">
        <span className="font-display text-sm font-bold" style={{ color: "#FFE28D" }}>भ</span>
      </div>

      <div className="flex-1 space-y-2.5 max-w-[88%]">
        {text && (
          <div className="glass-sm rounded-2xl rounded-tl-sm px-4 py-3">
            {highlightText && (
              <p className="font-display text-[15px] font-semibold mb-1" style={{ color: "#FFE28D" }}>
                {highlightText}
              </p>
            )}
            <p className="font-sans-bhraman text-[13.5px] leading-relaxed text-white/90">{text}</p>
            {time && (
              <p className="font-mono-bhraman text-[10px] text-white/40 mt-1">{time}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}

export function ChatBubble({ role = "user", text, highlightText, time, index = 0, children }) {
  if (role === "user") {
    return <UserBubble text={text} time={time} index={index} />;
  }
  return (
    <AiBubble text={text} highlightText={highlightText} time={time} index={index}>
      {children}
    </AiBubble>
  );
}
