import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  ChatsCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  UserIcon,
  XIcon,
} from "@phosphor-icons/react";
import { listAllFreights, updateFreightStatus } from "../lib/api";
import type { FreightRequest, FreightStatus } from "../lib/types";
import { FREIGHT_STATUS_LABELS } from "../lib/types";
import { formatDay } from "../lib/format";
import { FreightStatusBadge } from "../components/Badge";
import { StatCard } from "../components/StatCard";
import {
  Alert,
  Button,
  ButtonSpinner,
  Card,
  DetailItem,
  ErrorNote,
  Spinner,
  queryErrorMessage,
} from "../components/ui";

const NEXT_STATUS: Partial<Record<FreightStatus, FreightStatus>> = {
  ABERTA: "EM_NEGOCIACAO",
  EM_NEGOCIACAO: "CONFIRMADA",
  CONFIRMADA: "CONCLUIDA",
};

export function AdminFreights() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["freights", "all"],
    queryFn: listAllFreights,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FreightStatus }) =>
      updateFreightStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freights"] });
    },
  });

  const stats = useMemo(() => {
    const list = data ?? [];
    return {
      abertas: list.filter((f) => f.status === "ABERTA").length,
      negociacao: list.filter((f) => f.status === "EM_NEGOCIACAO").length,
      confirmadas: list.filter((f) => f.status === "CONFIRMADA").length,
    };
  }, [data]);

  const actionsFor = (freight: FreightRequest) => {
    const next = NEXT_STATUS[freight.status];
    const busy = mutation.isPending && mutation.variables?.id === freight.id;
    const pendingStatus = busy ? mutation.variables?.status : undefined;
    const canCancel =
      freight.status === "ABERTA" ||
      freight.status === "EM_NEGOCIACAO" ||
      freight.status === "CONFIRMADA";

    return (
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {next && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => mutation.mutate({ id: freight.id, status: next })}
          >
            <span className="sr-only">Avancar para </span>
            {FREIGHT_STATUS_LABELS[next]}
            {pendingStatus === next ? (
              <ButtonSpinner />
            ) : (
              <ArrowRightIcon weight="bold" className="size-4" />
            )}
          </Button>
        )}
        {canCancel && (
          <Button
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={() =>
              mutation.mutate({ id: freight.id, status: "CANCELADA" })
            }
          >
            {pendingStatus === "CANCELADA" ? (
              <ButtonSpinner />
            ) : (
              <XIcon weight="bold" className="size-4" />
            )}
            Cancelar
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Abertas" value={stats.abertas} icon={ClockIcon} tone="warning" />
        <StatCard
          label="Em negociacao"
          value={stats.negociacao}
          icon={ChatsCircleIcon}
          tone="primary"
        />
        <StatCard
          label="Confirmadas"
          value={stats.confirmadas}
          icon={CheckCircleIcon}
          tone="success"
        />
      </div>

      {mutation.isError && (
        <Alert tone="danger" className="mt-6">
          {queryErrorMessage(mutation.error, "Nao foi possivel atualizar o pedido.")}
        </Alert>
      )}

      {isLoading ? (
        <Spinner label="Carregando solicitacoes..." />
      ) : isError ? (
        <div className="mt-6">
          <ErrorNote message={queryErrorMessage(error)} />
        </div>
      ) : !data || data.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-600">
          Nenhuma solicitacao de frete ainda.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.map((freight) => (
            <li key={freight.id}>
              <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 break-words font-semibold text-slate-900">
                      <span>{freight.origin}</span>
                      <ArrowRightIcon weight="bold" className="size-3.5 shrink-0 text-slate-400" />
                      <span className="sr-only">ate</span>
                      <span>{freight.destination}</span>
                    </p>
                    <FreightStatusBadge status={freight.status} />
                  </div>
                  <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <DetailItem icon={UserIcon} label="Cliente">
                      {freight.clientName}
                    </DetailItem>
                    <DetailItem icon={CalendarBlankIcon} label="Data desejada">
                      {formatDay(freight.scheduledDate)}
                    </DetailItem>
                    <DetailItem icon={TruckIcon} label="Prestador">
                      {freight.providerId ? (
                        <Link
                          to={`/prestador/${freight.providerId}`}
                          className="font-medium text-primary-700 underline-offset-4 hover:text-primary-800 hover:underline"
                        >
                          {freight.providerName}
                        </Link>
                      ) : (
                        "Sem prestador"
                      )}
                    </DetailItem>
                  </dl>
                  <p className="mt-2 break-words text-sm leading-relaxed text-slate-700">
                    {freight.description}
                  </p>
                </div>
                {actionsFor(freight)}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
