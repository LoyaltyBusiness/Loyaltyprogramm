import { useState, type FormEvent } from "react";
import { Field } from "./Field.tsx";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";
import {
  memberStatus,
  parseAmount,
  parseCost,
  pointsForSpend,
  SILVER_AT,
  GOLD_AT,
} from "../program.ts";

function fill(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
  );
}

export function ProgramPanel() {
  const { locale, copy } = useLocale();
  const { account, program, addMember, addReward, earnPoints, redeemReward } = useSession();
  const text = copy.account.program;
  const numberLocale = locale === "de" ? "de-DE" : "en-GB";

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [referralFrom, setReferralFrom] = useState("");
  const [memberError, setMemberError] = useState("");
  const [memberSaved, setMemberSaved] = useState(false);

  const [earnMemberId, setEarnMemberId] = useState("");
  const [euros, setEuros] = useState("");
  const [earnError, setEarnError] = useState("");
  const [earnSaved, setEarnSaved] = useState(false);

  const [rewardName, setRewardName] = useState("");
  const [rewardCost, setRewardCost] = useState("");
  const [rewardError, setRewardError] = useState("");
  const [rewardSaved, setRewardSaved] = useState(false);

  const [redeemMemberId, setRedeemMemberId] = useState("");
  const [redeemRewardId, setRedeemRewardId] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemSaved, setRedeemSaved] = useState(false);

  if (!account) return null;

  const euroAmount = parseAmount(euros);
  const previewPoints =
    euroAmount === null ? null : pointsForSpend(euroAmount, account.pointsPerEuro);
  const money = (value: number) =>
    value.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pointsLabel = (value: number) => value.toLocaleString(numberLocale);

  function onAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMemberSaved(false);
    const result = addMember(memberName, memberEmail, referralFrom);
    if (!result.ok) {
      setMemberError(text.errors[result.reason]);
      return;
    }
    setMemberError("");
    setMemberName("");
    setMemberEmail("");
    setReferralFrom("");
    setMemberSaved(true);
  }

  function statusLabel(status: ReturnType<typeof memberStatus>) {
    if (status === "gold") return text.statusGold;
    if (status === "silver") return text.statusSilver;
    return text.statusClassic;
  }

  function onEarn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEarnSaved(false);
    if (!earnMemberId) {
      setEarnError(text.errors.member);
      return;
    }
    const amount = parseAmount(euros);
    if (amount === null) {
      setEarnError(text.errors.amount);
      return;
    }
    const result = earnPoints(earnMemberId, amount);
    if (!result.ok) {
      const reason = result.reason === "no-points" ? "noPoints" : result.reason;
      setEarnError(text.errors[reason]);
      return;
    }
    setEarnError("");
    setEuros("");
    setEarnSaved(true);
  }

  function onAddReward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRewardSaved(false);
    const cost = parseCost(rewardCost);
    if (!rewardName.trim()) {
      setRewardError(text.errors.name);
      return;
    }
    if (cost === null) {
      setRewardError(text.errors.cost);
      return;
    }
    const result = addReward(rewardName, cost);
    if (!result.ok) {
      setRewardError(text.errors[result.reason]);
      return;
    }
    setRewardError("");
    setRewardName("");
    setRewardCost("");
    setRewardSaved(true);
  }

  function onRedeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRedeemSaved(false);
    if (!redeemMemberId) {
      setRedeemError(text.errors.member);
      return;
    }
    if (!redeemRewardId) {
      setRedeemError(text.errors.reward);
      return;
    }
    const result = redeemReward(redeemMemberId, redeemRewardId);
    if (!result.ok) {
      const reason = result.reason === "too-few-points" ? "tooFew" : result.reason;
      setRedeemError(text.errors[reason]);
      return;
    }
    setRedeemError("");
    setRedeemSaved(true);
  }

  return (
    <>
      <section className="card stack-card">
        <h2>{text.membersTitle}</h2>
        <p className="lead">{text.membersText}</p>
        <p className="hint">
          {fill(copy.account.workspace.statusHint, {
            silver: String(SILVER_AT),
            gold: String(GOLD_AT),
          })}
        </p>
        <form onSubmit={onAddMember} noValidate>
          <div className="pair">
            <Field id="member-name" label={text.memberName} error={memberError === text.errors.name ? memberError : undefined}>
              <input
                id="member-name"
                value={memberName}
                autoComplete="name"
                maxLength={80}
                aria-invalid={memberError === text.errors.name ? true : undefined}
                aria-describedby={memberError === text.errors.name ? "member-name-error" : undefined}
                onChange={(event) => setMemberName(event.target.value)}
                required
              />
            </Field>
            <Field
              id="member-email"
              label={text.memberEmail}
              error={
                memberError === text.errors.email || memberError === text.errors.taken
                  ? memberError
                  : undefined
              }
            >
              <input
                id="member-email"
                type="email"
                value={memberEmail}
                autoComplete="email"
                spellCheck={false}
                maxLength={120}
                aria-invalid={
                  memberError === text.errors.email || memberError === text.errors.taken
                    ? true
                    : undefined
                }
                onChange={(event) => setMemberEmail(event.target.value)}
                required
              />
            </Field>
          </div>
          <Field
            id="member-referral"
            label={text.referralCode}
            hint={text.referralHint}
            error={memberError === text.errors.referral ? memberError : undefined}
          >
            <input
              id="member-referral"
              value={referralFrom}
              spellCheck={false}
              maxLength={12}
              aria-invalid={memberError === text.errors.referral ? true : undefined}
              onChange={(event) => setReferralFrom(event.target.value)}
            />
          </Field>
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.addMember}
            </button>
            {memberSaved ? (
              <p className="saved" role="status">
                {text.memberAdded}
              </p>
            ) : null}
          </div>
        </form>
        {program.members.length === 0 ? (
          <p className="empty">{text.noMembers}</p>
        ) : (
          <ul className="roster">
            {program.members.map((member) => {
              const status = memberStatus(member);
              return (
                <li key={member.id}>
                  <span>
                    <strong>{member.name}</strong>
                    <span className="muted"> · {member.email}</span>
                    <span className={`status-pill status-${status}`}>
                      {statusLabel(status)}
                    </span>
                    <span className="muted">
                      {" "}
                      · {fill(text.yourCode, { code: member.referralCode })}
                    </span>
                  </span>
                  <span className="balance">
                    {pointsLabel(member.points)} {account.pointsName}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card stack-card">
        <h2>{text.earnTitle}</h2>
        <p className="lead">{text.earnText}</p>
        <form onSubmit={onEarn} noValidate>
          <div className="pair">
            <Field id="earn-member" label={text.member} error={earnError === text.errors.member ? earnError : undefined}>
              <select
                id="earn-member"
                value={earnMemberId}
                aria-invalid={earnError === text.errors.member ? true : undefined}
                aria-describedby={earnError === text.errors.member ? "earn-member-error" : undefined}
                onChange={(event) => setEarnMemberId(event.target.value)}
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
              id="earn-euros"
              label={text.euros}
              error={earnError && earnError !== text.errors.member ? earnError : undefined}
            >
              <input
                id="earn-euros"
                type="number"
                min={0.01}
                step={0.01}
                value={euros}
                aria-invalid={earnError && earnError !== text.errors.member ? true : undefined}
                aria-describedby={
                  previewPoints !== null
                    ? "earn-preview"
                    : earnError && earnError !== text.errors.member
                      ? "earn-euros-error"
                      : undefined
                }
                onChange={(event) => setEuros(event.target.value)}
                required
              />
            </Field>
          </div>
          {previewPoints !== null && euroAmount !== null ? (
            <p className="hint" id="earn-preview">
              {fill(text.preview, {
                euros: money(euroAmount),
                points: pointsLabel(previewPoints),
                name: account.pointsName,
              })}
            </p>
          ) : null}
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.book}
            </button>
            {earnSaved ? (
              <p className="saved" role="status">
                {text.booked}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="card stack-card">
        <h2>{text.rewardsTitle}</h2>
        <p className="lead">{text.rewardsText}</p>
        <form onSubmit={onAddReward} noValidate>
          <div className="pair">
            <Field id="reward-name" label={text.rewardName} error={rewardError === text.errors.name ? rewardError : undefined}>
              <input
                id="reward-name"
                value={rewardName}
                maxLength={80}
                aria-invalid={rewardError === text.errors.name ? true : undefined}
                aria-describedby={rewardError === text.errors.name ? "reward-name-error" : undefined}
                onChange={(event) => setRewardName(event.target.value)}
                required
              />
            </Field>
            <Field id="reward-cost" label={text.rewardCost} error={rewardError === text.errors.cost ? rewardError : undefined}>
              <input
                id="reward-cost"
                type="number"
                min={0.01}
                step={0.01}
                value={rewardCost}
                aria-invalid={rewardError === text.errors.cost ? true : undefined}
                aria-describedby={rewardError === text.errors.cost ? "reward-cost-error" : undefined}
                onChange={(event) => setRewardCost(event.target.value)}
                required
              />
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.addReward}
            </button>
            {rewardSaved ? (
              <p className="saved" role="status">
                {text.rewardAdded}
              </p>
            ) : null}
          </div>
        </form>
        {program.rewards.length === 0 ? (
          <p className="empty">{text.noRewards}</p>
        ) : (
          <ul className="roster">
            {program.rewards.map((reward) => (
              <li key={reward.id}>
                <strong>{reward.name}</strong>
                <span className="balance">
                  {pointsLabel(reward.cost)} {account.pointsName}
                </span>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={onRedeem} noValidate>
          <div className="pair">
            <Field id="redeem-member" label={text.member} error={redeemError === text.errors.member ? redeemError : undefined}>
              <select
                id="redeem-member"
                value={redeemMemberId}
                aria-invalid={redeemError === text.errors.member ? true : undefined}
                aria-describedby={redeemError === text.errors.member ? "redeem-member-error" : undefined}
                onChange={(event) => setRedeemMemberId(event.target.value)}
                required
              >
                <option value="">{text.chooseMember}</option>
                {program.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {pointsLabel(member.points)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="redeem-reward"
              label={text.reward}
              error={redeemError && redeemError !== text.errors.member ? redeemError : undefined}
            >
              <select
                id="redeem-reward"
                value={redeemRewardId}
                aria-invalid={redeemError && redeemError !== text.errors.member ? true : undefined}
                aria-describedby={
                  redeemError && redeemError !== text.errors.member ? "redeem-reward-error" : undefined
                }
                onChange={(event) => setRedeemRewardId(event.target.value)}
                required
              >
                <option value="">{text.chooseReward}</option>
                {program.rewards.map((reward) => (
                  <option key={reward.id} value={reward.id}>
                    {reward.name} · {pointsLabel(reward.cost)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.redeem}
            </button>
            {redeemSaved ? (
              <p className="saved" role="status">
                {text.redeemed}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </>
  );
}
