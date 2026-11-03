import { normalizeEmail } from "./storage.ts";

export type MemberStatus = "classic" | "silver" | "gold";
export type CampaignSegment = "all" | "new" | "silver" | "gold";

export type Member = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  points: number;
  lifetimePoints: number;
  referralCode: string;
  referredByMemberId: string | null;
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

export type Campaign = {
  id: string;
  companyId: string;
  name: string;
  segment: CampaignSegment;
  bonusPoints: number;
  claims: string[];
  createdAt: string;
};

export type LedgerEntry = {
  id: string;
  companyId: string;
  memberId: string;
  memberName: string;
  kind:
    | "earn"
    | "redeem"
    | "receipt"
    | "invoice"
    | "gift-issue"
    | "gift-redeem"
    | "gift-link"
    | "coupon"
    | "welcome"
    | "referral"
    | "campaign";
  points: number;
  euros?: number;
  rewardName?: string;
  giftCode?: string;
  couponName?: string;
  campaignName?: string;
  createdAt: string;
};

export type ProgramData = {
  members: Member[];
  rewards: Reward[];
  giftCards: GiftCard[];
  coupons: Coupon[];
  campaigns: Campaign[];
  entries: LedgerEntry[];
};

export type MemberResult =
  | { ok: true; program: ProgramData }
  | { ok: false; reason: "name" | "email" | "taken" | "referral" };

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

export type CampaignResult =
  | { ok: true; program: ProgramData }
  | { ok: false; reason: "name" | "points" | "segment" };

export type CampaignClaimResult =
  | { ok: true; program: ProgramData }
  | { ok: false; reason: "campaign" | "member" | "segment" | "claimed" };

const PROGRAM_KEY = "kafteji.program";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const WELCOME_POINTS = 10;
export const REFERRAL_BONUS = 15;
export const SILVER_AT = 50;
export const GOLD_AT = 200;
const NEW_MEMBER_DAYS = 30;

type Store = ProgramData;

export function emptyProgram(): ProgramData {
  return {
    members: [],
    rewards: [],
    giftCards: [],
    coupons: [],
    campaigns: [],
    entries: [],
  };
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

export function memberStatus(member: Member): MemberStatus {
  if (member.lifetimePoints >= GOLD_AT) return "gold";
  if (member.lifetimePoints >= SILVER_AT) return "silver";
  return "classic";
}

export function isNewMember(member: Member, now = Date.now()) {
  const created = Date.parse(member.createdAt);
  if (!Number.isFinite(created)) return false;
  return now - created <= NEW_MEMBER_DAYS * 24 * 60 * 60 * 1000;
}

export function memberMatchesSegment(member: Member, segment: CampaignSegment) {
  if (segment === "all") return true;
  if (segment === "new") return isNewMember(member);
  const status = memberStatus(member);
  if (segment === "silver") return status === "silver" || status === "gold";
  return status === "gold";
}

function roundPoints(value: number) {
  return Math.round(value * 100) / 100;
}

function giftCode() {
  const chunk = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `KF-${chunk}`;
}

function referralCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}

