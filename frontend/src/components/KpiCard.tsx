type KpiIconKind =
  | "total"
  | "success"
  | "failure"
  | "rate"
  | "apps"
  | "apis"
  | "received"
  | "external"
  | "latency";

type KpiCardProps = {
  label: string;
  value: string;
  subvalue?: string;
  tone?: "default" | "danger";
  icon: KpiIconKind;
};

function KpiIcon({ kind, tone = "default" }: { kind: KpiIconKind; tone?: "default" | "danger" }) {
  const stroke = tone === "danger" ? "var(--danger)" : "var(--icon-color)";

  if (kind === "success") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke={stroke} strokeWidth="1.8" />
        <path d="M8.4 12.1 10.8 14.6 15.9 9.5" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "failure") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.2 20 18.5H4z" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 9v4.9" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="16.8" r="1" fill={stroke} />
      </svg>
    );
  }

  if (kind === "rate") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.2 17.2 16.8 7.1" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8" cy="8" r="2.4" fill="none" stroke={stroke} strokeWidth="1.8" />
        <circle cx="16" cy="16" r="2.4" fill="none" stroke={stroke} strokeWidth="1.8" />
      </svg>
    );
  }

  if (kind === "apps") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4.5" y="4.5" width="6.2" height="6.2" rx="1.2" fill="none" stroke={stroke} strokeWidth="1.8" />
        <rect x="13.3" y="4.5" width="6.2" height="6.2" rx="1.2" fill="none" stroke={stroke} strokeWidth="1.8" />
        <rect x="4.5" y="13.3" width="6.2" height="6.2" rx="1.2" fill="none" stroke={stroke} strokeWidth="1.8" />
        <rect x="13.3" y="13.3" width="6.2" height="6.2" rx="1.2" fill="none" stroke={stroke} strokeWidth="1.8" />
      </svg>
    );
  }

  if (kind === "apis") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6.5" cy="12" r="2.2" fill="none" stroke={stroke} strokeWidth="1.8" />
        <circle cx="17.5" cy="6.8" r="2.2" fill="none" stroke={stroke} strokeWidth="1.8" />
        <circle cx="17.5" cy="17.2" r="2.2" fill="none" stroke={stroke} strokeWidth="1.8" />
        <path d="M8.7 11.1 15.2 7.7M8.7 12.9l6.5 3.4" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "received") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.2 6.3 8.1 16.4" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M18.2 13.6v4.1h-4.1" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "external") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 17 17.1 6.9" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12.9 6.9H17v4.1" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "latency") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="13" r="7.5" fill="none" stroke={stroke} strokeWidth="1.8" />
        <path d="M12 13V9.1M9.3 3.8h5.4" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        <path d="m12 13 3 2.2" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.2 7.2h11.6M6.2 12h11.6M6.2 16.8h11.6" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function KpiCard({ label, value, subvalue, tone = "default", icon }: KpiCardProps) {
  const className = `kpi-card kpi-card-${icon}${tone === "danger" ? " danger" : ""}`;
  return (
    <article className={className}>
      <div className="kpi-card-head">
        <span>{label}</span>
        <div className={tone === "danger" ? "kpi-icon danger" : "kpi-icon"}>
          <KpiIcon kind={icon} tone={tone} />
        </div>
      </div>
      <strong>{value}</strong>
      {subvalue ? <small>{subvalue}</small> : null}
    </article>
  );
}
