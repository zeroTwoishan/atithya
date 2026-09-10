// TripPlannerChat — AI conversation screen for trip planning
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, BookmarkSimple, DotsThreeVertical,
  PaperclipHorizontal, Microphone, PaperPlaneTilt,
  CurrencyInr, CalendarBlank, NavigationArrow, SealCheck,
  ArrowRight,
} from "@phosphor-icons/react";
import { ChatBubble, TypingIndicator } from "../../components/ChatBubble";
import { ListingCard } from "../../components/ListingCard";

// ── Seed data — real Himachal Pradesh places ─────────────────
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "user",
    text: "Budget ₹15,000, 4 days, want mountains and authentic homestays, traveling from Delhi",
    time: "10:24 AM",
  },
  {
    id: 2,
    role: "ai",
    highlightText: "Namaste! 🙏",
    text: "I've crafted a serene 4-day slow journey blending the quiet cedar valley of Tirthan with a Parvati excursion. You'll stay at Meera Devi's heritage kathkuni home with fire-cooked Pahadi meals — comfortably within budget at ₹11,400 total, leaving ₹3,600 buffer.",
    time: "10:24 AM",
    card: "itinerary",
  },
];

const ITINERARY_DAYS = [
  { day: 1, title: "Overnight Volvo & River Arrival", route: "Delhi → Aut → Gushaini" },
  { day: 2, title: "Chhoie Waterfall & Forest Trail", route: "GHNP Eco-Zone" },
  { day: 3, title: "Jalori Pass & Kasol Day Trail", route: "Parvati Belt Excursion" },
  { day: 4, title: "Orchard Morning & Return", route: "Gushaini → Delhi" },
];

const SUGGESTIONS = [
  "Swap Kasol for Jibhi waterfall",
  "Volvo timings from Majnu ka Tilla",
  "Add Siddu & Thali meal plan",
  "Find guide for Chhoie trek",
];

