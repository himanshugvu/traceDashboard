import { useEffect, useState } from "react";

type PayloadPanelProps = {
  eyebrow?: string;
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

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

export function PayloadPanel({ eyebrow, title, value, className }: PayloadPanelProps) {
  const [copied, setCopied] = useState(false);
  const formattedPayload = formatPayload(value);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    try {
      await copyText(formattedPayload);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className={className ? `payload-panel ${className}` : "payload-panel"}>
      <div className="payload-header">
        <div className="payload-header-copy">
          {eyebrow ? <p>{eyebrow}</p> : null}
          <h4>{title}</h4>
        </div>
        <button className={copied ? "payload-copy-button copied" : "payload-copy-button"} type="button" onClick={handleCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>{formattedPayload}</pre>
    </section>
  );
}
