import { useState } from "react";

type CompanyLogoProps = {
  name: string;
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
};

export function CompanyLogo({ name, logoUrl = "", size = "sm" }: CompanyLogoProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "K";

  if (!logoUrl || failed) {
    return (
      <span className={`company-logo company-logo-${size} company-logo-fallback`} aria-hidden>
        {initial}
      </span>
    );
  }

  return (
    <img
      className={`company-logo company-logo-${size}`}
      src={logoUrl}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}
