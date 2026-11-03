export type Industry = "retail" | "b2b";

export type CompanyAccount = {
  id: string;
  companyName: string;
  industry: Industry;
  city: string;
  website: string;
  logoUrl: string;
  programName: string;
  pointsName: string;
  pointsPerEuro: number;
  adminName: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

export type NewAccount = {
  companyName: string;
  industry: Industry;
  city: string;
  website: string;
  programName: string;
  pointsName: string;
  pointsPerEuro: number;
  adminName: string;
  email: string;
  password: string;
};

export type ProgramPatch = {
  programName: string;
  pointsName: string;
  pointsPerEuro: number;
};

const ACCOUNTS_KEY = "kafteji.accounts";
const SESSION_KEY = "kafteji.session";

export function parsePoints(value: string): number | null {
  const amount = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000) return null;
  return Math.round(amount * 100) / 100;
}

export function isValidWebsite(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Domain from a website field, e.g. kustermann.de */
export function websiteHostname(website: string): string | null {
  const trimmed = website.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const host = new URL(withProtocol).hostname.replace(/^www\./i, "");
    return host.includes(".") ? host : null;
  } catch {
    return null;
  }
}

/**
 * Logo URL derived from the company website (public icon lookup).
 * Works when the firm registers with e.g. kustermann.de — not from the name alone.
 */
export function logoUrlForWebsite(website: string): string {
  const host = websiteHostname(website);
  if (!host) return "";
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
}

function normalizeAccount(raw: CompanyAccount): CompanyAccount {
  const website = raw.website ?? "";
  return {
    ...raw,
    website,
    logoUrl: raw.logoUrl || logoUrlForWebsite(website),
  };
}

function readAll(): CompanyAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as CompanyAccount[]).map(normalizeAccount)
      : [];
  } catch {
    return [];
  }
}

function writeAll(accounts: CompanyAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function findByEmail(email: string) {
  const normalized = normalizeEmail(email);
  return readAll().find((account) => account.email === normalized);
}

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function createAccount(
  input: NewAccount,
): Promise<{ ok: true; account: CompanyAccount } | { ok: false; reason: "taken" }> {
  if (findByEmail(input.email)) return { ok: false, reason: "taken" };

  const salt = crypto.randomUUID();
  const website = input.website.trim();
  const account: CompanyAccount = {
    id: crypto.randomUUID(),
    companyName: input.companyName.trim(),
    industry: input.industry,
    city: input.city.trim(),
    website,
    logoUrl: logoUrlForWebsite(website),
    programName: input.programName.trim(),
    pointsName: input.pointsName.trim(),
    pointsPerEuro: input.pointsPerEuro,
    adminName: input.adminName.trim(),
    email: normalizeEmail(input.email),
    passwordHash: await hashPassword(input.password, salt),
    salt,
    createdAt: new Date().toISOString(),
  };

  writeAll([...readAll(), account]);
  return { ok: true, account };
}

export async function verifyLogin(email: string, password: string) {
  const account = findByEmail(email);
  const salt = account?.salt ?? "kafteji-demo";
  const hash = await hashPassword(password, salt);
  if (!account || hash !== account.passwordHash) return null;
  return account;
}

export function updateProgram(id: string, patch: ProgramPatch) {
  const next = readAll().map((account) =>
    account.id === id
      ? {
          ...account,
          programName: patch.programName.trim(),
          pointsName: patch.pointsName.trim(),
          pointsPerEuro: patch.pointsPerEuro,
        }
      : account,
  );
  writeAll(next);
  return next.find((account) => account.id === id) ?? null;
}

export function readSessionId() {
  return localStorage.getItem(SESSION_KEY);
}

export function writeSessionId(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearSessionId() {
  localStorage.removeItem(SESSION_KEY);
}

export function accountById(id: string) {
  return readAll().find((account) => account.id === id) ?? null;
}
