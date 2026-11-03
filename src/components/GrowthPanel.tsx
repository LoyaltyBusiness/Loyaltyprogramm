import { useState, type FormEvent } from "react";
import { Field } from "./Field.tsx";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";
import {
  parseAmount,
  parseCost,
  pointsForSpend,
  type CampaignSegment,
} from "../program.ts";

function fill(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
  );
}

export function GrowthPanel() {
  const { locale, copy } = useLocale();
  const { account, program, addCampaign, claimCampaign, postInvoice } = useSession();
  const text = copy.account.program;
  const numberLocale = locale === "de" ? "de-DE" : "en-GB";

  const [campaignName, setCampaignName] = useState("");
  const [segment, setSegment] = useState<CampaignSegment>("all");
  const [campaignPoints, setCampaignPoints] = useState("");
  const [campaignError, setCampaignError] = useState("");
  const [campaignSaved, setCampaignSaved] = useState(false);

  const [claimId, setClaimId] = useState("");
  const [claimMemberId, setClaimMemberId] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claimSaved, setClaimSaved] = useState(false);

  const [invoiceMemberId, setInvoiceMemberId] = useState("");
  const [invoiceEuros, setInvoiceEuros] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceSaved, setInvoiceSaved] = useState(false);

  if (!account) return null;

  const money = (value: number) =>
    value.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pointsLabel = (value: number) => value.toLocaleString(numberLocale);
  const invoiceAmount = parseAmount(invoiceEuros);
  const invoicePreview =
    invoiceAmount === null ? null : pointsForSpend(invoiceAmount, account.pointsPerEuro);

  function onAddCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCampaignSaved(false);
    const points = parseCost(campaignPoints);
    if (!campaignName.trim()) {
      setCampaignError(text.errors.name);
      return;
    }
    if (points === null) {
      setCampaignError(text.errors.points);
      return;
    }
    const result = addCampaign(campaignName, segment, points);
    if (!result.ok) {
      setCampaignError(text.errors[result.reason === "points" ? "points" : result.reason]);
      return;
    }
    setCampaignError("");
    setCampaignName("");
    setCampaignPoints("");
    setCampaignSaved(true);
  }

  function onClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClaimSaved(false);
    if (!claimId) {
      setClaimError(text.errors.campaign);
      return;
    }
    if (!claimMemberId) {
      setClaimError(text.errors.member);
      return;
    }
    const result = claimCampaign(claimId, claimMemberId);
    if (!result.ok) {
      setClaimError(text.errors[result.reason]);
      return;
    }
    setClaimError("");
    setClaimSaved(true);
  }

  function onInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInvoiceSaved(false);
    if (!invoiceMemberId) {
      setInvoiceError(text.errors.member);
      return;
    }
    const amount = parseAmount(invoiceEuros);
    if (amount === null) {
      setInvoiceError(text.errors.amount);
      return;
    }
    const result = postInvoice(invoiceMemberId, amount);
    if (!result.ok) {
      const reason = result.reason === "no-points" ? "noPoints" : result.reason;
      setInvoiceError(text.errors[reason]);
      return;
    }
    setInvoiceError("");
    setInvoiceEuros("");
    setInvoiceSaved(true);
  }

  return (
    <>
      <section className="card stack-card">
        <h2>{text.campaignTitle}</h2>
        <p className="lead">{text.campaignText}</p>
        <form onSubmit={onAddCampaign} noValidate>
          <Field
            id="campaign-name"
            label={text.campaignName}
            error={campaignError === text.errors.name ? campaignError : undefined}
          >
            <input
              id="campaign-name"
              value={campaignName}
              maxLength={80}
              onChange={(event) => setCampaignName(event.target.value)}
              required
            />
          </Field>
          <div className="pair">
            <Field id="campaign-segment" label={text.campaignSegment}>
              <select
                id="campaign-segment"
                value={segment}
                onChange={(event) => setSegment(event.target.value as CampaignSegment)}
              >
                <option value="all">{text.segments.all}</option>
                <option value="new">{text.segments.new}</option>
                <option value="silver">{text.segments.silver}</option>
                <option value="gold">{text.segments.gold}</option>
              </select>
            </Field>
            <Field
              id="campaign-points"
              label={text.campaignPoints}
              error={
                campaignError && campaignError !== text.errors.name ? campaignError : undefined
              }
            >
              <input
                id="campaign-points"
                type="number"
                min={0.01}
                step={0.01}
                value={campaignPoints}
                onChange={(event) => setCampaignPoints(event.target.value)}
                required
              />
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.addCampaign}
            </button>
            {campaignSaved ? (
              <p className="saved" role="status">
                {text.campaignAdded}
              </p>
            ) : null}
          </div>
        </form>

        {program.campaigns.length === 0 ? (
          <p className="empty">{text.noCampaigns}</p>
        ) : (
          <ul className="roster">
            {program.campaigns.map((campaign) => (
              <li key={campaign.id}>
                <span>
                  <strong>{campaign.name}</strong>
                  <span className="muted"> · {text.segments[campaign.segment]}</span>
                </span>
                <span className="balance">
                  {pointsLabel(campaign.bonusPoints)} {account.pointsName} ·{" "}
                  {fill(text.campaignClaims, { count: String(campaign.claims.length) })}
                </span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onClaim} noValidate>
          <div className="pair">
            <Field
              id="claim-campaign"
              label={text.campaign}
              error={claimError === text.errors.campaign ? claimError : undefined}
            >
              <select
                id="claim-campaign"
                value={claimId}
                onChange={(event) => setClaimId(event.target.value)}
                required
              >
                <option value="">{text.chooseCampaign}</option>
                {program.campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} · {pointsLabel(campaign.bonusPoints)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="claim-member"
              label={text.member}
              error={claimError && claimError !== text.errors.campaign ? claimError : undefined}
            >
              <select
                id="claim-member"
                value={claimMemberId}
                onChange={(event) => setClaimMemberId(event.target.value)}
                required
              >
                <option value="">{text.chooseMember}</option>
                {program.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.claimCampaign}
            </button>
            {claimSaved ? (
              <p className="saved" role="status">
                {text.campaignClaimed}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="card stack-card">
        <h2>{text.invoiceTitle}</h2>
        <p className="lead">{text.invoiceText}</p>
        <form onSubmit={onInvoice} noValidate>
          <div className="pair">
            <Field
              id="invoice-member"
              label={text.member}
              error={invoiceError === text.errors.member ? invoiceError : undefined}
            >
              <select
                id="invoice-member"
                value={invoiceMemberId}
                onChange={(event) => setInvoiceMemberId(event.target.value)}
                required
              >
                <option value="">{text.chooseMember}</option>
                {program.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="invoice-euros"
              label={text.euros}
              error={
                invoiceError && invoiceError !== text.errors.member ? invoiceError : undefined
              }
            >
              <input
                id="invoice-euros"
                type="number"
                min={0.01}
                step={0.01}
                value={invoiceEuros}
                onChange={(event) => setInvoiceEuros(event.target.value)}
                required
              />
            </Field>
          </div>
          {invoicePreview !== null && invoiceAmount !== null ? (
            <p className="hint">
              {fill(text.preview, {
                euros: money(invoiceAmount),
                points: pointsLabel(invoicePreview),
                name: account.pointsName,
              })}
            </p>
          ) : null}
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.invoiceBook}
            </button>
            {invoiceSaved ? (
              <p className="saved" role="status">
                {text.invoiceBooked}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </>
  );
}
