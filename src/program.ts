import { normalizeEmail } from "./storage.ts";

export type Member = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  points: number;
  createdAt: string;
};

export type Reward = {
  id: string;
  companyId: string;
  name: string;
  cost: number;
  createdAt: string;
};

export type GiftCard = {
  id: string;
  companyId: string;
  code: string;
  balance: number;
  initialValue: number;
  memberId: string | null;
  memberName: string | null;
  createdAt: string;
};

export type Coupon = {
  id: string;
  companyId: string;
  name: string;
  valueEuros: number;
  uses: number;
  createdAt: string;
};

export type LedgerEntry = {
  id: string;
  companyId: string;
  memberId: string;
  memberName: string;
  kind: "earn" | "redeem" | "receipt" | "gift-issue" | "gift-redeem" | "gift-link" | "coupon";
  points: number;
  euros?: number;
  rewardName?: string;
  giftCode?: string;
  couponName?: string;
  createdAt: string;
};

export type ProgramData = {
  members: Member[];
  rewards: Reward[];
  giftCards: GiftCard[];
  coupons: Coupon[];
  entries: LedgerEntry[];
};

export type MemberResult =
  | { ok: true; program: ProgramData }
  | { ok: false; reason: "name" | "email" | "taken" };

export type RewardResult =
  | { ok: true; program: ProgramData }
  | { ok: false; reason: "name" | "cost" };

export type EarnResult =
  | { ok: true; program: ProgramData; points: number }
  | { ok: false; reason: "member" | "amount" | "no-points" };

export type RedeemResult =
  | { ok: true; program: ProgramData }
  | { ok: false; reason: "member" | "reward" | "too-few-points" };

export type GiftIssueResult =
  | { ok: true; program: ProgramData; card: GiftCard }
  | { ok: false; reason: "amount" | "member" };

export type GiftSpendResult =
  | { ok: true; program: ProgramData }
  | { ok: false; reason: "card" | "amount" | "too-few" };

export type GiftLinkResult =
  | { ok: true; program: ProgramData }
  | { ok: false; reason: "card" | "member" | "linked" };

export type CouponResult =
  | { ok: true; program: ProgramData }
  | { ok: false; reason: "name" | "amount" };

export type CouponRedeemResult =
  | { ok: true; program: ProgramData }
  | { ok: false; reason: "coupon" | "member" | "inactive" };

const PROGRAM_KEY = "kafteji.program";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Store = ProgramData;

export function emptyProgram(): ProgramData {
  return { members: [], rewards: [], giftCards: [], coupons: [], entries: [] };
}

export function parseAmount(value: string): number | null {
  const amount = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) return null;
  return roundPoints(amount);
}

export function parseCost(value: string): number | null {
  const amount = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return null;
  return roundPoints(amount);
}

export function pointsForSpend(euros: number, pointsPerEuro: number): number | null {
  if (!Number.isFinite(euros) || !Number.isFinite(pointsPerEuro) || pointsPerEuro <= 0) {
    return null;
  }
  const points = roundPoints(euros * pointsPerEuro);
  return points > 0 ? points : null;
}

export function openGiftBalance(program: ProgramData) {
  return roundPoints(program.giftCards.reduce((sum, card) => sum + card.balance, 0));
}

function roundPoints(value: number) {
  return Math.round(value * 100) / 100;
}

function giftCode() {
  const chunk = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `KF-${chunk}`;
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(PROGRAM_KEY);
    if (!raw) return emptyProgram();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyProgram();
    const record = parsed as Partial<Store>;
    return {
      members: Array.isArray(record.members) ? record.members : [],
      rewards: Array.isArray(record.rewards) ? record.rewards : [],
      giftCards: Array.isArray(record.giftCards) ? record.giftCards : [],
      coupons: Array.isArray(record.coupons) ? record.coupons : [],
      entries: Array.isArray(record.entries) ? record.entries : [],
    };
  } catch {
    return emptyProgram();
  }
}

function writeStore(store: Store) {
  localStorage.setItem(PROGRAM_KEY, JSON.stringify(store));
}

export function readProgram(companyId: string): ProgramData {
  const store = readStore();
  return {
    members: store.members.filter((member) => member.companyId === companyId),
    rewards: store.rewards.filter((reward) => reward.companyId === companyId),
    giftCards: store.giftCards.filter((card) => card.companyId === companyId),
    coupons: store.coupons.filter((coupon) => coupon.companyId === companyId),
    entries: store.entries.filter((entry) => entry.companyId === companyId),
  };
}

export function createMember(companyId: string, name: string, email: string): MemberResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: "name" };
  const normalized = normalizeEmail(email);
  if (!EMAIL.test(normalized)) return { ok: false, reason: "email" };

  const store = readStore();
  const taken = store.members.some(
    (member) => member.companyId === companyId && member.email === normalized,
  );
  if (taken) return { ok: false, reason: "taken" };

  store.members.push({
    id: crypto.randomUUID(),
    companyId,
    name: trimmed,
    email: normalized,
    points: 0,
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId) };
}

export function createReward(companyId: string, name: string, cost: number): RewardResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: "name" };
  if (!Number.isFinite(cost) || cost <= 0 || cost > 1_000_000) {
    return { ok: false, reason: "cost" };
  }

  const store = readStore();
  store.rewards.push({
    id: crypto.randomUUID(),
    companyId,
    name: trimmed,
    cost: roundPoints(cost),
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId) };
}

