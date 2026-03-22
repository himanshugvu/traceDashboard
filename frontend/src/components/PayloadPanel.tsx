type PayloadPanelProps = {
  title: string;
  value: string | null | undefined;
  className?: string;
};

function formatPayload(value: string | null | undefined) {
  if (!value || !value.trim()) {
    return "No data available.";
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export function PayloadPanel({ title, value, className }: PayloadPanelProps) {
  return (
    <section className={className ? `payload-panel ${className}` : "payload-panel"}>
      <div className="payload-header">
        <h4>{title}</h4>
      </div>
      <pre>{formatPayload(value)}</pre>
    </section>
  );
}