function normalizeMember(raw: Partial<Member> & { id: string; companyId: string }): Member {
  const points = Number(raw.points) || 0;
  return {
    id: raw.id,
    companyId: raw.companyId,
    name: raw.name ?? "",
    email: raw.email ?? "",
    points,
    lifetimePoints: Number(raw.lifetimePoints) || points,
    referralCode: raw.referralCode || referralCode(),
    referredByMemberId: raw.referredByMemberId ?? null,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function credit(
  member: Member,
  points: number,
  store: Store,
  entry: Omit<LedgerEntry, "id" | "createdAt">,
) {
  member.points = roundPoints(member.points + points);
  member.lifetimePoints = roundPoints(member.lifetimePoints + points);
  store.entries.push({
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(PROGRAM_KEY);
    if (!raw) return emptyProgram();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyProgram();
    const record = parsed as Partial<Store>;
    const members = Array.isArray(record.members)
      ? record.members.map((member) => normalizeMember(member))
      : [];
    const store: Store = {
      members,
      rewards: Array.isArray(record.rewards) ? record.rewards : [],
      giftCards: Array.isArray(record.giftCards) ? record.giftCards : [],
      coupons: Array.isArray(record.coupons) ? record.coupons : [],
      campaigns: Array.isArray(record.campaigns) ? record.campaigns : [],
      entries: Array.isArray(record.entries) ? record.entries : [],
    };
    const needsMigrate =
      Array.isArray(record.members) &&
      record.members.some(
        (member) =>
          !member ||
          typeof member !== "object" ||
          !("lifetimePoints" in member) ||
          !("referralCode" in member),
      );
    if (needsMigrate || !Array.isArray(record.campaigns)) {
      writeStore(store);
    }
    return store;
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
    campaigns: store.campaigns.filter((campaign) => campaign.companyId === companyId),
    entries: store.entries.filter((entry) => entry.companyId === companyId),
  };
}

export function createMember(
  companyId: string,
  name: string,
  email: string,
  referralFrom = "",
): MemberResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: "name" };
  const normalized = normalizeEmail(email);
  if (!EMAIL.test(normalized)) return { ok: false, reason: "email" };

  const store = readStore();
  const taken = store.members.some(
    (member) => member.companyId === companyId && member.email === normalized,
  );
  if (taken) return { ok: false, reason: "taken" };

  let referrer: Member | null = null;
  const code = referralFrom.trim().toUpperCase();
  if (code) {
    referrer =
      store.members.find(
        (member) => member.companyId === companyId && member.referralCode === code,
      ) ?? null;
    if (!referrer) return { ok: false, reason: "referral" };
  }

  const member: Member = {
    id: crypto.randomUUID(),
    companyId,
    name: trimmed,
    email: normalized,
    points: 0,
    lifetimePoints: 0,
    referralCode: referralCode(),
    referredByMemberId: referrer?.id ?? null,
    createdAt: new Date().toISOString(),
  };
  store.members.push(member);
  credit(member, WELCOME_POINTS, store, {
    companyId,
    memberId: member.id,
    memberName: member.name,
    kind: "welcome",
    points: WELCOME_POINTS,
  });
  if (referrer) {
    credit(referrer, REFERRAL_BONUS, store, {
      companyId,
      memberId: referrer.id,
      memberName: referrer.name,
      kind: "referral",
      points: REFERRAL_BONUS,
    });
  }
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
  kind: "earn" | "receipt" | "invoice" = "earn",
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

  credit(member, points, store, {
    companyId,
    memberId: member.id,
    memberName: member.name,
    kind,
    points,
    euros: roundPoints(euros),
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

export function createCampaign(
  companyId: string,
  name: string,
  segment: CampaignSegment,
  bonusPoints: number,
): CampaignResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: "name" };
  if (!["all", "new", "silver", "gold"].includes(segment)) {
    return { ok: false, reason: "segment" };
  }
  if (!Number.isFinite(bonusPoints) || bonusPoints <= 0 || bonusPoints > 1_000_000) {
    return { ok: false, reason: "points" };
  }

  const store = readStore();
  store.campaigns.push({
    id: crypto.randomUUID(),
    companyId,
    name: trimmed,
    segment,
    bonusPoints: roundPoints(bonusPoints),
    claims: [],
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId) };
}

export function claimCampaign(
  companyId: string,
  campaignId: string,
  memberId: string,
): CampaignClaimResult {
  const store = readStore();
  const campaign = store.campaigns.find(
    (item) => item.id === campaignId && item.companyId === companyId,
  );
  const member = store.members.find(
    (item) => item.id === memberId && item.companyId === companyId,
  );
  if (!campaign) return { ok: false, reason: "campaign" };
  if (!member) return { ok: false, reason: "member" };
  if (campaign.claims.includes(member.id)) return { ok: false, reason: "claimed" };
  if (!memberMatchesSegment(member, campaign.segment)) {
    return { ok: false, reason: "segment" };
  }

  campaign.claims.push(member.id);
  credit(member, campaign.bonusPoints, store, {
    companyId,
    memberId: member.id,
    memberName: member.name,
    kind: "campaign",
    points: campaign.bonusPoints,
    campaignName: campaign.name,
  });
  writeStore(store);
  return { ok: true, program: readProgram(companyId) };
}