export function postEarn(
  companyId: string,
  memberId: string,
  euros: number,
  pointsPerEuro: number,
  kind: "earn" | "receipt" = "earn",
): EarnResult {
  if (!Number.isFinite(euros) || euros <= 0 || euros > 100000) {
    return { ok: false, reason: "amount" };
  }
  const points = pointsForSpend(euros, pointsPerEuro);
  if (points === null) return { ok: false, reason: "no-points" };

  const store = readStore();
  const member = store.members.find(
    (item) => item.id === memberId && item.companyId === companyId,
  );
  if (!member) return { ok: false, reason: "member" };

  member.points = roundPoints(member.points + points);
  store.entries.push({
    id: crypto.randomUUID(),
    companyId,
    memberId: member.id,
    memberName: member.name,
    kind,
    points,
    euros: roundPoints(euros),
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId), points };
}

export function postRedeem(companyId: string, memberId: string, rewardId: string): RedeemResult {
  const store = readStore();
  const member = store.members.find(
    (item) => item.id === memberId && item.companyId === companyId,
  );
  const reward = store.rewards.find(
    (item) => item.id === rewardId && item.companyId === companyId,
  );
  if (!member) return { ok: false, reason: "member" };
  if (!reward) return { ok: false, reason: "reward" };
  if (member.points + 1e-9 < reward.cost) return { ok: false, reason: "too-few-points" };

  member.points = roundPoints(member.points - reward.cost);
  store.entries.push({
    id: crypto.randomUUID(),
    companyId,
    memberId: member.id,
    memberName: member.name,
    kind: "redeem",
    points: reward.cost,
    rewardName: reward.name,
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId) };
}

export function issueGiftCard(
  companyId: string,
  amount: number,
  memberId: string | null,
): GiftIssueResult {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return { ok: false, reason: "amount" };
  }

  const store = readStore();
  let memberName: string | null = null;
  if (memberId) {
    const member = store.members.find(
      (item) => item.id === memberId && item.companyId === companyId,
    );
    if (!member) return { ok: false, reason: "member" };
    memberName = member.name;
  }

  const value = roundPoints(amount);
  const card: GiftCard = {
    id: crypto.randomUUID(),
    companyId,
    code: giftCode(),
    balance: value,
    initialValue: value,
    memberId,
    memberName,
    createdAt: new Date().toISOString(),
  };
  store.giftCards.push(card);
  store.entries.push({
    id: crypto.randomUUID(),
    companyId,
    memberId: memberId ?? "",
    memberName: memberName ?? card.code,
    kind: "gift-issue",
    points: 0,
    euros: value,
    giftCode: card.code,
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId), card };
}

export function spendGiftCard(
  companyId: string,
  cardId: string,
  amount: number,
): GiftSpendResult {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return { ok: false, reason: "amount" };
  }

  const store = readStore();
  const card = store.giftCards.find((item) => item.id === cardId && item.companyId === companyId);
  if (!card) return { ok: false, reason: "card" };
  const spend = roundPoints(amount);
  if (card.balance + 1e-9 < spend) return { ok: false, reason: "too-few" };

  card.balance = roundPoints(card.balance - spend);
  store.entries.push({
    id: crypto.randomUUID(),
    companyId,
    memberId: card.memberId ?? "",
    memberName: card.memberName ?? card.code,
    kind: "gift-redeem",
    points: 0,
    euros: spend,
    giftCode: card.code,
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId) };
}

export function linkGiftCard(
  companyId: string,
  cardId: string,
  memberId: string,
): GiftLinkResult {
  const store = readStore();
  const card = store.giftCards.find((item) => item.id === cardId && item.companyId === companyId);
  const member = store.members.find(
    (item) => item.id === memberId && item.companyId === companyId,
  );
  if (!card) return { ok: false, reason: "card" };
  if (!member) return { ok: false, reason: "member" };
  if (card.memberId) return { ok: false, reason: "linked" };

  card.memberId = member.id;
  card.memberName = member.name;
  store.entries.push({
    id: crypto.randomUUID(),
    companyId,
    memberId: member.id,
    memberName: member.name,
    kind: "gift-link",
    points: 0,
    euros: card.balance,
    giftCode: card.code,
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId) };
}

export function createCoupon(
  companyId: string,
  name: string,
  valueEuros: number,
): CouponResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: "name" };
  if (!Number.isFinite(valueEuros) || valueEuros <= 0 || valueEuros > 100000) {
    return { ok: false, reason: "amount" };
  }

  const store = readStore();
  store.coupons.push({
    id: crypto.randomUUID(),
    companyId,
    name: trimmed,
    valueEuros: roundPoints(valueEuros),
    uses: 0,
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId) };
}

export function redeemCoupon(
  companyId: string,
  couponId: string,
  memberId: string | null,
  activated: boolean,
): CouponRedeemResult {
  if (!activated) return { ok: false, reason: "inactive" };

  const store = readStore();
  const coupon = store.coupons.find(
    (item) => item.id === couponId && item.companyId === companyId,
  );
  if (!coupon) return { ok: false, reason: "coupon" };

  let memberName = "Kasse";
  let resolvedMemberId = "";
  if (memberId) {
    const member = store.members.find(
      (item) => item.id === memberId && item.companyId === companyId,
    );
    if (!member) return { ok: false, reason: "member" };
    memberName = member.name;
    resolvedMemberId = member.id;
  }

  coupon.uses += 1;
  store.entries.push({
    id: crypto.randomUUID(),
    companyId,
    memberId: resolvedMemberId,
    memberName,
    kind: "coupon",
    points: 0,
    euros: coupon.valueEuros,
    couponName: coupon.name,
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId) };
}
