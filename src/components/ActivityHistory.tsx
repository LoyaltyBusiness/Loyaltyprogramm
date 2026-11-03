import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";

function fill(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
  );
}

export function ActivityHistory() {
  const { locale, copy } = useLocale();
  const { account, program } = useSession();
  const text = copy.account.program;
  if (!account) return null;

  const pointsName = account.pointsName;
  const numberLocale = locale === "de" ? "de-DE" : "en-GB";
  const money = (value: number) =>
    value.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pointsLabel = (value: number) => value.toLocaleString(numberLocale);
  const history = [...program.entries].reverse().slice(0, 12);
  if (history.length === 0) return null;

  function line(entry: (typeof history)[number]) {
    switch (entry.kind) {
      case "earn":
        return fill(text.earnLine, {
          name: entry.memberName,
          points: pointsLabel(entry.points),
          unit: pointsName,
          euros: money(entry.euros ?? 0),
        });
      case "receipt":
        return fill(text.receiptLine, {
          name: entry.memberName,
          points: pointsLabel(entry.points),
          unit: pointsName,
          euros: money(entry.euros ?? 0),
        });
      case "redeem":
        return fill(text.redeemLine, {
          name: entry.memberName,
          reward: entry.rewardName ?? "",
          points: pointsLabel(entry.points),
          unit: pointsName,
        });
      case "gift-issue":
        return fill(text.giftIssueLine, {
          code: entry.giftCode ?? "",
          euros: money(entry.euros ?? 0),
        });
      case "gift-redeem":
        return fill(text.giftSpendLine, {
          code: entry.giftCode ?? "",
          euros: money(entry.euros ?? 0),
        });
      case "gift-link":
        return fill(text.giftLinkLine, {
          code: entry.giftCode ?? "",
          name: entry.memberName,
        });
      case "coupon":
        return fill(text.couponLine, {
          coupon: entry.couponName ?? "",
          euros: money(entry.euros ?? 0),
          name: entry.memberName,
        });
      case "welcome":
        return fill(text.welcomeLine, {
          name: entry.memberName,
          points: pointsLabel(entry.points),
          unit: pointsName,
        });
      case "referral":
        return fill(text.referralLine, {
          name: entry.memberName,
          points: pointsLabel(entry.points),
          unit: pointsName,
        });
      case "campaign":
        return fill(text.campaignLine, {
          name: entry.memberName,
          points: pointsLabel(entry.points),
          unit: pointsName,
          campaign: entry.campaignName ?? "",
        });
      case "invoice":
        return fill(text.invoiceLine, {
          name: entry.memberName,
          points: pointsLabel(entry.points),
          unit: pointsName,
          euros: money(entry.euros ?? 0),
        });
      case "event":
        return fill(text.eventLine, {
          name: entry.memberName,
          points: pointsLabel(entry.points),
          unit: pointsName,
          event: entry.eventName ?? "",
        });
      default:
        return entry.memberName;
    }
  }

  return (
    <section className="card stack-card">
      <h2>{text.history}</h2>
      <ul className="roster">
        {history.map((entry) => (
          <li key={entry.id}>
            <span>{line(entry)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