// ── Itinerary Card (inline in chat) ──────────────────────────
function ItineraryInlineCard() {
  return (
    <motion.div
      className="glass-sm rounded-[16px] overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <p className="font-accent font-bold text-[10px] uppercase tracking-widest mb-0.5"
          style={{ color: "#FAC1A8" }}>
          Curated Route Proposal
        </p>
        <h3 className="font-display text-[17px] font-semibold text-white leading-snug">
          4-Day Tirthan & Parvati Slow Journey
        </h3>
        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full font-accent"
          style={{ background: "rgba(47,75,60,0.35)", color: "#86efac", border: "1px solid rgba(47,75,60,0.5)" }}>
          <SealCheck size={10} weight="fill" />
          Eco-Certified
        </span>
      </div>

      {/* Days */}
      <div className="px-4 py-3 space-y-3 relative">
        <div className="absolute left-[19px] top-4 bottom-4 w-[1.5px]"
          style={{ background: "linear-gradient(to bottom, #FFE28D44, #13197044)" }} />
        {ITINERARY_DAYS.map((d, i) => (
          <div key={d.day} className="relative flex gap-3 pl-3">
            <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 z-10 ring-2 ring-black/20"
              style={{ background: i === 0 ? "#BF4E30" : i < 3 ? "#2F4B3C" : "#2a211c" }} />
            <div>
              <p className="font-accent font-bold text-[12.5px] text-white leading-none">{d.title}</p>
              <p className="font-sans-bhraman text-[11px] text-white/55 mt-0.5">{d.route}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Budget strip */}
      <div className="mx-3 mb-3 glass-dark rounded-xl p-3 flex items-center justify-between">
        <div>
          <p className="font-accent font-semibold text-[11px] text-white/80">Estimated Spend</p>
          <p className="font-sans-bhraman text-[10px] text-white/50">Stay + Transit + 2 Treks</p>
        </div>
        <div className="text-right">
          <p className="font-mono-bhraman text-[15px] font-bold text-white">₹11,400</p>
          <p className="font-sans-bhraman text-[10px]" style={{ color: "#86efac" }}>₹3,600 buffer ✓</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────
export function TripPlannerChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showListing, setShowListing] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const newMsg = {
      id: Date.now(),
      role: "user",
      text,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: "Great choice! I can adjust the itinerary to include Jibhi waterfall on Day 3 — it's only 14 km from Banjar and the trail is excellent in September. Shall I swap it and update your budget?",
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <header className="glass border-b border-white/10 px-4 pt-4 pb-3 z-30 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-chat"
              className="w-9 h-9 rounded-full glass-sm btn-icon flex items-center justify-center text-white"
              aria-label="Go back"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-[19px] font-bold text-white leading-none tracking-tight">
                  Plan a Trip
                </h1>
                <span className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#34c77b" }} />
              </div>
              <p className="font-accent text-[11px] font-medium tracking-wide" style={{ color: "#e8a080" }}>
                Bhraman AI · Pahadi Curator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button id="btn-bookmark" className="w-9 h-9 rounded-full glass-sm btn-icon flex items-center justify-center text-white/70" aria-label="Bookmark trip">
              <BookmarkSimple size={18} />
            </button>
            <button id="btn-menu" className="w-9 h-9 rounded-full glass-sm btn-icon flex items-center justify-center text-white/70" aria-label="More options">
              <DotsThreeVertical size={18} />
            </button>
          </div>
        </div>

        {/* Context chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { icon: <CurrencyInr size={13} weight="bold" />, label: "₹15,000 Budget", color: "#FFE28D" },
            { icon: <CalendarBlank size={13} weight="bold" />, label: "4 Days / 3 Nights", color: "#FAC1A8" },
            { icon: <NavigationArrow size={13} weight="bold" />, label: "Ex-Delhi (Volvo)", color: "rgba(255,255,255,0.7)" },
          ].map(({ icon, label, color }) => (
            <div
              key={label}
              className="inline-flex items-center gap-1.5 glass-sm rounded-full px-3 py-1 shrink-0"
            >
              <span style={{ color }}>{icon}</span>
              <span className="font-accent text-[11.5px] font-semibold text-white whitespace-nowrap">
                {label}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* ── Chat area ── */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-36 space-y-4 no-scrollbar">
        {/* Timestamp */}
        <div className="flex justify-center">
          <span className="font-accent text-[10.5px] font-semibold uppercase tracking-widest text-white/40 glass-sm px-3 py-0.5 rounded-full">
            Today • 10:24 AM
          </span>
        </div>

        {/* Messages */}
        {messages.map((msg, i) => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            text={msg.text}
            highlightText={msg.highlightText}
            time={msg.time}
            index={i}
          >
            {/* Render inline cards for AI messages */}
            {msg.card === "itinerary" && <ItineraryInlineCard />}
            {msg.card === "itinerary" && showListing && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <ListingCard
                  name="Meera Devi's Himalayan Homestay"
                  location="Near Chehni Kothi, Tirthan Valley"
                  pricePerNight={1850}
                  rating={4.92}
                  reviewCount={51}
                  verified
                  eco
                  tags={["Kathkuni Cedar Wood", "Bukhari Heating", "Kangri Dham Included"]}
                  onReserve={() => {}}
                />
              </motion.div>
            )}
          </ChatBubble>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>

        {/* Suggested quick replies */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <p className="font-accent text-[10px] font-semibold uppercase tracking-widest text-white/35 px-1">
            Suggested inquiries
          </p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="glass-sm btn-chip rounded-full px-3 py-1.5 font-sans-bhraman text-[11.5px] text-white/75 whitespace-nowrap shrink-0 flex items-center gap-1.5 border border-white/10"
                onClick={() => setInput(s)}
              >
                <ArrowRight size={11} className="text-white/45" />
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        <div ref={bottomRef} />
      </main>

      {/* ── Input bar ── */}
      <div className="fixed bottom-20 left-0 right-0 max-w-[430px] mx-auto px-3.5 z-40">
        <div
          className="glass rounded-2xl pl-3.5 pr-1.5 py-2 flex items-center gap-2"
          style={{ boxShadow: "0 -4px 30px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.10)" }}
        >
          <button id="btn-attach" className="w-8 h-8 rounded-full btn-icon flex items-center justify-center text-white/50 shrink-0" aria-label="Attach file">
            <PaperclipHorizontal size={18} />
          </button>
          <input
            id="input-chat"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask Bhraman AI anything..."
            className="flex-1 bg-transparent text-[13.5px] text-white placeholder-white/30 focus:outline-none font-sans-bhraman leading-none"
          />
          <button id="btn-voice" className="w-8 h-8 rounded-full btn-icon flex items-center justify-center text-white/50 shrink-0" aria-label="Voice input">
            <Microphone size={18} />
          </button>
          <button
            id="btn-send"
            onClick={sendMessage}
            className="w-9 h-9 rounded-full btn-primary flex items-center justify-center text-white shrink-0"
            style={{ background: "#e8643a" }}
            aria-label="Send message"
          >
            <PaperPlaneTilt size={16} weight="fill" />
          </button>
        </div>
        <p className="font-sans-bhraman text-[10px] text-white/30 text-center mt-2 flex items-center justify-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          100% direct payouts to Himachal rural hosts
        </p>
      </div>
    </div>
  );
}
