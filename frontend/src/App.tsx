import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";
import SiteLayout from "./layouts/SiteLayout";
import ManagementLayout from "./modules/management/ManagementLayout";
import { FacilitiesPage, ImportsPage, IndicatorsPage, OverviewPage, ProgrammesPage, TeamPage } from "./modules/management/pages";
import { RegisterPage, SignInPage } from "./pages/AuthPages";
import { EducationPage, MedConnectPage } from "./pages/ComingSoon";
import { MethodologyPage, PrivacyPage, TermsPage } from "./pages/InfoPages";
import Placeholder from "./pages/Placeholder";

// The public landing page is vanilla (see /landing). LiveMap is full-screen and lazy-loaded
// (it pulls in MapLibre); every other page shares SiteLayout.
const LiveMapPage = lazy(() => import("./modules/livemap/LiveMapPage"));

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="livemap" element={<Suspense fallback={<p role="status" className="p-8 text-slate-400">Loading LiveMap…</p>}><LiveMapPage /></Suspense>} />
        <Route element={<SiteLayout />}>
          <Route path="signin" element={<SignInPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="management" element={<RequireAuth><ManagementLayout /></RequireAuth>}>
            <Route index element={<OverviewPage />} />
            <Route path="facilities" element={<FacilitiesPage />} />
            <Route path="imports" element={<ImportsPage />} />
            <Route path="indicators" element={<IndicatorsPage />} />
            <Route path="programmes" element={<ProgrammesPage />} />
            <Route path="team" element={<TeamPage />} />
          </Route>
          <Route path="medconnect" element={<MedConnectPage />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="methodology" element={<MethodologyPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
