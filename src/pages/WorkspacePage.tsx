import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Field } from "../components/Field.tsx";
import { ProgramPanel } from "../components/ProgramPanel.tsx";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";
import { parsePoints } from "../storage.ts";

export function WorkspacePage() {
  const { locale, copy } = useLocale();
  const { account, program, saveProgram, isLeaving } = useSession();
  const text = copy.account.workspace;
  const [programName, setProgramName] = useState(account?.programName ?? "");
  const [pointsName, setPointsName] = useState(account?.pointsName ?? "");
  const [pointsPerEuro, setPointsPerEuro] = useState(
    account ? String(account.pointsPerEuro) : "1",
  );
  const [errors, setErrors] = useState<{
    programName?: string;
    pointsName?: string;
    points?: string;
  }>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!account) return;
    document.title = `${account.programName} — ${copy.brand}`;
  }, [account, copy.brand]);

  if (!account) {
    if (isLeaving()) return null;
    return <Navigate to="/anmelden" replace />;
  }

  const numberLocale = locale === "de" ? "de-DE" : "en-GB";
  const created = new Date(account.createdAt).toLocaleDateString(numberLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const rule = text.ruleValue
    .replace("{points}", account.pointsPerEuro.toLocaleString(numberLocale))
    .replace("{name}", account.pointsName);
  const websiteHref = /^https?:\/\//i.test(account.website)
    ? account.website
    : `https://${account.website}`;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    const points = parsePoints(pointsPerEuro);
    if (!programName.trim()) next.programName = copy.account.register.errors.programName;
    if (!pointsName.trim()) next.pointsName = copy.account.register.errors.pointsName;
    if (points === null) next.points = copy.account.register.errors.points;
    setErrors(next);
    setSaved(false);
    if (Object.keys(next).length > 0 || points === null) return;
    const nextProgram = programName.trim();
    const nextPointsName = pointsName.trim();
    saveProgram({
      programName: nextProgram,
      pointsName: nextPointsName,
      pointsPerEuro: points,
    });
    setProgramName(nextProgram);
    setPointsName(nextPointsName);
    setPointsPerEuro(String(points));
    setSaved(true);
  }

  return (
    <div className="workspace">
      <header className="workspace-intro">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{account.programName}</h1>
        <p className="lead">{text.ready}</p>
      </header>

      <section className="stats" aria-label={text.eyebrow}>
        <article>
          <p>{text.members}</p>
          <strong>{program.members.length}</strong>
        </article>
        <article>
          <p>{text.campaigns}</p>
          <strong>0</strong>
        </article>
        <article>
          <p>{text.rule}</p>
          <strong>{rule}</strong>
        </article>
      </section>

      {program.members.length === 0 ? <p className="empty">{text.empty}</p> : null}

      <ProgramPanel />

      <section className="card facts-card">
        <h2>{text.company}</h2>
        <dl className="facts">
          <dt>{text.company}</dt>
          <dd>{account.companyName}</dd>
          <dt>{text.industry}</dt>
          <dd>{copy.account.register.industries[account.industry]}</dd>
          <dt>{text.admin}</dt>
          <dd>
            {account.adminName}
            <span className="muted"> · {account.email}</span>
          </dd>
          {account.city ? (
            <>
              <dt>{text.city}</dt>
              <dd>{account.city}</dd>
            </>
          ) : null}
          {account.website ? (
            <>
              <dt>{text.website}</dt>
              <dd>
                <a href={websiteHref} target="_blank" rel="noreferrer">
                  {account.website}
                </a>
              </dd>
            </>
          ) : null}
          <dt>{text.created}</dt>
          <dd>{created}</dd>
        </dl>
      </section>

      <form className="card" onSubmit={onSubmit} noValidate>
        <h2>{text.editTitle}</h2>
        <p className="lead">{text.editText}</p>
        <Field id="edit-program" label={text.programName} error={errors.programName}>
          <input
            id="edit-program"
            value={programName}
            aria-invalid={errors.programName ? true : undefined}
            aria-describedby={errors.programName ? "edit-program-error" : undefined}
            onChange={(event) => setProgramName(event.target.value)}
            required
            maxLength={80}
          />
        </Field>
        <div className="pair">
          <Field id="edit-points-name" label={text.pointsName} error={errors.pointsName}>
            <input
              id="edit-points-name"
              value={pointsName}
              aria-invalid={errors.pointsName ? true : undefined}
              aria-describedby={
                errors.pointsName ? "edit-points-name-error" : undefined
              }
              onChange={(event) => setPointsName(event.target.value)}
              required
              maxLength={40}
            />
          </Field>
          <Field id="edit-points" label={text.pointsPerEuro} error={errors.points}>
            <input
              id="edit-points"
              type="number"
              min={0.01}
              max={1000}
              step={0.01}
              value={pointsPerEuro}
              aria-invalid={errors.points ? true : undefined}
              aria-describedby={errors.points ? "edit-points-error" : undefined}
              onChange={(event) => setPointsPerEuro(event.target.value)}
              required
            />
          </Field>
        </div>
        <div className="form-actions">
          <button className="btn" type="submit">
            {text.save}
          </button>
          {saved ? (
            <p className="saved" role="status">
              {text.saved}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
