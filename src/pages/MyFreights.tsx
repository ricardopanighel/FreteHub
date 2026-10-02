import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelFreight, listMyFreights } from "../lib/api";
import type { FreightRequest, FreightStatus } from "../lib/types";
import {
  FREIGHT_STATUS_LABELS,
  SERVICE_LABELS,
  VEHICLE_LABELS,
} from "../lib/types";
import { useAuth } from "../lib/auth";
import { FreightStatusBadge } from "../components/Badge";
import { Button, EmptyState, ErrorNote, Spinner, queryErrorMessage } from "../components/ui";

const FLOW: FreightStatus[] = [
  "ABERTA",
  "EM_NEGOCIACAO",
  "CONFIRMADA",
  "CONCLUIDA",
];

function formatDay(value: string): string {
  const day = value.slice(0, 10);
  const [year, month, date] = day.split("-");
  if (!year || !month || !date) return value;
  return `${date}/${month}/${year}`;
}

function StatusTrack({ status }: { status: FreightStatus }) {
  if (status === "CANCELADA") return null;
  const current = FLOW.indexOf(status);
  return (
    <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {FLOW.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          <span
            className={
              index <= current
                ? "font-semibold text-brand-700"
                : "text-slate-400"
            }
          >
            {FREIGHT_STATUS_LABELS[step]}
          </span>
          {index < FLOW.length - 1 && (
            <span className="text-slate-300" aria-hidden>
              &rarr;
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function FreightCard({
  freight,
  onCancel,
  cancelling,
}: {
  freight: FreightRequest;
  onCancel: (id: string) => void;
  cancelling: boolean;
}) {
  const canCancel =
    freight.status === "ABERTA" || freight.status === "EM_NEGOCIACAO";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {freight.origin} <span className="text-slate-400">&rarr;</span>{" "}
            {freight.destination}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatDay(freight.scheduledDate)}
            {freight.providerName ? ` · ${freight.providerName}` : " · Sem prestador definido"}
          </p>
        </div>
        <FreightStatusBadge status={freight.status} />
      </div>

      <p className="mt-3 text-sm text-slate-600">{freight.description}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {freight.vehicleType && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5">
            {VEHICLE_LABELS[freight.vehicleType]}
          </span>
        )}
        {freight.service && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5">
            {SERVICE_LABELS[freight.service]}
          </span>
        )}
      </div>

      <StatusTrack status={freight.status} />

      {canCancel && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            className="!px-3 !py-1.5 !text-xs"
            disabled={cancelling}
            onClick={() => onCancel(freight.id)}
          >
            {cancelling ? "Cancelando..." : "Cancelar pedido"}
          </Button>
        </div>
      )}
    </article>
  );
}

export function MyFreights() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const clientId = user?.id ?? "";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["freights", "mine", clientId],
    queryFn: listMyFreights,
    enabled: Boolean(clientId),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelFreight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freights"] });
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meus fretes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe o que voce pediu, do registro ate a conclusao.
          </p>
        </div>
        <Link to="/solicitar">
          <Button>Novo pedido</Button>
        </Link>
      </div>

      {cancel.isError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {cancel.error instanceof Error
            ? cancel.error.message
            : "Nao foi possivel cancelar o pedido."}
        </p>
      )}

      {isLoading ? (
        <Spinner label="Carregando pedidos..." />
      ) : isError ? (
        <ErrorNote message={queryErrorMessage(error)} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Nenhum frete solicitado"
          description="Escolha um prestador no catalogo ou abra um pedido sem prestador definido."
          action={
            <Link to="/solicitar">
              <Button>Solicitar frete</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {data.map((freight) => (
            <FreightCard
              key={freight.id}
              freight={freight}
              cancelling={cancel.isPending && cancel.variables === freight.id}
              onCancel={(id) => cancel.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
