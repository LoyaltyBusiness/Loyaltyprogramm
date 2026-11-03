import { createContext, useContext } from "react";
import type {
  CouponRedeemResult,
  CouponResult,
  EarnResult,
  GiftIssueResult,
  GiftLinkResult,
  GiftSpendResult,
  MemberResult,
  ProgramData,
  RedeemResult,
  RewardResult,
} from "./program.ts";
import type { CompanyAccount, NewAccount, ProgramPatch } from "./storage.ts";

export type SessionValue = {
  account: CompanyAccount | null;
  program: ProgramData;
  signIn: (email: string, password: string) => Promise<"ok" | "invalid">;
  signUp: (input: NewAccount) => Promise<"ok" | "taken">;
  signOut: () => void;
  saveProgram: (patch: ProgramPatch) => void;
  addMember: (name: string, email: string) => MemberResult;
  addReward: (name: string, cost: number) => RewardResult;
  earnPoints: (memberId: string, euros: number) => EarnResult;
  scanReceipt: (memberId: string, euros: number) => EarnResult;
  redeemReward: (memberId: string, rewardId: string) => RedeemResult;
  issueGift: (amount: number, memberId: string | null) => GiftIssueResult;
  spendGift: (cardId: string, amount: number) => GiftSpendResult;
  linkGift: (cardId: string, memberId: string) => GiftLinkResult;
  addCoupon: (name: string, valueEuros: number) => CouponResult;
  useCoupon: (
    couponId: string,
    memberId: string | null,
    activated: boolean,
  ) => CouponRedeemResult;
  isLeaving: () => boolean;
  finishLeaving: () => void;
};

export const SessionContext = createContext<SessionValue | null>(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
}
