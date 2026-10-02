import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAllFreights, updateFreightStatus } from "../lib/api";
import type { FreightRequest, FreightStatus } from "../lib/types";
import { FREIGHT_STATUS_LABELS } from "../lib/types";
import { FreightStatusBadge } from "../components/Badge";
import { Button, ErrorNote, Spinner, queryErrorMessage } from "../components/ui";

const NEXT_STATUS: Partial<Record<FreightStatus, FreightStatus>> = {
  ABERTA: "EM_NEGOCIACAO",
  EM_NEGOCIACAO: "CONFIRMADA",
  CONFIRMADA: "CONCLUIDA",
};

function formatDay(value: string): string {
  const day = value.slice(0, 10);
  const [year, month, date] = day.split("-");
  if (!year || !month || !date) return value;
  return `${date}/${month}/${year}`;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="text-3xl font-extrabold text-slate-900">{value}</span>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

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
    const canCancel =
      freight.status === "ABERTA" ||
      freight.status === "EM_NEGOCIACAO" ||
      freight.status === "CONFIRMADA";

    return (
      <div className="flex flex-wrap gap-2">
        {next && (
          <Button
            className="!px-3 !py-1.5 !text-xs"
            disabled={busy}
            onClick={() => mutation.mutate({ id: freight.id, status: next })}
          >
            {FREIGHT_STATUS_LABELS[next]}
          </Button>
        )}
        {canCancel && (
          <Button
            variant="danger"
            className="!px-3 !py-1.5 !text-xs"
            disabled={busy}
            onClick={() =>
              mutation.mutate({ id: freight.id, status: "CANCELADA" })
            }
          >
            Cancelar
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Abertas" value={stats.abertas} />
        <StatCard label="Em negociacao" value={stats.negociacao} />
        <StatCard label="Confirmadas" value={stats.confirmadas} />
      </div>

      {mutation.isError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Nao foi possivel atualizar o pedido."}
        </p>
      )}

      {isLoading ? (
        <Spinner label="Carregando solicitacoes..." />
      ) : isError ? (
        <ErrorNote message={queryErrorMessage(error)} />
      ) : !data || data.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          Nenhuma solicitacao de frete ainda.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {data.map((freight) => (
            <div
              key={freight.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {freight.origin} &rarr; {freight.destination}
                  </span>
                  <FreightStatusBadge status={freight.status} />
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {freight.clientName} · {formatDay(freight.scheduledDate)}
                  {freight.providerId ? (
                    <>
                      {" "}
                      ·{" "}
                      <Link
                        to={`/prestador/${freight.providerId}`}
                        className="font-medium text-brand-700 hover:text-brand-800"
                      >
                        {freight.providerName}
                      </Link>
                    </>
                  ) : (
                    " · Sem prestador"
                  )}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {freight.description}
                </p>
              </div>
              {actionsFor(freight)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
