/** Settings.
 *
 *  Profile, then the agent's rules, then appearance, then the facts about
 *  this install. Same order as the reference — the things you change often
 *  are above the things you change once.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Info, Moon, ShieldCheck, UserSwitch } from "@phosphor-icons/react";

import { shortDate } from "../lib/format";
import { useStore, actions } from "../lib/store";
import { useTheme } from "../lib/useTheme";
import { Shell } from "../components/Shell";
import { Card, Inset, Page, Row, SectionLabel, Segmented, Toggle } from "../components/ui";

const ROLES = [
  { value: "tourist", label: "Travelling" },
  { value: "host", label: "Hosting" },
  { value: "gov", label: "Board" },
];

const HOME_FOR = { tourist: "/app", host: "/host", gov: "/gov" };

export function Settings() {
  const navigate = useNavigate();
  const { session, trips } = useStore();
  const { dark, toggle } = useTheme();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(session?.name ?? "");
  const [email, setEmail] = useState(session?.email ?? "");

  function save() {
    actions.updateProfile({ name: name.trim() || "Traveller", email: email.trim() });
    setEditing(false);
  }

  function switchTo(role) {
    actions.switchRole(role);
    navigate(HOME_FOR[role]);
  }

  return (
    <Shell>
      <Page className="mx-auto w-full max-w-[560px]">
        <h1 className="pt-2 font-display text-[30px] leading-tight text-ink">Settings</h1>

        {/* Profile */}
        <Card className="mt-5">
          {editing ? (
            <div className="flex flex-col gap-3">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="field !text-[17px]" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="field !text-[15px]" />
              <div className="flex gap-2">
                <button onClick={save} className="pill-primary flex-1 py-2.5 text-[12.5px] font-medium">
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="pill flex-1 py-2.5 text-[12.5px] text-ink-soft">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-strong font-display text-[20px] text-ink">
                {(session?.name ?? "T")[0].toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[20px] leading-tight text-ink">{session?.name ?? "Traveller"}</p>
                <p className="caption mt-0.5 truncate">{session?.email || "No email on file"}</p>
              </div>
              <button onClick={() => setEditing(true)} className="pill shrink-0 px-3.5 py-1.5 text-[12px] text-ink-soft">
                Edit
              </button>
            </div>
          )}
        </Card>

        {/* Role */}
        <section className="mt-7">
          <SectionLabel>You are using Atithya as</SectionLabel>
          <Segmented options={ROLES} value={session?.role ?? "tourist"} onChange={switchTo} />
          <p className="caption mt-2 px-1">
            All three dashboards read the same data. Switching is instant and changes nothing underneath.
          </p>
        </section>

        {/* The agent */}
        <section className="mt-7">
          <SectionLabel>Your agent</SectionLabel>
          <div className="flex flex-col gap-2">
            <Row
              icon={ShieldCheck}
              title="Limits"
              subtitle="What it may book without asking you"
              to="/app/settings/limits"
            />
            <Row
              icon={CreditCard}
              title="Payment method"
              subtitle="Simulated wallet · nothing is ever charged"
              onClick={() => {}}
            />
            <Row
              icon={UserSwitch}
              title="Switch role"
              subtitle="Traveller, host, or tourism board"
              onClick={() => switchTo(session?.role === "tourist" ? "host" : "tourist")}
            />
          </div>
        </section>

        {/* Appearance */}
        <section className="mt-7">
          <SectionLabel>Appearance</SectionLabel>
          <Row
            icon={Moon}
            title="Dark appearance"
            subtitle="Follows your device until you choose here"
            right={<Toggle checked={dark} onChange={toggle} label="Dark appearance" />}
          />
        </section>

        {/* About */}
        <section className="mt-7">
          <SectionLabel>About</SectionLabel>
          <Row
            icon={Info}
            title="What Atithya is"
            subtitle="How the agent decides, and where it stops"
            to="/about"
          />
        </section>

        {/* Facts */}
        <Inset className="mt-3 divide-y divide-hairline p-0">
          <Fact label="Trips planned" value={trips.length} />
          <Fact label="Member since" value={session?.since ? shortDate(session.since) : "—"} />
          <Fact label="This device" value="Local storage only" />
        </Inset>

        <div className="mt-7 flex flex-col gap-2">
          <button onClick={actions.clearFinished} className="pill py-3 text-[13px] text-ink-soft">
            Clear finished trips
          </button>
          <button
            onClick={() => {
              actions.signOut();
              navigate("/", { replace: true });
            }}
            className="pill py-3 text-[13px] text-negative"
          >
            Sign out
          </button>
        </div>

        <p className="caption mt-4 px-1 leading-relaxed">
          Signing out clears everything on this device — trips, history and limits. Nothing was ever sent anywhere
          else, so there is nothing to delete elsewhere.
        </p>

        <footer className="mt-10 flex flex-col items-center gap-2">
          <span className="wordmark text-[10.5px] text-ink-soft">◇ Atithya</span>
          <p className="text-center text-[10.5px] text-ink-faint">
            The first layer between a village and the people looking for it.
          </p>
        </footer>
      </Page>
    </Shell>
  );
}

const Fact = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 px-4 py-3">
    <span className="text-[12.5px] text-ink-soft">{label}</span>
    <span className="text-[12.5px] text-ink">{value}</span>
  </div>
);
