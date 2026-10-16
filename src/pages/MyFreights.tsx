import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, CalendarBlankIcon, CheckIcon, ClockIcon, PackageIcon, PlusIcon, UserCircleIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { cancelFreight, respondToCounterOffer } from "../lib/api";
import { useClientFreights } from "../lib/freightQueries";
import type { FreightRequest, FreightStatus } from "../lib/types";
import { FREIGHT_STATUS_LABELS } from "../lib/types";
import { formatMoney, formatRemaining, formatScheduledAt, onlyDigits } from "../lib/format";
import { freightMessage, whatsappLink, whatsappNumber } from "../lib/whatsapp";
import { FreightStatusBadge } from "../components/Badge";
import {
  Alert, Button, ButtonLink, Card, DetailItem, EmptyState,
  ErrorNote, PageHeader, Spinner, buttonClasses, cx, queryErrorMessage,
} from "../components/ui";

const FLOW: FreightStatus[] = ["PENDENTE", "ACEITO", "EM_ANDAMENTO", "CONCLUIDO"];

function StatusTrack({ status }: { status: FreightStatus }) {
  if (["RECUSADO", "EXPIRADO", "CANCELADO"].includes(status)) return null;
  const current = status === "CONTRAPROPOSTA" ? 0 : FLOW.indexOf(status);
  return (
    <ol aria-label="Andamento do pedido" className="mt-5 grid grid-cols-4 gap-2">
      {FLOW.map((step, index) => (
        <li key={step} aria-current={index === current ? "step" : undefined}>
          <span aria-hidden="true" className={cx("block h-1.5 rounded-full", index <= current ? "bg-primary-600" : "bg-slate-200")} />
          <span className={cx("mt-2 flex items-start gap-1 text-xs leading-snug", index <= current ? "font-semibold text-primary-700" : "text-slate-500")}>
            {index < current && <CheckIcon weight="bold" className="mt-px hidden size-3.5 shrink-0 sm:block" />}
            {FREIGHT_STATUS_LABELS[step]}
          </span>
        </li>
      ))}
    </ol>
  );
}

