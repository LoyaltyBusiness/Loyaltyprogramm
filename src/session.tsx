import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  attendEvent as postEventAttend,
  claimCampaign as postCampaignClaim,
  createCampaign,
  createCoupon,
  createEvent,
  createMember,
  createReward,
  emptyProgram,
  issueGiftCard,
  linkGiftCard,
  postEarn,
  postRedeem,
  readProgram,
  redeemCoupon,
  spendGiftCard,
  type CampaignSegment,
} from "./program.ts";
import {
  accountById,
  clearSessionId,
  createAccount,
  readSessionId,
  updateProgram,
  verifyLogin,
  writeSessionId,
  type CompanyAccount,
} from "./storage.ts";
import { SessionContext } from "./useSession.ts";

function initialAccount() {
  const id = readSessionId();
  if (!id) return null;
  const account = accountById(id);
  if (!account) clearSessionId();
  return account;
}

function programFor(account: CompanyAccount | null) {
  return account ? readProgram(account.id) : emptyProgram();
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<CompanyAccount | null>(initialAccount);
  const [program, setProgram] = useState(() => programFor(initialAccount()));
  const leavingRef = useRef(false);

  const value = useMemo(
    () => ({
      account,
      program,
      async signIn(email: string, password: string) {
        const next = await verifyLogin(email, password);
        if (!next) return "invalid" as const;
        leavingRef.current = false;
        writeSessionId(next.id);
        setAccount(next);
        setProgram(readProgram(next.id));
        return "ok" as const;
      },
      async signUp(input: Parameters<typeof createAccount>[0]) {
        const result = await createAccount(input);
        if (!result.ok) return "taken" as const;
        leavingRef.current = false;
        writeSessionId(result.account.id);
        setAccount(result.account);
        setProgram(emptyProgram());
        return "ok" as const;
      },
      signOut() {
        leavingRef.current = true;
        clearSessionId();
        setAccount(null);
        setProgram(emptyProgram());
      },
      isLeaving() {
        return leavingRef.current;
      },
      finishLeaving() {
        leavingRef.current = false;
      },
      saveProgram(patch: Parameters<typeof updateProgram>[1]) {
        if (!account) return;
        const next = updateProgram(account.id, patch);
        if (next) setAccount(next);
      },
      addMember(name: string, email: string, referralFrom = "") {
        if (!account) return { ok: false as const, reason: "name" as const };
        const result = createMember(account.id, name, email, referralFrom);
        if (result.ok) setProgram(result.program);
        return result;
      },
      addReward(name: string, cost: number) {
        if (!account) return { ok: false as const, reason: "name" as const };
        const result = createReward(account.id, name, cost);
        if (result.ok) setProgram(result.program);
        return result;
      },
      earnPoints(memberId: string, euros: number) {
        if (!account) return { ok: false as const, reason: "member" as const };
        const result = postEarn(account.id, memberId, euros, account.pointsPerEuro);
        if (result.ok) setProgram(result.program);
        return result;
      },
      scanReceipt(memberId: string, euros: number) {
        if (!account) return { ok: false as const, reason: "member" as const };
        const result = postEarn(
          account.id,
          memberId,
          euros,
          account.pointsPerEuro,
          "receipt",
        );
        if (result.ok) setProgram(result.program);
        return result;
      },
      postInvoice(memberId: string, euros: number) {
        if (!account) return { ok: false as const, reason: "member" as const };
        const result = postEarn(
          account.id,
          memberId,
          euros,
          account.pointsPerEuro,
          "invoice",
        );
        if (result.ok) setProgram(result.program);
        return result;
      },
      redeemReward(memberId: string, rewardId: string) {
        if (!account) return { ok: false as const, reason: "member" as const };
        const result = postRedeem(account.id, memberId, rewardId);
        if (result.ok) setProgram(result.program);
        return result;
      },
      issueGift(amount: number, memberId: string | null) {
        if (!account) return { ok: false as const, reason: "amount" as const };
        const result = issueGiftCard(account.id, amount, memberId);
        if (result.ok) setProgram(result.program);
        return result;
      },
      spendGift(cardId: string, amount: number) {
        if (!account) return { ok: false as const, reason: "card" as const };
        const result = spendGiftCard(account.id, cardId, amount);
        if (result.ok) setProgram(result.program);
        return result;
      },
      linkGift(cardId: string, memberId: string) {
        if (!account) return { ok: false as const, reason: "card" as const };
        const result = linkGiftCard(account.id, cardId, memberId);
        if (result.ok) setProgram(result.program);
        return result;
      },
      addCoupon(name: string, valueEuros: number) {
        if (!account) return { ok: false as const, reason: "name" as const };
        const result = createCoupon(account.id, name, valueEuros);
        if (result.ok) setProgram(result.program);
        return result;
      },
      applyCoupon(couponId: string, memberId: string | null, activated: boolean) {
        if (!account) return { ok: false as const, reason: "coupon" as const };
        const result = redeemCoupon(account.id, couponId, memberId, activated);
        if (result.ok) setProgram(result.program);
        return result;
      },
      addCampaign(name: string, segment: CampaignSegment, bonusPoints: number) {
        if (!account) return { ok: false as const, reason: "name" as const };
        const result = createCampaign(account.id, name, segment, bonusPoints);
        if (result.ok) setProgram(result.program);
        return result;
      },
      claimCampaign(campaignId: string, memberId: string) {
        if (!account) return { ok: false as const, reason: "campaign" as const };
        const result = postCampaignClaim(account.id, campaignId, memberId);
        if (result.ok) setProgram(result.program);
        return result;
      },
      addEvent(name: string, points: number) {
        if (!account) return { ok: false as const, reason: "name" as const };
        const result = createEvent(account.id, name, points);
        if (result.ok) setProgram(result.program);
        return result;
      },
      attendEvent(eventId: string, memberId: string) {
        if (!account) return { ok: false as const, reason: "event" as const };
        const result = postEventAttend(account.id, eventId, memberId);
        if (result.ok) setProgram(result.program);
        return result;
      },
    }),
    [account, program],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
