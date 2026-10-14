import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckIcon,
  PackageIcon,
  PlusIcon,
  UserCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { cancelFreight, listMyFreights } from "../lib/api";
import type { FreightRequest, FreightStatus } from "../lib/types";
import {
  FREIGHT_STATUS_LABELS,
  SERVICE_LABELS,
  VEHICLE_LABELS,
} from "../lib/types";
import { useAuth } from "../lib/auth";
import { formatDay } from "../lib/format";
import { FreightStatusBadge } from "../components/Badge";
import { VehicleIcon } from "../components/VehicleIcon";
import {
  Alert,
  Button,
  ButtonLink,
  ButtonSpinner,
  Card,
  DetailItem,
  EmptyState,
  ErrorNote,
  PageHeader,
  Spinner,
  cx,
  queryErrorMessage,
} from "../components/ui";

const FLOW: FreightStatus[] = [
  "ABERTA",
  "EM_NEGOCIACAO",
  "CONFIRMADA",
  "CONCLUIDA",
];

// Barra em etapas: preenchida ate o status atual.
function StatusTrack({ status }: { status: FreightStatus }) {
  if (status === "CANCELADA") return null;
  const current = FLOW.indexOf(status);
  return (
    <ol aria-label="Andamento do pedido" className="mt-5 grid grid-cols-4 gap-2">
      {FLOW.map((step, index) => {
        const reached = index <= current;
        return (
          <li key={step} aria-current={index === current ? "step" : undefined}>
            <span
              aria-hidden="true"
              className={cx(
                "block h-1.5 rounded-full",
                reached ? "bg-primary-600" : "bg-slate-200",
              )}
            />
            <span
              className={cx(
                "mt-2 flex items-start gap-1 text-xs leading-snug",
                reached ? "font-semibold text-primary-700" : "text-slate-500",
              )}
            >
              {index < current && (
                <CheckIcon weight="bold" className="mt-px hidden size-3.5 shrink-0 sm:block" />
              )}
              {FREIGHT_STATUS_LABELS[step]}
              {index < current && <span className="sr-only">, etapa concluida</span>}
            </span>
          </li>
        );
      })}
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
    <Card as="article" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex min-w-0 flex-wrap items-center gap-x-2 break-words text-lg font-semibold text-slate-900">
          <span>{freight.origin}</span>
          <ArrowRightIcon weight="bold" className="size-4 shrink-0 text-slate-400" />
          <span className="sr-only">ate</span>
          <span>{freight.destination}</span>
        </h2>
        <FreightStatusBadge status={freight.status} />
      </div>

      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
        <DetailItem icon={CalendarBlankIcon} label="Data desejada">
          {formatDay(freight.scheduledDate)}
        </DetailItem>
        <DetailItem icon={UserCircleIcon} label="Prestador">
          {freight.providerName || "Sem prestador definido"}
        </DetailItem>
      </dl>

      <p className="mt-4 break-words text-sm leading-relaxed text-slate-700">
        {freight.description}
      </p>

      {(freight.vehicleType || freight.service) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {freight.vehicleType && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              <VehicleIcon type={freight.vehicleType} weight="bold" className="size-3.5" />
              {VEHICLE_LABELS[freight.vehicleType]}
            </span>
          )}
          {freight.service && (
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {SERVICE_LABELS[freight.service]}
            </span>
          )}
        </div>
      )}

      <StatusTrack status={freight.status} />

      {canCancel && (
        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
          <Button
            variant="danger"
            size="sm"
            disabled={cancelling}
            onClick={() => onCancel(freight.id)}
          >
            {cancelling ? (
              <>
                <ButtonSpinner />
                Cancelando...
              </>
            ) : (
              <>
                <XCircleIcon weight="bold" className="size-4" />
                Cancelar pedido
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <PageHeader
        title="Meus fretes"
        description="Acompanhe o que voce pediu, do registro ate a conclusao."
        actions={
          <ButtonLink to="/solicitar">
            <PlusIcon weight="bold" className="size-4" />
            Novo pedido
          </ButtonLink>
        }
      />

      <div className="mt-8 space-y-4">
        {cancel.isError && (
          <Alert tone="danger">
            {queryErrorMessage(cancel.error, "Nao foi possivel cancelar o pedido.")}
          </Alert>
        )}

        {isLoading ? (
          <Spinner label="Carregando pedidos..." />
        ) : isError ? (
          <ErrorNote message={queryErrorMessage(error)} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="Nenhum frete solicitado"
            description="Escolha um prestador no catalogo ou abra um pedido sem prestador definido."
            action={<ButtonLink to="/solicitar">Solicitar frete</ButtonLink>}
          />
        ) : (
          <ul className="space-y-4">
            {data.map((freight) => (
              <li key={freight.id}>
                <FreightCard
                  freight={freight}
                  cancelling={cancel.isPending && cancel.variables === freight.id}
                  onCancel={(id) => cancel.mutate(id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
