import { Route, Routes } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import Landing from "./pages/Landing";
import Placeholder from "./pages/Placeholder";

// Routes other than "/" are honest placeholders until their phases are built.
const pending: [string, string][] = [
  ["livemap", "LiveMap"],
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
      <Route element={<SiteLayout />}>
        <Route index element={<Landing />} />
        {pending.map(([path, title]) => (
          <Route key={path} path={path} element={<Placeholder title={title} />} />
        ))}
        <Route path="*" element={<Placeholder title="Page not found" />} />
      </Route>
    </Routes>
  );
}
