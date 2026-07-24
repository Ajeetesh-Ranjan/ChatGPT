interface PillProps {
  children: React.ReactNode;
  tone?: "info" | "success" | "warn" | "danger";
}

export function Pill({ children, tone = "info" }: PillProps) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
