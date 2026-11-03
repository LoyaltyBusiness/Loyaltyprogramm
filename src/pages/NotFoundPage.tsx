import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../useLocale.ts";

export function NotFoundPage() {
  const { copy } = useLocale();

  useEffect(() => {
    document.title = `${copy.notFound.title} — ${copy.brand}`;
  }, [copy.notFound.title, copy.brand]);

  return (
    <section className="hero">
      <h1>{copy.notFound.title}</h1>
      <p className="lead">{copy.notFound.text}</p>
      <div className="actions">
        <Link className="btn" to="/">
          {copy.notFound.cta}
        </Link>
      </div>
    </section>
  );
}
