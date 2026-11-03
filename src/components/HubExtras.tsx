import { useState, type FormEvent } from "react";
import { Field } from "./Field.tsx";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";
import { parseAmount, pointsForSpend } from "../program.ts";

function fill(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
  );
}

export function HubExtras() {
  const { locale, copy } = useLocale();
  const {
    account,
    program,
    scanReceipt,
    issueGift,
    spendGift,
    linkGift,
    addCoupon,
    applyCoupon,
  } = useSession();
  const text = copy.account.program;
  const numberLocale = locale === "de" ? "de-DE" : "en-GB";

  const [receiptMemberId, setReceiptMemberId] = useState("");
  const [receiptEuros, setReceiptEuros] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [receiptSaved, setReceiptSaved] = useState(false);

  const [giftAmount, setGiftAmount] = useState("");
  const [giftMemberId, setGiftMemberId] = useState("");
  const [giftError, setGiftError] = useState("");
  const [giftSaved, setGiftSaved] = useState(false);
  const [lastCode, setLastCode] = useState("");

  const [spendCardId, setSpendCardId] = useState("");
  const [spendAmount, setSpendAmount] = useState("");
  const [spendError, setSpendError] = useState("");
  const [spendSaved, setSpendSaved] = useState(false);

  const [linkCardId, setLinkCardId] = useState("");
  const [linkMemberId, setLinkMemberId] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkSaved, setLinkSaved] = useState(false);

  const [couponName, setCouponName] = useState("");
  const [couponValue, setCouponValue] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSaved, setCouponSaved] = useState(false);

  const [useCouponId, setUseCouponId] = useState("");
  const [useMemberId, setUseMemberId] = useState("");
  const [activated, setActivated] = useState(false);
  const [useError, setUseError] = useState("");
  const [useSaved, setUseSaved] = useState(false);

  if (!account) return null;

  const money = (value: number) =>
    value.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pointsLabel = (value: number) => value.toLocaleString(numberLocale);
  const openCards = program.giftCards.filter((card) => card.balance > 0);
  const unlinkedCards = program.giftCards.filter((card) => !card.memberId && card.balance > 0);
  const receiptAmount = parseAmount(receiptEuros);
  const receiptPreview =
    receiptAmount === null ? null : pointsForSpend(receiptAmount, account.pointsPerEuro);

  function onReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReceiptSaved(false);
    if (!receiptMemberId) {
      setReceiptError(text.errors.member);
      return;
    }
    const amount = parseAmount(receiptEuros);
    if (amount === null) {
      setReceiptError(text.errors.amount);
      return;
    }
    const result = scanReceipt(receiptMemberId, amount);
    if (!result.ok) {
      const reason = result.reason === "no-points" ? "noPoints" : result.reason;
      setReceiptError(text.errors[reason]);
      return;
    }
    setReceiptError("");
    setReceiptEuros("");
    setReceiptSaved(true);
  }

  function onIssueGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGiftSaved(false);
    const amount = parseAmount(giftAmount);
    if (amount === null) {
      setGiftError(text.errors.amount);
      return;
    }
    const result = issueGift(amount, giftMemberId || null);
    if (!result.ok) {
      setGiftError(text.errors[result.reason === "member" ? "member" : "amount"]);
      return;
    }
    setGiftError("");
    setGiftAmount("");
    setLastCode(result.card.code);
    setGiftSaved(true);
  }

  function onSpendGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSpendSaved(false);
    if (!spendCardId) {
      setSpendError(text.errors.card);
      return;
    }
    const amount = parseAmount(spendAmount);
    if (amount === null) {
      setSpendError(text.errors.amount);
      return;
    }
    const result = spendGift(spendCardId, amount);
    if (!result.ok) {
      const reason =
        result.reason === "too-few"
          ? "giftTooFew"
          : result.reason === "card"
            ? "card"
            : "amount";
      setSpendError(text.errors[reason]);
      return;
    }
    setSpendError("");
    setSpendAmount("");
    setSpendSaved(true);
  }

  function onLinkGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLinkSaved(false);
    if (!linkCardId) {
      setLinkError(text.errors.card);
      return;
    }
    if (!linkMemberId) {
      setLinkError(text.errors.member);
      return;
    }
    const result = linkGift(linkCardId, linkMemberId);
    if (!result.ok) {
      const reason =
        result.reason === "linked" ? "linked" : result.reason === "member" ? "member" : "card";
      setLinkError(text.errors[reason]);
      return;
    }
    setLinkError("");
    setLinkSaved(true);
  }

  function onAddCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCouponSaved(false);
    const amount = parseAmount(couponValue);
    if (!couponName.trim()) {
      setCouponError(text.errors.name);
      return;
    }
    if (amount === null) {
      setCouponError(text.errors.amount);
      return;
    }
    const result = addCoupon(couponName, amount);
    if (!result.ok) {
      setCouponError(text.errors[result.reason === "name" ? "name" : "amount"]);
      return;
    }
    setCouponError("");
    setCouponName("");
    setCouponValue("");
    setCouponSaved(true);
  }

  function onUseCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUseSaved(false);
    if (!useCouponId) {
      setUseError(text.errors.coupon);
      return;
    }
    const result = applyCoupon(useCouponId, useMemberId || null, activated);
    if (!result.ok) {
      const reason =
        result.reason === "inactive"
          ? "inactive"
          : result.reason === "member"
            ? "member"
            : "coupon";
      setUseError(text.errors[reason]);
      return;
    }
    setUseError("");
    setActivated(false);
    setUseSaved(true);
  }

  return (
    <>
      <section className="card stack-card">
        <h2>{text.receiptTitle}</h2>
        <p className="lead">{text.receiptText}</p>
        <form onSubmit={onReceipt} noValidate>
          <div className="pair">
            <Field
              id="receipt-member"
              label={text.member}
              error={receiptError === text.errors.member ? receiptError : undefined}
            >
              <select
                id="receipt-member"
                value={receiptMemberId}
                aria-invalid={receiptError === text.errors.member ? true : undefined}
                onChange={(event) => setReceiptMemberId(event.target.value)}
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
              id="receipt-euros"
              label={text.euros}
              error={receiptError && receiptError !== text.errors.member ? receiptError : undefined}
            >
              <input
                id="receipt-euros"
                type="number"
                min={0.01}
                step={0.01}
                value={receiptEuros}
                aria-invalid={
                  receiptError && receiptError !== text.errors.member ? true : undefined
                }
                onChange={(event) => setReceiptEuros(event.target.value)}
                required
              />
            </Field>
          </div>
          {receiptPreview !== null && receiptAmount !== null ? (
            <p className="hint">
              {fill(text.preview, {
                euros: money(receiptAmount),
                points: pointsLabel(receiptPreview),
                name: account.pointsName,
              })}
            </p>
          ) : null}
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.receiptBook}
            </button>
            {receiptSaved ? (
              <p className="saved" role="status">
                {text.receiptBooked}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="card stack-card">
        <h2>{text.giftTitle}</h2>
        <p className="lead">{text.giftText}</p>
        <form onSubmit={onIssueGift} noValidate>
          <div className="pair">
            <Field
              id="gift-amount"
              label={text.giftAmount}
              error={giftError === text.errors.amount ? giftError : undefined}
            >
              <input
                id="gift-amount"
                type="number"
                min={0.01}
                step={0.01}
                value={giftAmount}
                aria-invalid={giftError === text.errors.amount ? true : undefined}
                onChange={(event) => setGiftAmount(event.target.value)}
                required
              />
            </Field>
            <Field
              id="gift-member"
              label={text.optionalMember}
              error={giftError === text.errors.member ? giftError : undefined}
            >
              <select
                id="gift-member"
                value={giftMemberId}
                onChange={(event) => setGiftMemberId(event.target.value)}
              >
                <option value="">{text.noneMember}</option>
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
              {text.issueGift}
            </button>
            {giftSaved ? (
              <p className="saved" role="status">
                {text.giftIssued}
                {lastCode ? ` ${lastCode}` : ""}
              </p>
            ) : null}
          </div>
        </form>

        {program.giftCards.length === 0 ? (
          <p className="empty">{text.noGifts}</p>
        ) : (
          <ul className="roster">
            {program.giftCards.map((card) => (
              <li key={card.id}>
                <span>
                  <strong>{card.code}</strong>
                  {card.memberName
                    ? fill(text.giftLinkedTo, { name: card.memberName })
                    : null}
                </span>
                <span className="balance">{money(card.balance)} €</span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onSpendGift} noValidate>
          <div className="pair">
            <Field
              id="spend-card"
              label={text.giftCard}
              error={spendError === text.errors.card ? spendError : undefined}
            >
              <select
                id="spend-card"
                value={spendCardId}
                aria-invalid={spendError === text.errors.card ? true : undefined}
                onChange={(event) => setSpendCardId(event.target.value)}
                required
              >
                <option value="">{text.chooseGift}</option>
                {openCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {fill(text.giftOpen, {
                      code: card.code,
                      balance: money(card.balance),
                    })}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="spend-amount"
              label={text.spendAmount}
              error={
                spendError && spendError !== text.errors.card ? spendError : undefined
              }
            >
              <input
                id="spend-amount"
                type="number"
                min={0.01}
                step={0.01}
                value={spendAmount}
                aria-invalid={
                  spendError && spendError !== text.errors.card ? true : undefined
                }
                onChange={(event) => setSpendAmount(event.target.value)}
                required
              />
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.spendGift}
            </button>
            {spendSaved ? (
              <p className="saved" role="status">
                {text.giftSpent}
              </p>
            ) : null}
          </div>
        </form>

        {unlinkedCards.length > 0 ? (
          <form onSubmit={onLinkGift} noValidate>
            <h3>{text.linkGift}</h3>
            <div className="pair">
              <Field
                id="link-card"
                label={text.giftCard}
                error={linkError === text.errors.card ? linkError : undefined}
              >
                <select
                  id="link-card"
                  value={linkCardId}
                  onChange={(event) => setLinkCardId(event.target.value)}
                  required
                >
                  <option value="">{text.chooseGift}</option>
                  {unlinkedCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {fill(text.giftOpen, {
                        code: card.code,
                        balance: money(card.balance),
                      })}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id="link-member"
                label={text.member}
                error={
                  linkError && linkError !== text.errors.card ? linkError : undefined
                }
              >
                <select
                  id="link-member"
                  value={linkMemberId}
                  onChange={(event) => setLinkMemberId(event.target.value)}
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
              <button className="btn secondary" type="submit">
                {text.linkGift}
              </button>
              {linkSaved ? (
                <p className="saved" role="status">
                  {text.giftLinked}
                </p>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>

      <section className="card stack-card">
        <h2>{text.couponTitle}</h2>
        <p className="lead">{text.couponText}</p>
        <form onSubmit={onAddCoupon} noValidate>
          <div className="pair">
            <Field
              id="coupon-name"
              label={text.couponName}
              error={couponError === text.errors.name ? couponError : undefined}
            >
              <input
                id="coupon-name"
                value={couponName}
                maxLength={80}
                aria-invalid={couponError === text.errors.name ? true : undefined}
                onChange={(event) => setCouponName(event.target.value)}
                required
              />
            </Field>
            <Field
              id="coupon-value"
              label={text.couponValue}
              error={couponError === text.errors.amount ? couponError : undefined}
            >
              <input
                id="coupon-value"
                type="number"
                min={0.01}
                step={0.01}
                value={couponValue}
                aria-invalid={couponError === text.errors.amount ? true : undefined}
                onChange={(event) => setCouponValue(event.target.value)}
                required
              />
            </Field>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.addCoupon}
            </button>
            {couponSaved ? (
              <p className="saved" role="status">
                {text.couponAdded}
              </p>
            ) : null}
          </div>
        </form>

        {program.coupons.length === 0 ? (
          <p className="empty">{text.noCoupons}</p>
        ) : (
          <ul className="roster">
            {program.coupons.map((coupon) => (
              <li key={coupon.id}>
                <strong>{coupon.name}</strong>
                <span className="balance">
                  {money(coupon.valueEuros)} € ·{" "}
                  {fill(text.couponUses, { count: String(coupon.uses) })}
                </span>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onUseCoupon} noValidate>
          <div className="pair">
            <Field
              id="use-coupon"
              label={text.coupon}
              error={useError === text.errors.coupon ? useError : undefined}
            >
              <select
                id="use-coupon"
                value={useCouponId}
                aria-invalid={useError === text.errors.coupon ? true : undefined}
                onChange={(event) => setUseCouponId(event.target.value)}
                required
              >
                <option value="">{text.chooseCoupon}</option>
                {program.coupons.map((coupon) => (
                  <option key={coupon.id} value={coupon.id}>
                    {coupon.name} · {money(coupon.valueEuros)} €
                  </option>
                ))}
              </select>
            </Field>
            <Field id="use-member" label={text.optionalMember}>
              <select
                id="use-member"
                value={useMemberId}
                onChange={(event) => setUseMemberId(event.target.value)}
              >
                <option value="">{text.noneMember}</option>
                {program.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <label className="activate">
            <input
              type="checkbox"
              checked={activated}
              onChange={(event) => setActivated(event.target.checked)}
            />
            <span>
              <strong>{text.activate}</strong>
              <span className="muted"> — {text.activateHint}</span>
            </span>
          </label>
          {useError === text.errors.inactive ||
          (useError && useError !== text.errors.coupon) ? (
            <p className="error" role="alert">
              {useError}
            </p>
          ) : null}
          <div className="form-actions">
            <button className="btn" type="submit">
              {text.useCoupon}
            </button>
            {useSaved ? (
              <p className="saved" role="status">
                {text.couponUsed}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </>
  );
}
