// TouristHome — shell: dusk backdrop, floating orbs, sub-router, NavBar
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { NavBar } from "../../components/NavBar";
import { TripPlannerChat } from "./TripPlannerChat";
import { ItineraryTimeline } from "./ItineraryTimeline";
import { DiscoverNearby } from "./DiscoverNearby";

// ── Page transition wrapper ───────────────────────────────────
function PageTransition({ children }) {
  return (
    <motion.div
      className="flex-1 flex flex-col overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Main Shell ────────────────────────────────────────────────
export function TouristHome() {
  const location = useLocation();

  return (
    /*
     * Outermost container: full viewport, mobile-centred, dusk gradient backdrop.
     * All content (header, screens, nav) sits on top of the gradient + orbs.
     */
    <div
      className="min-h-dvh w-full flex justify-center"
      style={{ background: "#131970" }}
    >
      {/* Mobile frame — max 430px wide */}
      <div className="relative w-full max-w-[430px] min-h-dvh flex flex-col overflow-hidden dusk-backdrop">

        {/* ── Floating ambient orbs ── */}
        <div className="orb orb-sun"   aria-hidden="true" />
        <div className="orb orb-blush" aria-hidden="true" />
        <div className="orb orb-rust"  aria-hidden="true" />
        <div className="orb orb-navy"  aria-hidden="true" />

        {/* ── Content layer (above orbs) ── */}
        <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
          {/* Animated page routes */}
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route index element={<Navigate to="/tourist/chat" replace />} />
              <Route
                path="chat"
                element={
                  <PageTransition>
                    <TripPlannerChat />
                  </PageTransition>
                }
              />
              <Route
                path="itinerary"
                element={
                  <PageTransition>
                    <ItineraryTimeline />
                  </PageTransition>
                }
              />
              <Route
                path="discover"
                element={
                  <PageTransition>
                    <DiscoverNearby />
                  </PageTransition>
                }
              />
            </Routes>
          </AnimatePresence>

          {/* Bottom navigation */}
          <NavBar />
        </div>
      </div>
    </div>
  );
}
