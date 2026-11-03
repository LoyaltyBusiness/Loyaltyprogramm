import { Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell.tsx";
import { BrandAppPage } from "./pages/BrandAppPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { WorkspaceBenefitsPage } from "./pages/WorkspaceBenefitsPage.tsx";
import { WorkspaceGiftcardsPage } from "./pages/WorkspaceGiftcardsPage.tsx";
import { WorkspaceLayout } from "./pages/WorkspaceLayout.tsx";
import { WorkspaceMembersPage } from "./pages/WorkspaceMembersPage.tsx";
import { WorkspaceOperationsPage } from "./pages/WorkspaceOperationsPage.tsx";
import { WorkspaceOverviewPage } from "./pages/WorkspaceOverviewPage.tsx";
import { WorkspaceSettingsPage } from "./pages/WorkspaceSettingsPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="registrieren" element={<RegisterPage />} />
        <Route path="anmelden" element={<LoginPage />} />
        <Route path="workspace" element={<WorkspaceLayout />}>
          <Route index element={<WorkspaceOverviewPage />} />
          <Route path="mitglieder" element={<WorkspaceMembersPage />} />
          <Route path="giftcards" element={<WorkspaceGiftcardsPage />} />
          <Route path="vorteile" element={<WorkspaceBenefitsPage />} />
          <Route path="kasse" element={<WorkspaceOperationsPage />} />
          <Route path="einstellungen" element={<WorkspaceSettingsPage />} />
        </Route>
        <Route path="app-vorschau" element={<BrandAppPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
