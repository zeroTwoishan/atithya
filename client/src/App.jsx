import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { SignIn } from "./pages/SignIn";
import { TouristHome } from "./pages/tourist/TouristHome";
import { HostHome } from "./pages/host/HostHome";
import { GovHome } from "./pages/gov/GovHome";
import { getToken, getUser } from "./lib/api";

const HOME_FOR = { tourist: "/tourist", host: "/host", gov: "/gov" };

/** Three role-gated route trees in one app (docs/TRD.md §2). The gate is a
 *  convenience, not the security boundary — every endpoint checks the JWT and
 *  row ownership server-side, so a hand-edited localStorage role gets 403s,
 *  not data. */
function Guard({ role, children }) {
  const location = useLocation();
  const user = getUser();

  if (!getToken() || !user) return <Navigate to="/signin" state={{ from: location }} replace />;
  if (user.role !== role) return <Navigate to={HOME_FOR[user.role] ?? "/signin"} replace />;
  return children;
}

export default function App() {
  const user = getUser();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getToken() && user ? (HOME_FOR[user.role] ?? "/signin") : "/signin"} replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/tourist/*" element={<Guard role="tourist"><TouristHome /></Guard>} />
      <Route path="/host/*" element={<Guard role="host"><HostHome /></Guard>} />
      <Route path="/gov/*" element={<Guard role="gov"><GovHome /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
