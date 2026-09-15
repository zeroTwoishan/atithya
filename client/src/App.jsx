/** The route tree.
 *
 *  Three dashboards over one local store. The guard only checks that a
 *  session exists — roles here are views of the same data, not a security
 *  boundary, and pretending otherwise in a build with no server would be
 *  theatre. The role roots do redirect to whichever dashboard the session
 *  actually chose, so you cannot land in the wrong one by typing a URL.
 */

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";

import { useStore } from "./lib/store";

import { Landing } from "./pages/Landing";
import { Start } from "./pages/Start";
import { About } from "./pages/About";
import { Settings } from "./pages/Settings";
import { Limits } from "./pages/Limits";

import { TouristHome } from "./pages/tourist/Home";
import { NewTrip } from "./pages/tourist/NewTrip";
import { TripDetail } from "./pages/tourist/TripDetail";
import { Trips } from "./pages/tourist/Trips";
import { Safety } from "./pages/tourist/Safety";
import { Discover } from "./pages/tourist/Discover";
import { StayDetail } from "./pages/tourist/StayDetail";

import { HostHome } from "./pages/host/HostHome";
import { HostListings } from "./pages/host/HostListings";
import { HostListingDetail } from "./pages/host/HostListingDetail";
import { HostVerification } from "./pages/host/HostVerification";

import { GovHome } from "./pages/gov/GovHome";
import { GovRegions } from "./pages/gov/GovRegions";
import { GovAdvisories } from "./pages/gov/GovAdvisories";

const HOME_FOR = { tourist: "/app", host: "/host", gov: "/gov" };

/** Signed out? Back to the landing page, remembering where you were headed. */
function Require({ children }) {
  const session = useStore((state) => state.session);
  const location = useLocation();
  if (!session) return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}

/** A role root belongs to one role. Anyone else is sent to their own. */
function RoleRoot({ role, children }) {
  const session = useStore((state) => state.session);
  if (!session) return <Navigate to="/" replace />;
  if (session.role !== role) return <Navigate to={HOME_FOR[session.role] ?? "/"} replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  const session = useStore((state) => state.session);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={session ? <Navigate to={HOME_FOR[session.role] ?? "/app"} replace /> : <Landing />} />
        <Route path="/start" element={<Start />} />
        <Route path="/about" element={<About />} />

        {/* Traveller */}
        <Route path="/app" element={<RoleRoot role="tourist"><TouristHome /></RoleRoot>} />
        <Route path="/app/new/:tripId" element={<Require><NewTrip /></Require>} />
        <Route path="/app/trip/:tripId" element={<Require><TripDetail /></Require>} />
        <Route path="/app/trips" element={<Require><Trips /></Require>} />
        <Route path="/app/safety" element={<Require><Safety /></Require>} />
        <Route path="/app/discover" element={<Require><Discover /></Require>} />
        <Route path="/app/stay/:listingId" element={<Require><StayDetail /></Require>} />

        {/* Shared across all three roles */}
        <Route path="/app/settings" element={<Require><Settings /></Require>} />
        <Route path="/app/settings/limits" element={<Require><Limits /></Require>} />

        {/* Host */}
        <Route path="/host" element={<RoleRoot role="host"><HostHome /></RoleRoot>} />
        <Route path="/host/listings" element={<Require><HostListings /></Require>} />
        <Route path="/host/listing/:listingId" element={<Require><HostListingDetail /></Require>} />
        <Route path="/host/verification" element={<Require><HostVerification /></Require>} />

        {/* Tourism board */}
        <Route path="/gov" element={<RoleRoot role="gov"><GovHome /></RoleRoot>} />
        <Route path="/gov/regions" element={<Require><GovRegions /></Require>} />
        <Route path="/gov/advisories" element={<Require><GovAdvisories /></Require>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
