/** "How Atithya decides, and where it stops."
 *
 *  Reachable from the landing page and from Settings. It is the honest page:
 *  what the agents do, what this build actually is, and what is simulated.
 */

import { useNavigate } from "react-router-dom";

import { Inset, Page, SubHeader } from "../components/ui";

const SECTIONS = [
  {
    title: "It reads the sentence, not a form",
    body: "A budget, a number of days and a few words about what you're after is the whole input. Atithya pulls the ceiling, the length and the interests out of it, and shows you what it read before it does anything — so a misreading is caught at the brief, not after it has booked.",
  },
  {
    title: "It searches supply that isn't listed anywhere else",
    body: "The homestays, guides and workshops Atithya books are not on the big platforms. They came in over WhatsApp: the host sent a message in Hindi, Garhwali or Bhoti, an agent interviewed them, and the listing you see was written from that conversation.",
  },
  {
    title: "It scores, and it shows the scoring",
    body: "Every candidate is scored on fit to what you asked for, rating across real stays, price against your per-day ceiling, and how crowded the destination already is. The trip screen shows the option it picked, the options it rejected, and the reasons for both.",
  },
  {
    title: "It routes away from the crowd",
    body: "Anywhere above 75% of comfortable carrying capacity is steered around. That is the point of the platform: the demand exists, it just all lands on the same six places.",
  },
  {
    title: "It stops at your line",
    body: "You set what it may book without asking. Above that, it stops dead and waits — however good the itinerary looks to it. Booking is a press-and-hold, not a tap, because it is the one action that cannot be undone.",
  },
  {
    title: "The host is paid in full",
    body: "Atithya takes no commission on the room rate. The figure on the listing is the figure the host receives.",
  },
];

export function About() {
  const navigate = useNavigate();

  return (
    <div className="aurora min-h-dvh">
      <div className="relative z-10 mx-auto w-full max-w-[600px] pb-20">
        <SubHeader title="What Atithya is" back="/" />

        <Page className="px-5">
          <h1 className="text-balance font-display text-[32px] leading-[1.1] text-ink">
            How Atithya decides, and where it stops.
          </h1>

          <div className="mt-9 flex flex-col gap-8">
            {SECTIONS.map((section, index) => (
              <section key={section.title}>
                <p className="caption mb-2">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="font-display text-[22px] leading-snug text-ink">{section.title}</h2>
                <p className="mt-2 font-reading text-[15.5px] leading-[1.65] text-ink-soft">{section.body}</p>
              </section>
            ))}
          </div>

          <Inset className="mt-12">
            <p className="caption mb-2">About this build</p>
            <p className="text-[12px] leading-relaxed text-ink-soft">
              This is a frontend prototype. There is no server: the catalogue, the planning agent and every booking
              run in your browser, and the state lives in this device&apos;s local storage. No account is created,
              no message is sent, and no money moves. Signing out deletes everything.
            </p>
          </Inset>

          <button onClick={() => navigate(-1)} className="pill mt-6 w-full py-3 text-[13px] text-ink-soft">
            Back
          </button>
        </Page>
      </div>
    </div>
  );
}
