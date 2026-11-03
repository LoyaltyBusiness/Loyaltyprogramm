import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Field } from "../components/Field.tsx";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";
import { isValidWebsite, parsePoints, type Industry } from "../storage.ts";

type FormState = {
  companyName: string;
  industry: Industry;
  city: string;
  website: string;
  programName: string;
  pointsName: string;
  pointsPerEuro: string;
  adminName: string;
  email: string;
  password: string;
  confirm: string;
  consent: boolean;
};

type ErrorKey =
  | "companyName"
  | "adminName"
  | "email"
  | "password"
  | "confirm"
  | "points"
  | "programName"
  | "pointsName"
  | "consent"
  | "website";

function suggestedProgramName(companyName: string) {
  const trimmed = companyName
    .trim()
    .replace(/\s+(gmbh|ag|kg|ug|se|inc|ltd|llc|corp|co\.?)$/i, "");
  return trimmed ? `${trimmed} Club` : "";
}

const FIELD_IDS: Record<ErrorKey, string> = {
  companyName: "company-name",
  adminName: "admin-name",
  email: "email",
  password: "password",
  confirm: "confirm",
  points: "points-per-euro",
  programName: "program-name",
  pointsName: "points-name",
  consent: "consent",
  website: "website",
};

export function RegisterPage() {
  const { locale, copy } = useLocale();
  const { account, signUp } = useSession();
  const navigate = useNavigate();
  const text = copy.account.register;
  const [programTouched, setProgramTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [form, setForm] = useState<FormState>({
    companyName: "",
    industry: "retail",
    city: "",
    website: "",
    programName: "",
    pointsName: locale === "de" ? "Punkte" : "Points",
    pointsPerEuro: "1",
    adminName: "",
    email: "",
    password: "",
    confirm: "",
    consent: false,
  });

  useEffect(() => {
    document.title = `${text.title} — ${copy.brand}`;
  }, [text.title, copy.brand]);

  if (account) return <Navigate to="/workspace" replace />;

  function describedBy(id: string, error?: string, hint?: string) {
    if (error) return `${id}-error`;
    if (hint) return `${id}-hint`;
    return undefined;
  }

  function clearError(key: ErrorKey) {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function onCompanyName(companyName: string) {
    clearError("companyName");
    setForm((current) => ({
      ...current,
      companyName,
      programName: programTouched
        ? current.programName
        : suggestedProgramName(companyName),
    }));
    if (!programTouched) clearError("programName");
  }

  function validate(current: FormState) {
    const next: Partial<Record<ErrorKey, string>> = {};
    if (!current.companyName.trim()) next.companyName = text.errors.companyName;
    if (!current.programName.trim()) next.programName = text.errors.programName;
    if (!current.pointsName.trim()) next.pointsName = text.errors.pointsName;
    if (parsePoints(current.pointsPerEuro) === null) next.points = text.errors.points;
    if (!isValidWebsite(current.website)) next.website = text.errors.website;
    if (!current.adminName.trim()) next.adminName = text.errors.adminName;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.email.trim())) {
      next.email = text.errors.email;
    }
    if (current.password.length < 8) next.password = text.errors.password;
    if (current.password !== current.confirm) next.confirm = text.errors.confirm;
    if (!current.consent) next.consent = text.errors.consent;
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const first = (Object.keys(nextErrors) as ErrorKey[])[0];
    if (first) {
      document.getElementById(FIELD_IDS[first])?.focus();
      return;
    }

    const pointsPerEuro = parsePoints(form.pointsPerEuro);
    if (pointsPerEuro === null) return;

    setPending(true);
    const result = await signUp({
      companyName: form.companyName,
      industry: form.industry,
      city: form.city,
      website: form.website,
      programName: form.programName,
      pointsName: form.pointsName,
      pointsPerEuro,
      adminName: form.adminName,
      email: form.email,
      password: form.password,
    });
    setPending(false);

    if (result === "taken") {
      setErrors({ email: text.errors.emailTaken });
      document.getElementById("email")?.focus();
      return;
    }

    navigate("/workspace");
  }

  return (
    <div className="split">
      <div className="lede">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className="lead">{text.text}</p>
      </div>
      <form className="card" onSubmit={onSubmit} noValidate>
        {Object.keys(errors).length > 0 ? (
          <p className="form-banner" role="alert">
            {text.errorSummary}
          </p>
        ) : null}

        <fieldset>
          <legend>{text.company}</legend>
          <Field id="company-name" label={text.companyName} error={errors.companyName}>
            <input
              id="company-name"
              name="organization"
              autoComplete="organization"
              value={form.companyName}
              aria-invalid={errors.companyName ? true : undefined}
              aria-describedby={describedBy("company-name", errors.companyName)}
              onChange={(event) => onCompanyName(event.target.value)}
              required
              maxLength={80}
            />
          </Field>
          <div className="field">
            <span id="industry-label">{text.industry}</span>
            <div className="segment" role="radiogroup" aria-labelledby="industry-label">
              {(["retail", "b2b"] as const).map((industry) => (
                <label key={industry}>
                  <input
                    type="radio"
                    name="industry"
                    value={industry}
                    checked={form.industry === industry}
                    onChange={() => setForm((current) => ({ ...current, industry }))}
                  />
                  {text.industries[industry]}
                </label>
              ))}
            </div>
          </div>
          <div className="pair">
            <Field id="city" label={text.city} hint={text.optional}>
              <input
                id="city"
                name="city"
                autoComplete="address-level2"
                value={form.city}
                aria-describedby="city-hint"
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
                maxLength={60}
              />
            </Field>
            <Field id="website" label={text.website} hint={text.optional} error={errors.website}>
              <input
                id="website"
                name="website"
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                value={form.website}
                aria-invalid={errors.website ? true : undefined}
                aria-describedby={describedBy("website", errors.website, text.optional)}
                onChange={(event) => {
                  clearError("website");
                  setForm((current) => ({ ...current, website: event.target.value }));
                }}
                maxLength={120}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>{text.program}</legend>
          <Field id="program-name" label={text.programName} error={errors.programName}>
            <input
              id="program-name"
              name="program"
              value={form.programName}
              aria-invalid={errors.programName ? true : undefined}
              aria-describedby={describedBy("program-name", errors.programName)}
              onChange={(event) => {
                setProgramTouched(true);
                clearError("programName");
                setForm((current) => ({
                  ...current,
                  programName: event.target.value,
                }));
              }}
              required
              maxLength={80}
            />
          </Field>
          <div className="pair">
            <Field id="points-name" label={text.pointsName} error={errors.pointsName}>
              <input
                id="points-name"
                name="points-name"
                value={form.pointsName}
                aria-invalid={errors.pointsName ? true : undefined}
                aria-describedby={describedBy("points-name", errors.pointsName)}
                onChange={(event) => {
                  clearError("pointsName");
                  setForm((current) => ({
                    ...current,
                    pointsName: event.target.value,
                  }));
                }}
                required
                maxLength={40}
              />
            </Field>
            <Field
              id="points-per-euro"
              label={text.pointsPerEuro}
              error={errors.points}
            >
              <input
                id="points-per-euro"
                name="points-per-euro"
                type="number"
                min={0.01}
                max={1000}
                step={0.01}
                value={form.pointsPerEuro}
                aria-invalid={errors.points ? true : undefined}
                aria-describedby={describedBy("points-per-euro", errors.points)}
                onChange={(event) => {
                  clearError("points");
                  setForm((current) => ({
                    ...current,
                    pointsPerEuro: event.target.value,
                  }));
                }}
                required
              />
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend>{text.admin}</legend>
          <Field id="admin-name" label={text.adminName} error={errors.adminName}>
            <input
              id="admin-name"
              name="name"
              autoComplete="name"
              value={form.adminName}
              aria-invalid={errors.adminName ? true : undefined}
              aria-describedby={describedBy("admin-name", errors.adminName)}
              onChange={(event) => {
                clearError("adminName");
                setForm((current) => ({ ...current, adminName: event.target.value }));
              }}
              required
              maxLength={80}
            />
          </Field>
          <Field id="email" label={text.email} error={errors.email}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
              value={form.email}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy("email", errors.email)}
              onChange={(event) => {
                clearError("email");
                setForm((current) => ({ ...current, email: event.target.value }));
              }}
              required
              maxLength={120}
            />
          </Field>
          <div className="pair">
            <Field
              id="password"
              label={text.password}
              hint={text.passwordHint}
              error={errors.password}
            >
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={describedBy("password", errors.password, text.passwordHint)}
                onChange={(event) => {
                  clearError("password");
                  setForm((current) => ({ ...current, password: event.target.value }));
                }}
                required
                minLength={8}
                maxLength={72}
              />
            </Field>
            <Field id="confirm" label={text.confirm} error={errors.confirm}>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                aria-invalid={errors.confirm ? true : undefined}
                aria-describedby={describedBy("confirm", errors.confirm)}
                onChange={(event) => {
                  clearError("confirm");
                  setForm((current) => ({ ...current, confirm: event.target.value }));
                }}
                required
                minLength={8}
                maxLength={72}
              />
            </Field>
          </div>
        </fieldset>

        <div className="check">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            checked={form.consent}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            onChange={(event) => {
              clearError("consent");
              setForm((current) => ({ ...current, consent: event.target.checked }));
            }}
            required
          />
          <label htmlFor="consent">{text.consent}</label>
        </div>
        {errors.consent ? (
          <p className="error" id="consent-error">
            {errors.consent}
          </p>
        ) : null}

        <div className="form-actions">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? text.submitting : text.submit}
          </button>
          <p className="switch">
            {text.hasAccount} <Link to="/anmelden">{text.signIn}</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
