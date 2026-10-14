import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  ClipboardTextIcon,
  HourglassMediumIcon,
  IdentificationCardIcon,
  NoteIcon,
  ProhibitIcon,
  SealCheckIcon,
  UsersThreeIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { listAllProviders, updateProviderStatus } from "../lib/api";
import type { Provider, ProviderStatus } from "../lib/types";
import { VEHICLE_LABELS } from "../lib/types";
import { StatusBadge } from "../components/Badge";
import { StatCard } from "../components/StatCard";
import { VehicleIcon } from "../components/VehicleIcon";
import {
  Alert,
  Button,
  ButtonSpinner,
  Card,
  ErrorNote,
  PageHeader,
  Spinner,
  cx,
  queryErrorMessage,
} from "../components/ui";
import { AdminFreights } from "./AdminFreights";

type Panel = "prestadores" | "fretes";

type Tab = "PENDENTE" | "APROVADO" | "TODOS";

const PANELS: { key: Panel; label: string; icon: Icon }[] = [
  { key: "prestadores", label: "Prestadores", icon: UsersThreeIcon },
  { key: "fretes", label: "Solicitacoes", icon: ClipboardTextIcon },
];

const TABS: { key: Tab; label: string }[] = [
  { key: "PENDENTE", label: "Pendentes" },
  { key: "APROVADO", label: "Aprovados" },
  { key: "TODOS", label: "Todos" },
];

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<Panel>("prestadores");
  const [tab, setTab] = useState<Tab>("PENDENTE");

  const { data: providers, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "providers"],
    queryFn: listAllProviders,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProviderStatus }) =>
      updateProviderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
  });

  const stats = useMemo(() => {
    const list = providers ?? [];
    return {
      total: list.length,
      pendentes: list.filter((p) => p.status === "PENDENTE").length,
      aprovados: list.filter((p) => p.status === "APROVADO").length,
    };
  }, [providers]);

  const filtered = useMemo(() => {
    const list = providers ?? [];
    if (tab === "TODOS") return list;
    return list.filter((p) => p.status === tab);
  }, [providers, tab]);

  const actionsFor = (p: Provider) => {
    const pendingId = mutation.isPending ? mutation.variables?.id : null;
    const busy = pendingId === p.id;
    // O botao clicado troca o icone pelo spinner enquanto a API responde.
    const pendingStatus = busy ? mutation.variables?.status : undefined;
    const icon = (status: ProviderStatus, StatusIcon: Icon) =>
      pendingStatus === status ? (
        <ButtonSpinner />
      ) : (
        <StatusIcon weight="bold" className="size-4" />
      );

    return (
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {p.status !== "APROVADO" && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => mutation.mutate({ id: p.id, status: "APROVADO" })}
          >
            {icon("APROVADO", CheckIcon)}
            Aprovar
          </Button>
        )}
        {p.status === "APROVADO" && (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => mutation.mutate({ id: p.id, status: "INATIVO" })}
          >
            {icon("INATIVO", ProhibitIcon)}
            Desativar
          </Button>
        )}
        {p.status !== "REJEITADO" && p.status !== "APROVADO" && (
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() => mutation.mutate({ id: p.id, status: "REJEITADO" })}
          >
            {icon("REJEITADO", XIcon)}
            Rejeitar
          </Button>
        )}
        {(p.status === "REJEITADO" || p.status === "INATIVO") && (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => mutation.mutate({ id: p.id, status: "APROVADO" })}
          >
            {icon("APROVADO", ArrowCounterClockwiseIcon)}
            Reativar
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHeader
        title="Painel da equipe"
        description={
          panel === "prestadores"
            ? "Valide a documentacao e gerencie a publicacao dos prestadores no catalogo."
            : "Acompanhe os pedidos de frete e avance o status de cada um."
        }
        actions={
          <div
            role="group"
            aria-label="Area do painel"
            className="inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-inset ring-slate-200"
          >
            {PANELS.map(({ key, label, icon: PanelIcon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={panel === key}
                onClick={() => setPanel(key)}
                className={cx(
                  "inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors duration-150",
                  panel === key
                    ? "bg-white text-primary-700 ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <PanelIcon weight={panel === key ? "fill" : "bold"} className="size-4" />
                {label}
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-8">
        {panel === "fretes" ? (
          <AdminFreights />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Total de cadastros"
                value={stats.total}
                icon={IdentificationCardIcon}
                tone="primary"
              />
              <StatCard
                label="Aguardando validacao"
                value={stats.pendentes}
                icon={HourglassMediumIcon}
                tone="warning"
              />
              <StatCard
                label="Ativos no catalogo"
                value={stats.aprovados}
                icon={SealCheckIcon}
                tone="success"
              />
            </div>

            <div
              role="group"
              aria-label="Filtrar cadastros"
              className="mt-10 flex gap-1 border-b border-slate-200"
            >
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={cx(
                    "-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors duration-150 sm:px-4",
                    tab === t.key
                      ? "border-primary-600 text-primary-700"
                      : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {mutation.isError && (
              <Alert tone="danger" className="mt-6">
                {queryErrorMessage(
                  mutation.error,
                  "Nao foi possivel atualizar o prestador.",
                )}
              </Alert>
            )}

            {isLoading ? (
              <Spinner label="Carregando cadastros..." />
            ) : isError ? (
              <div className="mt-6">
                <ErrorNote message={queryErrorMessage(error)} />
              </div>
            ) : filtered.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-600">
                Nenhum prestador nesta aba.
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                      <img
                        src={p.photoUrl}
                        alt=""
                        className="size-16 shrink-0 rounded-xl bg-slate-100 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/prestador/${p.id}`}
                            className="font-semibold text-slate-900 underline-offset-4 transition-colors duration-150 hover:text-primary-700 hover:underline"
                          >
                            {p.name}
                          </Link>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-600">
                          <VehicleIcon
                            type={p.vehicleType}
                            weight="bold"
                            className="mt-0.5 size-4 shrink-0 text-slate-500"
                          />
                          <span>
                            {VEHICLE_LABELS[p.vehicleType]} &middot;{" "}
                            {p.regions.join(", ")}
                          </span>
                        </p>
                        {p.documentNote && (
                          <p className="mt-2 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-200">
                            <NoteIcon weight="bold" className="mt-px size-4 shrink-0" />
                            <span>
                              <span className="font-semibold">Nota interna:</span>{" "}
                              {p.documentNote}
                            </span>
                          </p>
                        )}
                      </div>
                      {actionsFor(p)}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
