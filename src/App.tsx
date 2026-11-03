import { Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { BrandAppPage } from "./pages/BrandAppPage.tsx";
import { WorkspacePage } from "./pages/WorkspacePage.tsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="registrieren" element={<RegisterPage />} />
        <Route path="anmelden" element={<LoginPage />} />
        <Route path="workspace" element={<WorkspacePage />} />
        <Route path="app-vorschau" element={<BrandAppPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
