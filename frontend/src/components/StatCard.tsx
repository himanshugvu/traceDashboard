type StatCardProps = {
  label: string;
  value: string;
  tone: "neutral" | "accent" | "warm";
};

export function StatCard({ label, value, tone }: StatCardProps) {
  return (
    <article className={`stat-card stat-card-${tone}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
    </article>
  );
}
