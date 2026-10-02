import type { FreightStatus, ProviderStatus } from "../lib/types";
import { FREIGHT_STATUS_LABELS, STATUS_LABELS } from "../lib/types";

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "brand" | "green" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    brand: "bg-brand-50 text-brand-700 ring-brand-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function FreightStatusBadge({ status }: { status: FreightStatus }) {
  const tone =
    status === "CONCLUIDA" || status === "CONFIRMADA"
      ? "green"
      : status === "EM_NEGOCIACAO"
        ? "brand"
        : status === "ABERTA"
          ? "amber"
          : status === "CANCELADA"
            ? "red"
            : "slate";
  return <Badge tone={tone}>{FREIGHT_STATUS_LABELS[status]}</Badge>;
}

export function StatusBadge({ status }: { status: ProviderStatus }) {
  const tone =
    status === "APROVADO"
      ? "green"
      : status === "PENDENTE"
        ? "amber"
        : status === "REJEITADO"
          ? "red"
          : "slate";
  return <Badge tone={tone}>{STATUS_LABELS[status]}</Badge>;
}
