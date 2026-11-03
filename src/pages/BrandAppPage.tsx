import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CompanyLogo } from "../components/CompanyLogo.tsx";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";
import { memberStatus } from "../program.ts";

function fill(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

export function BrandAppPage() {
  const { locale, copy } = useLocale();
  const { account, program, isLeaving } = useSession();
  const text = copy.account.appPreview;
  const programText = copy.account.program;
  const [pickedId, setPickedId] = useState("");

  useEffect(() => {
    document.title = `${text.eyebrow} — ${copy.brand}`;
  }, [copy.brand, text.eyebrow]);

  if (!account) {
    if (isLeaving()) return null;
    return <Navigate to="/anmelden" replace />;
  }

  const numberLocale = locale === "de" ? "de-DE" : "en-GB";
  const money = (value: number) =>
    value.toLocaleString(numberLocale, { style: "currency", currency: "EUR" });
  const memberId =
    pickedId && program.members.some((item) => item.id === pickedId)
      ? pickedId
      : (program.members[0]?.id ?? "");
  const member = program.members.find((item) => item.id === memberId) ?? null;
  const status = member ? memberStatus(member) : "classic";
  const statusLabel =
    status === "gold"
      ? programText.statusGold
      : status === "silver"
        ? programText.statusSilver
        : programText.statusClassic;
  const linkedGift =
    member == null
      ? null
      : (program.giftCards.find(
          (card) => card.memberId === member.id && card.balance > 0,
        ) ?? null);
  const memberEvents =
    member == null
      ? []
      : program.entries
          .filter((entry) => entry.memberId === member.id && entry.kind === "event")
          .slice(-3)
          .reverse();

  return (
    <div className="workspace app-preview premium-preview">
      <header className="workspace-intro">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className="lead">{text.text}</p>
        <Link className="btn btn-ghost" to="/workspace">
          {text.back}
        </Link>
      </header>

      {program.members.length === 0 ? (
        <p className="empty">{text.empty}</p>
      ) : (
        <>
          <label className="field app-pick">
            <span>{text.pick}</span>
            <select value={memberId} onChange={(event) => setPickedId(event.target.value)}>
              {program.members.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          {member ? (
            <div className="phone-frame premium-phone" aria-label={text.cardLabel}>
              <div className="phone-notch" />
              <div className="phone-brand-row">
                <CompanyLogo
                  name={account.companyName}
                  logoUrl={account.logoUrl}
                  size="md"
                />
                <p className="phone-brand">{account.programName}</p>
              </div>
              <article className={`quiet-card tone-${status}`}>
                <p className="quiet-label">{text.cardLabel}</p>
                <h2>{member.name}</h2>
                <p className="quiet-status">
                  {fill(text.statusLine, { status: statusLabel })}
                </p>
                <div className="quiet-row">
                  <div>
                    <span>{text.points}</span>
                    <strong>
                      {member.points.toLocaleString(numberLocale)} {account.pointsName}
                    </strong>
                  </div>
                  <div>
                    <span>{text.lifetime}</span>
                    <strong>{member.lifetimePoints.toLocaleString(numberLocale)}</strong>
                  </div>
                </div>
                <div className="quiet-gift">
                  <span>{text.gift}</span>
                  <strong>
                    {linkedGift ? money(linkedGift.balance) : text.noGift}
                  </strong>
                  {linkedGift ? <em>{linkedGift.code}</em> : null}
                </div>
              </article>
              <section className="phone-offers quiet-offers">
                <h3>{text.events}</h3>
                {memberEvents.length === 0 ? (
                  <p className="muted">{text.noEvents}</p>
                ) : (
                  <ul>
                    {memberEvents.map((entry) => (
                      <li key={entry.id}>
                        <strong>{entry.eventName}</strong>
                        <span>
                          +{entry.points.toLocaleString(numberLocale)} {account.pointsName}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
