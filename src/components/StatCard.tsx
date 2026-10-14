import type { Icon } from "@phosphor-icons/react";
import { cx } from "./ui";

const TONES = {
  primary: "bg-primary-50 text-primary-600",
  warning: "bg-amber-50 text-amber-600",
  success: "bg-emerald-50 text-emerald-600",
  neutral: "bg-slate-100 text-slate-600",
} as const;

export function StatCard({
  label,
  value,
  icon: StatIcon,
  tone = "primary",
}: {
  label: string;
  value: number;
  icon: Icon;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <span
        className={cx(
          "flex size-12 shrink-0 items-center justify-center rounded-xl",
          TONES[tone],
        )}
      >
        <StatIcon weight="duotone" className="size-6" />
      </span>
      <div>
        <p className="text-3xl font-extrabold tabular-nums text-slate-900">
          {value}
        </p>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
}
