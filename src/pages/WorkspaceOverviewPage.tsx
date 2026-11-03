import { Link } from "react-router-dom";
import { ActivityHistory } from "../components/ActivityHistory.tsx";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";
import { openGiftBalance } from "../program.ts";

export function WorkspaceOverviewPage() {
  const { locale, copy } = useLocale();
  const { account, program } = useSession();
  const text = copy.account.workspace;
  if (!account) return null;

  const numberLocale = locale === "de" ? "de-DE" : "en-GB";
  const rule = text.ruleValue
    .replace("{points}", account.pointsPerEuro.toLocaleString(numberLocale))
    .replace("{name}", account.pointsName);
  const created = new Date(account.createdAt).toLocaleDateString(numberLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const websiteHref = /^https?:\/\//i.test(account.website)
    ? account.website
    : `https://${account.website}`;

  return (
    <>
      <p className="lead">{text.ready}</p>
      <div className="form-actions" style={{ marginTop: 8 }}>
        <Link className="btn" to="/app-vorschau">
          {text.openApp}
        </Link>
      </div>

      <section className="stats stats-four" aria-label={text.eyebrow}>
        <article>
          <p>{text.members}</p>
          <strong>{program.members.length}</strong>
        </article>
        <article>
          <p>{text.campaigns}</p>
          <strong>{program.campaigns.length}</strong>
        </article>
        <article>
          <p>{text.giftcards}</p>
          <strong>
            {openGiftBalance(program).toLocaleString(numberLocale, {
              style: "currency",
              currency: "EUR",
            })}
          </strong>
        </article>
        <article>
          <p>{text.rule}</p>
          <strong>{rule}</strong>
        </article>
      </section>

      {program.members.length === 0 ? <p className="empty">{text.empty}</p> : null}

      <section className="card facts-card">
        <h2>{text.company}</h2>
        <dl className="facts">
          <dt>{text.company}</dt>
          <dd>{account.companyName}</dd>
          <dt>{text.industry}</dt>
          <dd>{copy.account.register.industries[account.industry]}</dd>
          <dt>{text.admin}</dt>
          <dd>
            {account.adminName}
            <span className="muted"> · {account.email}</span>
          </dd>
          {account.city ? (
            <>
              <dt>{text.city}</dt>
              <dd>{account.city}</dd>
            </>
          ) : null}
          {account.website ? (
            <>
              <dt>{text.website}</dt>
              <dd>
                <a href={websiteHref} target="_blank" rel="noreferrer">
                  {account.website}
                </a>
              </dd>
            </>
          ) : null}
          <dt>{text.created}</dt>
          <dd>{created}</dd>
        </dl>
      </section>

      <ActivityHistory />
    </>
  );
}
