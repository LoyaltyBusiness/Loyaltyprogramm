import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";
import { memberMatchesSegment, memberStatus } from "../program.ts";

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
  const offers = member
    ? program.campaigns.filter((campaign) => memberMatchesSegment(member, campaign.segment))
    : [];

  return (
    <div className="workspace app-preview">
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
            <div className="phone-frame" aria-label={text.cardLabel}>
              <div className="phone-notch" />
              <p className="phone-brand">{account.programName}</p>
              <article className={`virtual-card status-${status}`}>
                <p className="eyebrow">{text.cardLabel}</p>
                <h2>{member.name}</h2>
                <p className={`status-pill status-${status}`}>{statusLabel}</p>
                <dl className="phone-stats">
                  <div>
                    <dt>{text.points}</dt>
                    <dd>
                      {member.points.toLocaleString(numberLocale)} {account.pointsName}
                    </dd>
                  </div>
                  <div>
                    <dt>{text.lifetime}</dt>
                    <dd>{member.lifetimePoints.toLocaleString(numberLocale)}</dd>
                  </div>
                  <div>
                    <dt>{text.referral}</dt>
                    <dd>{member.referralCode}</dd>
                  </div>
                </dl>
              </article>
              <section className="phone-offers">
                <h3>{text.offers}</h3>
                {offers.length === 0 ? (
                  <p className="muted">{text.noOffers}</p>
                ) : (
                  <ul>
                    {offers.map((campaign) => (
                      <li key={campaign.id}>
                        <strong>{campaign.name}</strong>
                        <span>
                          +{campaign.bonusPoints.toLocaleString(numberLocale)}{" "}
                          {account.pointsName}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {program.coupons.length > 0 ? (
                  <ul>
                    {program.coupons.map((coupon) => (
                      <li key={coupon.id}>
                        <strong>{coupon.name}</strong>
                        <span>
                          −
                          {coupon.valueEuros.toLocaleString(numberLocale, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          €
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