function FreightCard({ freight, now, busy, onAction }: {
  freight: FreightRequest;
  now: number;
  busy: boolean;
  onAction: (id: string, action: "cancel" | "accept-counter" | "reject-counter") => void;
}) {
  const canCancel = ["PENDENTE", "CONTRAPROPOSTA", "ACEITO"].includes(freight.status);
  const canRetry = ["RECUSADO", "EXPIRADO"].includes(freight.status);
  const responseOpen = !freight.responseDeadline || new Date(freight.responseDeadline).getTime() > now;
  const contacts = freight.providerContacts;
  const wa = whatsappNumber(contacts?.whatsapp);
  return (
    <Card as="article" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="flex min-w-0 flex-wrap items-center gap-x-2 break-words text-lg font-semibold text-slate-900">
          <span>{freight.origin}</span><ArrowRightIcon weight="bold" className="size-4 shrink-0 text-slate-400" /><span className="sr-only">ate</span><span>{freight.destination}</span>
        </h2>
        <FreightStatusBadge status={freight.status} />
      </div>
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
        <DetailItem icon={CalendarBlankIcon} label="Data e horario">{formatScheduledAt(freight.scheduledAt)}</DetailItem>
        <DetailItem icon={UserCircleIcon} label="Motorista">{freight.providerName || "Fila de motoristas"}</DetailItem>
      </dl>
      <p className="mt-3 break-words text-sm leading-relaxed text-slate-700">{freight.description}</p>
      <dl className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div><dt className="font-medium text-slate-600">Valor oferecido</dt><dd className="font-semibold text-slate-900">{formatMoney(freight.priceOffered)}</dd></div>
        {freight.agreedPrice != null && <div><dt className="font-medium text-slate-600">Valor combinado</dt><dd className="font-semibold text-slate-900">{formatMoney(freight.agreedPrice)}</dd></div>}
        {freight.city && <div><dt className="font-medium text-slate-600">Cidade</dt><dd className="font-semibold text-slate-900">{freight.city}</dd></div>}
      </dl>
      {["PENDENTE", "CONTRAPROPOSTA"].includes(freight.status) && freight.responseDeadline && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-800">
          <ClockIcon weight="bold" className="size-4" /> {formatRemaining(freight.responseDeadline, now)}
        </p>
      )}
      {freight.status === "CONTRAPROPOSTA" && (
        <div className="mt-5 rounded-xl bg-primary-50 p-4 ring-1 ring-inset ring-primary-200">
          <p className="font-semibold text-primary-900">Contraproposta: {formatMoney(freight.counterPrice)}</p>
          <p className="mt-1 text-sm text-primary-900">Aceite ou recuse dentro do prazo para responder ao motorista.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" disabled={busy || !responseOpen} onClick={() => onAction(freight.id, "accept-counter")}>Aceitar contraproposta</Button>
            <Button size="sm" variant="secondary" disabled={busy || !responseOpen} onClick={() => onAction(freight.id, "reject-counter")}>Recusar</Button>
          </div>
        </div>
      )}
      <StatusTrack status={freight.status} />
      {contacts && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="font-semibold text-slate-900">Contato do motorista</h3>
          <p className="mt-1 text-sm text-slate-600">Alinhe os detalhes do frete apos o aceite.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {wa && <a href={whatsappLink(wa, freightMessage(freight))} target="_blank" rel="noreferrer" className={buttonClasses({ variant: "whatsapp", size: "sm" })}>
              <WhatsappLogoIcon weight="fill" className="size-4" />WhatsApp<span className="sr-only"> (abre em nova aba)</span>
            </a>}
            {contacts.phone && <a href={`tel:${onlyDigits(contacts.phone)}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>Ligar: {contacts.phone}</a>}
          </div>
        </div>
      )}
      {(canCancel || canRetry) && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {canRetry && <>
            <ButtonLink to={`/solicitar?pedido=${freight.id}`} size="sm">Tentar outro motorista</ButtonLink>
            <ButtonLink to={`/solicitar?pedido=${freight.id}&fila=1`} variant="secondary" size="sm">Enviar para a fila</ButtonLink>
          </>}
          {canCancel && <Button variant="danger" size="sm" disabled={busy} onClick={() => onAction(freight.id, "cancel")}>Cancelar pedido</Button>}
        </div>
      )}
    </Card>
  );
}

export function MyFreights() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useClientFreights();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "cancel" | "accept-counter" | "reject-counter" }) =>
      action === "cancel" ? cancelFreight(id) : respondToCounterOffer(id, action === "accept-counter"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["freights"] }),
  });
  const actionCount = data?.filter((item) => item.status === "CONTRAPROPOSTA").length ?? 0;
  const actionText = `${actionCount} ${actionCount === 1 ? "contraproposta aguarda" : "contrapropostas aguardam"} sua resposta.`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <PageHeader title="Minhas solicitacoes" description="Acompanhe pedidos, contrapropostas e contatos apos o aceite." actions={
        <ButtonLink to="/solicitar"><PlusIcon weight="bold" className="size-4" />Novo pedido</ButtonLink>
      } />
      <p role="status" className="sr-only">{actionText}</p>
      <div className="mt-8 space-y-4">
        {actionCount > 0 && <Alert tone="info">{actionText}</Alert>}
        {mutation.isError && <Alert tone="danger">{queryErrorMessage(mutation.error, "Nao foi possivel atualizar o pedido.")}</Alert>}
        {isLoading ? <Spinner label="Carregando solicitacoes..." /> : isError ? <ErrorNote message={queryErrorMessage(error)} /> :
          !data?.length ? <EmptyState icon={PackageIcon} title="Nenhuma solicitacao ainda" description="Escolha um motorista no catalogo ou envie um pedido para a fila da sua cidade." action={<ButtonLink to="/solicitar">Solicitar frete</ButtonLink>} /> :
          <ul className="space-y-4">{data.map((freight) => <li key={freight.id}>
            <FreightCard freight={freight} now={now} busy={mutation.isPending && mutation.variables?.id === freight.id} onAction={(id, action) => mutation.mutate({ id, action })} />
          </li>)}</ul>}
      </div>
    </div>
  );
}
