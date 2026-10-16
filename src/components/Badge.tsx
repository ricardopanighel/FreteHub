import type { ReactNode } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  ArrowsLeftRightIcon,
  TruckIcon,
  UserFocusIcon,
  HourglassMediumIcon,
  ProhibitIcon,
  SealCheckIcon,
  XCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { FreightStatus, ProviderStatus, ProviderType } from "../lib/types";
import { FREIGHT_STATUS_LABELS, STATUS_LABELS } from "../lib/types";
import { cx } from "./ui";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  primary: "bg-primary-50 text-primary-700 ring-primary-200",
  accent: "bg-accent-50 text-accent-700 ring-accent-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
};

export function Badge({
  children,
  tone = "neutral",
  icon: BadgeIcon,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: Icon;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {BadgeIcon && <BadgeIcon weight="bold" className="size-3.5 shrink-0" />}
      {children}
    </span>
  );
}

// Cada status tem cor e icone proprios, para nao depender so da cor.
const FREIGHT_STATUS: Record<FreightStatus, { tone: BadgeTone; icon: Icon }> = {
  PENDENTE: { tone: "warning", icon: ClockIcon },
  CONTRAPROPOSTA: { tone: "primary", icon: ArrowsLeftRightIcon },
  ACEITO: { tone: "success", icon: CheckCircleIcon },
  RECUSADO: { tone: "danger", icon: XCircleIcon },
  EXPIRADO: { tone: "neutral", icon: HourglassMediumIcon },
  EM_ANDAMENTO: { tone: "primary", icon: TruckIcon },
  CONCLUIDO: { tone: "success", icon: SealCheckIcon },
  CANCELADO: { tone: "neutral", icon: ProhibitIcon },
};

const PROVIDER_STATUS: Record<ProviderStatus, { tone: BadgeTone; icon: Icon }> = {
  PENDENTE: { tone: "warning", icon: HourglassMediumIcon },
  APROVADO: { tone: "success", icon: SealCheckIcon },
  REJEITADO: { tone: "danger", icon: XCircleIcon },
  INATIVO: { tone: "neutral", icon: ProhibitIcon },
};

export function FreightStatusBadge({ status }: { status: FreightStatus }) {
  const { tone, icon } = FREIGHT_STATUS[status];
  return (
    <Badge tone={tone} icon={icon}>
      {FREIGHT_STATUS_LABELS[status]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: ProviderStatus }) {
  const { tone, icon } = PROVIDER_STATUS[status];
  return (
    <Badge tone={tone} icon={icon}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function ProviderTypeBadge({ type }: { type: ProviderType }) {
  return type === "INTERNO" ? (
    <Badge tone="primary" icon={CheckCircleIcon}>Contratar no App</Badge>
  ) : (
    <Badge tone="neutral" icon={UserFocusIcon}>Contato Direto</Badge>
  );
}

// Selo exibido nos perfis publicados (status APROVADO).
export function VerifiedBadge() {
  return (
    <Badge tone="success" icon={SealCheckIcon}>
      Validado pela equipe
    </Badge>
  );
}
