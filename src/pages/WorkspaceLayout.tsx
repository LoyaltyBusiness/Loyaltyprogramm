import { useEffect } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { CompanyLogo } from "../components/CompanyLogo.tsx";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";

export function WorkspaceLayout() {
  const { copy } = useLocale();
  const { account, isLeaving } = useSession();
  const text = copy.account.workspace;
  const nav = text.nav;

  useEffect(() => {
    if (!account) return;
    document.title = `${account.programName} — ${copy.brand}`;
  }, [account, copy.brand]);

  if (!account) {
    if (isLeaving()) return null;
    return <Navigate to="/anmelden" replace />;
  }

  const links = [
    { to: "/workspace", end: true, label: nav.overview },
    { to: "/workspace/mitglieder", end: false, label: nav.members },
    { to: "/workspace/giftcards", end: false, label: nav.giftcards },
    { to: "/workspace/vorteile", end: false, label: nav.benefits },
    { to: "/workspace/kasse", end: false, label: nav.operations },
    { to: "/workspace/einstellungen", end: false, label: nav.settings },
  ];

  return (
    <div className="workspace">
      <header className="workspace-intro workspace-intro-compact">
        <div className="workspace-brand">
          <CompanyLogo name={account.companyName} logoUrl={account.logoUrl} size="md" />
          <div>
            <p className="eyebrow">{text.eyebrow}</p>
            <h1>{account.programName}</h1>
          </div>
        </div>
      </header>

      <nav className="workspace-nav" aria-label={text.eyebrow}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              isActive ? "workspace-nav-link active" : "workspace-nav-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
