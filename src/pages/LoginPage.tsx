import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Field } from "../components/Field.tsx";
import { useLocale } from "../useLocale.ts";
import { useSession } from "../useSession.ts";

export function LoginPage() {
  const { copy } = useLocale();
  const { account, signIn } = useSession();
  const navigate = useNavigate();
  const text = copy.account.login;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.title = `${text.title} — ${copy.brand}`;
  }, [text.title, copy.brand]);

  if (account) return <Navigate to="/workspace" replace />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const result = await signIn(email, password);
    setPending(false);
    if (result === "invalid") {
      setError(text.error);
      document.getElementById("login-email")?.focus();
      return;
    }
    navigate("/workspace");
  }

  return (
    <div className="split narrow">
      <div className="lede">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className="lead">{text.text}</p>
      </div>
      <form className="card" onSubmit={onSubmit} noValidate>
        {error ? (
          <p className="form-banner" role="alert">
            {error}
          </p>
        ) : null}
        <Field id="login-email" label={text.email}>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            value={email}
            aria-invalid={error ? true : undefined}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field id="login-password" label={text.password}>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={error ? true : undefined}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <div className="form-actions">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? text.submitting : text.submit}
          </button>
          <p className="switch">
            {text.noAccount} <Link to="/registrieren">{text.signUp}</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
