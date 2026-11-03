import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";

export function HomePage() {
  const { copy } = useLocale();
  const { account } = useSession();
  const home = copy.account.home;

  useEffect(() => {
    document.title = copy.meta.title;
  }, [copy.meta.title]);

  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">{home.eyebrow}</p>
        <h1>{home.title}</h1>
        <p className="lead">{home.text}</p>
        {account ? (
          <p className="signed-in">
            {home.signedIn.replace("{company}", account.companyName)}
          </p>
        ) : null}
        <div className="actions">
          {account ? (
            <Link className="btn" to="/workspace">
              {home.openWorkspace}
            </Link>
          ) : (
            <>
              <Link className="btn" to="/registrieren">
                {home.primary}
              </Link>
              <Link className="btn btn-ghost" to="/anmelden">
                {home.secondary}
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="steps" aria-labelledby="steps-title">
        <h2 id="steps-title">{home.stepsTitle}</h2>
        <ol>
          {home.steps.map((step, index) => (
            <li key={step.title}>
              <span>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
