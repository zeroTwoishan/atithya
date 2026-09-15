import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Sparkle, MapTrifold, Compass } from "@phosphor-icons/react";

import { Shell } from "../../components/Shell";
import { TripPlannerChat } from "./TripPlannerChat";
import { ItineraryTimeline } from "./ItineraryTimeline";
import { DiscoverNearby } from "./DiscoverNearby";

const TABS = [
  { to: "/tourist/chat", label: "Plan", icon: Sparkle },
  { to: "/tourist/itinerary", label: "Itinerary", icon: MapTrifold },
  { to: "/tourist/discover", label: "Discover", icon: Compass },
];

const TITLES = { chat: "Plan a trip", itinerary: "Your trip", discover: "Discover" };

const Page = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export function TouristHome() {
  const location = useLocation();
  const section = location.pathname.split("/")[2] ?? "chat";

  return (
    <Shell tabs={TABS} title={TITLES[section]}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={section}>
          <Route index element={<Navigate to="/tourist/chat" replace />} />
          <Route path="chat" element={<Page><TripPlannerChat /></Page>} />
          <Route path="itinerary" element={<Page><ItineraryTimeline /></Page>} />
          <Route path="itinerary/:tripId" element={<Page><ItineraryTimeline /></Page>} />
          <Route path="discover" element={<Page><DiscoverNearby /></Page>} />
        </Routes>
      </AnimatePresence>
    </Shell>
  );
}
