import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Placeholder from "./pages/Placeholder";

// The public landing page is vanilla (see /landing). These app routes are honest placeholders
// until their phases are built.
const LiveMapPage = lazy(() => import("./modules/livemap/LiveMapPage"));

const pending: [string, string][] = [
  ["management", "Management"],
  ["signin", "Sign in"],
  ["register", "Get started"],
  ["privacy", "Privacy policy"],
  ["terms", "Terms of service"],
  ["methodology", "Data and methodology"],
];

export default function App() {
  return (
    <Routes>
      <Route path="livemap" element={<Suspense fallback={<Placeholder title="Loading LiveMap…" />}><LiveMapPage /></Suspense>} />
      {pending.map(([path, title]) => (
        <Route key={path} path={path} element={<Placeholder title={title} />} />
      ))}
      <Route path="*" element={<Placeholder title="Page not found" />} />
    </Routes>
  );
}
