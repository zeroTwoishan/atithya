import { Navigate, Route, Routes } from "react-router-dom";
import { TouristHome } from "./pages/tourist/TouristHome";
import { HostHome } from "./pages/host/HostHome";
import { GovHome } from "./pages/gov/GovHome";

// Three role-gated route trees sharing one app, per docs/TRD.md §2 — not
// three separate apps. /gov is wrapped in the "gov" class to switch design
// token archetypes (docs/UI_UX_DESIGN.md §1-3).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tourist" replace />} />
      <Route path="/tourist/*" element={<TouristHome />} />
      <Route path="/host/*" element={<HostHome />} />
      <Route
        path="/gov/*"
        element={
          <div className="gov bg-canvas text-ink min-h-dvh">
            <GovHome />
          </div>
        }
      />
    </Routes>
  );
}
