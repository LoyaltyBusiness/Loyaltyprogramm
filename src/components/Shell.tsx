import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";

export function Shell() {
  const { locale, setLocale, copy } = useLocale();
  const { account, signOut, finishLeaving } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === "/") finishLeaving();
  }, [pathname, finishLeaving]);

  function onSignOut() {
    signOut();
    navigate("/");
  }

  return (
    <div className="shell">
      <header className="header wrap">
        <Link className="brand" to="/">
          {copy.brand}
        </Link>
        <div className="header-actions">
          <div className="lang" role="group" aria-label={locale === "de" ? "Sprache" : "Language"}>
            <button
              type="button"
              aria-pressed={locale === "de"}
              onClick={() => setLocale("de")}
            >
              {copy.lang.de}
            </button>
            <button
              type="button"
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
            >
              {copy.lang.en}
            </button>
          </div>
          {account ? (
            <>
              <Link className="chip" to="/workspace">
                {account.companyName}
              </Link>
              <Link className="btn btn-ghost" to="/app-vorschau">
                {copy.account.nav.brandApp}
              </Link>
              <button type="button" className="btn btn-ghost" onClick={onSignOut}>
                {copy.account.nav.signOut}
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/anmelden">
                {copy.account.nav.signIn}
              </Link>
              <Link className="btn" to="/registrieren">
                {copy.account.nav.signUp}
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="wrap">
        <Outlet />
      </main>
      <footer className="footer wrap">
        <span>{copy.hosted}</span>
        <span>{copy.account.localNote}</span>
      </footer>
    </div>
  );
}
