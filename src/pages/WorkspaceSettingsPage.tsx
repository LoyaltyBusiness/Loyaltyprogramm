import { useState, type FormEvent } from "react";
import { Field } from "../components/Field.tsx";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";
import { parsePoints } from "../storage.ts";

export function WorkspaceSettingsPage() {
  const { copy } = useLocale();
  const { account, saveProgram } = useSession();
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

  if (!account) return null;

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
    <form className="card stack-card" onSubmit={onSubmit} noValidate>
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
            aria-describedby={errors.pointsName ? "edit-points-name-error" : undefined}
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
  );
}
