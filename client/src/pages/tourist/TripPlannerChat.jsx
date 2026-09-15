/** The planning conversation. A message becomes a real POST /trips — the
 *  itinerary that comes back is the agent's, not a mock (docs/TRD.md §3.2).
 *
 *  Parsing budget/dates/interests happens client-side: the planning agent
 *  takes a structured trip, and a second LLM round-trip just to turn a
 *  sentence into three fields would add latency the demo can feel.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import { ArrowRight, PaperPlaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";

import { ChatBubble, TypingIndicator } from "../../components/ChatBubble";
import { Card, SectionLabel, Chip } from "../../components/Primitives";
import { Timeline } from "../../components/Timeline";
import { endpoints, apiError } from "../../lib/api";
import { rupees, clockTime, dateRange } from "../../lib/format";
import { parseTripRequest } from "../../lib/parseTripRequest";

const OPENER = {
  id: "opener",
  role: "agent",
  text: "Namaste. Tell me your budget, how many days you have, and what you're after — mountains, craft, quiet, food. I'll build the trip and book it.",
};

const SUGGESTIONS = [
  "₹15,000, 4 days, mountains and authentic homestays",
  "₹8,000, 3 days, weaving and craft workshops in Kullu",
  "₹20,000, 5 days, quiet valleys and river walks",
];

export function TripPlannerChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([OPENER]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const plan = useMutation({
    mutationFn: (request) => endpoints.createTrip(request),
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setMessages((previous) => [
        ...previous,
        { id: trip.id, role: "agent", text: trip.narrative, time: clockTime(), trip },
      ]);
    },
    onError: (error) => {
      toast.error(apiError(error));
      setMessages((previous) => [
        ...previous,
        { id: `err-${Date.now()}`, role: "agent", text: apiError(error), time: clockTime() },
      ]);
    },
  });

  function send(raw) {
    const text = (raw ?? input).trim();
    if (!text || plan.isPending) return;

    setMessages((previous) => [...previous, { id: Date.now(), role: "user", text, time: clockTime() }]);
    setInput("");
    plan.mutate(parseTripRequest(text));
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col">
      <div className="flex flex-col gap-6 py-4">
        {messages.map((message, index) => (
          <ChatBubble key={message.id} role={message.role} text={message.text} time={message.time} index={index}>
            {message.trip && <TripPreview trip={message.trip} onOpen={() => navigate(`/tourist/itinerary/${message.trip.id}`)} />}
          </ChatBubble>
        ))}

        <AnimatePresence>{plan.isPending && <TypingIndicator key="typing" />}</AnimatePresence>

        {messages.length === 1 && (
          <div className="mt-2">
            <SectionLabel>Try</SectionLabel>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  className="pill flex items-center gap-2 px-4 py-2.5 text-left text-[12.5px] text-ink-soft"
                >
                  <ArrowRight size={13} className="shrink-0 text-ink-faint" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer — sticky above the dock on phones, in flow on desktop */}
      <div className="sticky bottom-24 z-30 mt-auto lg:bottom-6">
        <div className="card flex items-center gap-2 p-2 pl-4">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && send()}
            placeholder="Budget, days, what you're after…"
            aria-label="Describe your trip"
            className="min-w-0 flex-1 bg-transparent font-reading text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || plan.isPending}
            aria-label="Send"
            className="pill-primary flex size-10 shrink-0 items-center justify-center"
          >
            <PaperPlaneTilt size={16} weight="fill" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10.5px] text-ink-faint">
          Every stay is a verified listing. 100% of the room rate reaches the host.
        </p>
      </div>
    </div>
  );
}

/** The itinerary, inline in the conversation. */
function TripPreview({ trip, onOpen }) {
  const headroom = Number(trip.budget) - Number(trip.estimated_cost);

  return (
    <Card className="mt-1 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">{trip.days}-day route</p>
          <p className="font-display text-[19px] leading-snug text-ink">{dateRange(trip.start_date, trip.end_date)}</p>
        </div>
        <div className="text-right">
          <p className="figure text-[20px] leading-none text-ink">{rupees(trip.estimated_cost)}</p>
          <p className="mt-1 text-[11px] text-ink-faint">of {rupees(trip.budget)}</p>
        </div>
      </div>

      {headroom > 0 && <Chip className="self-start text-positive">{rupees(headroom)} under budget</Chip>}

      <Timeline items={trip.itinerary_items.slice(0, 4)} />

      <button onClick={onOpen} className="pill-primary w-full py-3 text-[13px] font-medium">
        Open full itinerary
      </button>
    </Card>
  );
}
