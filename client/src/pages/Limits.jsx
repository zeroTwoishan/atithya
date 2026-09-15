/** The rules that run before every booking.
 *
 *  This is the screen the whole product's promise rests on, so it says what
 *  each control actually does in plain words underneath it, and every figure
 *  is shown against what has already been spent — a ceiling with no context
 *  is a number, not a limit.
 */

import { useNavigate } from "react-router-dom";
import { ShieldCheck, X, Plus } from "@phosphor-icons/react";

import { rupees } from "../lib/format";
import { useStore, actions } from "../lib/store";
import { HOSTS } from "../data/catalog";
import { Card, Inset, Page, Row, SectionLabel, Slider, StepChips, SubHeader, Toggle } from "../components/ui";

const AUTO_STEPS = [500, 1000, 2000, 5000, 10000];

export function Limits() {
  const navigate = useNavigate();
  const { settings, spentToday } = useStore();
  const set = actions.setSetting;

  const untrusted = Object.values(HOSTS).filter((host) => !settings.trustedHosts.includes(host.id));

  return (
    <div className="aurora min-h-dvh">
      <div className="relative z-10 mx-auto w-full max-w-[560px] pb-20">
        <SubHeader
          title="Limits"
          subtitle="What the agent may do on its own"
          back="/app/settings"
          action={
            <button onClick={actions.resetLimits} className="pill shrink-0 px-3.5 py-1.5 text-[12px] text-ink-soft">
              Reset
            </button>
          }
        />

        <Page className="px-5">
          <Inset className="flex items-start gap-3">
            <ShieldCheck size={17} weight="duotone" className="mt-0.5 shrink-0 text-ink-soft" />
            <p className="text-[12px] leading-relaxed text-ink-soft">
              These rules run before every booking. The agent cannot step outside them — not for a better stay, not
              for a closing offer, not for a host it likes.
            </p>
          </Inset>

          {/* Paying */}
          <section className="mt-7">
            <SectionLabel>Booking</SectionLabel>
            <div className="flex flex-col gap-2">
              <Row
                title="Let the agent book"
                subtitle="Inside the limits below"
                right={<Toggle checked={settings.agentBooks} onChange={(value) => set("agentBooks", value)} label="Let the agent book" />}
              />

              <Card className={settings.agentBooks ? "" : "pointer-events-none opacity-45"}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-ink">Book without asking, up to</span>
                  <span className="figure text-[17px] text-ink">{rupees(settings.autoApprove)}</span>
                </div>
                <StepChips
                  steps={AUTO_STEPS}
                  value={settings.autoApprove}
                  onChange={(value) => set("autoApprove", value)}
                  format={rupees}
                />
                <p className="caption mt-2.5">Anything above this amount stops and asks you first.</p>
              </Card>
            </div>
          </section>

          {/* Ceilings */}
          <section className="mt-7">
            <SectionLabel>Ceilings</SectionLabel>
            <Card className="flex flex-col gap-6">
              <Slider
                label="Most it may spend in a day"
                value={settings.dailyCap}
                min={5000}
                max={100000}
                step={1000}
                onChange={(value) => set("dailyCap", value)}
                format={rupees}
                note={
                  spentToday > 0
                    ? `${rupees(spentToday)} committed today. A trip that would cross this cap is blocked outright.`
                    : "Nothing committed today. A trip that would cross this cap is blocked outright."
                }
              />
              <Slider
                label="Never spend more than"
                value={settings.hardCap}
                min={25000}
                max={500000}
                step={5000}
                onChange={(value) => set("hardCap", value)}
                format={rupees}
                note="The agent will never book a trip above this, approved or not."
              />
            </Card>
          </section>

          {/* Always ask */}
          <section className="mt-7">
            <SectionLabel>Always ask me first</SectionLabel>
            <div className="flex flex-col gap-2">
              <Row
                title="A host I haven't stayed with"
                subtitle="First booking with any new host"
                right={<Toggle checked={settings.askNewHost} onChange={(value) => set("askNewHost", value)} label="Ask about new hosts" />}
              />
              <Row
                title="Anything costly to cancel"
                subtitle="Non-refundable rates and paid cancellations"
                right={<Toggle checked={settings.askNonRefundable} onChange={(value) => set("askNonRefundable", value)} label="Ask about non-refundable rates" />}
              />
            </div>
          </section>

          {/* Trusted hosts */}
          <section className="mt-7">
            <SectionLabel
              action={
                untrusted.length > 0 ? (
                  <button
                    onClick={() => actions.trustHost(untrusted[0].id)}
                    className="pill flex shrink-0 items-center gap-1.5 px-3 py-1 text-[11.5px] text-ink-soft"
                  >
                    <Plus size={11} />
                    Add
                  </button>
                ) : null
              }
            >
              Hosts I trust
            </SectionLabel>

            {settings.trustedHosts.length ? (
              <Card className="divide-y divide-hairline p-0">
                {settings.trustedHosts.map((id) => (
                  <div key={id} className="flex items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{HOSTS[id]?.name ?? id}</span>
                    <button
                      onClick={() => actions.untrustHost(id)}
                      aria-label={`Stop trusting ${HOSTS[id]?.name ?? id}`}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-ink-faint hover:text-ink"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </Card>
            ) : (
              <Inset>
                <p className="text-[12px] leading-relaxed text-ink-soft">
                  No trusted hosts yet. Approve a booking and you can trust that host from the approval sheet.
                </p>
              </Inset>
            )}

            <p className="caption mt-2.5 px-1 leading-relaxed">
              A trusted host skips the new-host check. Every other rule on this page still applies to them.
            </p>
          </section>

          <button onClick={() => navigate("/app/settings")} className="pill mt-8 w-full py-3 text-[13px] text-ink-soft">
            Done
          </button>
        </Page>
      </div>
    </div>
  );
}
