import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon, CalendarBlankIcon, CheckCircleIcon, ClockIcon,
  CurrencyCircleDollarIcon, PackageIcon, TruckIcon, UserCircleIcon,
} from "@phosphor-icons/react";
import {
  acceptDriverFreight, completeDriverFreight, counterDriverFreight,
  getMyDriverProfile, rejectDriverFreight, startDriverFreight, updateAvailability,
} from "../lib/api";
import { useDriverFreights } from "../lib/freightQueries";
import type { FreightRequest } from "../lib/types";
import { formatMoney, formatRemaining, formatScheduledAt, onlyDigits, parseMoneyInput } from "../lib/format";
import { FreightStatusBadge, StatusBadge } from "../components/Badge";
import { StatCard } from "../components/StatCard";
import {
  Alert, Button, ButtonSpinner, Card, DetailItem, EmptyState, ErrorNote,
  Field, Input, PageHeader, Spinner, Switch, queryErrorMessage,
} from "../components/ui";

type Action = "accept" | "reject" | "counter" | "start" | "complete";
type Tab = "pending" | "active" | "history";

function DriverFreightCard({ freight, now, busy, approved, onAction }: {
  freight: FreightRequest;
  now: number;
  busy: boolean;
  approved: boolean;
  onAction: (id: string, action: Action, price?: number) => void;
}) {
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const queue = !freight.providerId;
  const pending = freight.status === "PENDENTE";
  const responseOpen = !freight.responseDeadline || new Date(freight.responseDeadline).getTime() > now;
  const contacts = freight.clientContact;

  const submitCounter = () => {
    const price = parseMoneyInput(counterPrice);
    if (price == null || price === freight.priceOffered) {
      setPriceError("Informe um valor diferente da oferta, entre R$ 0,01 e R$ 100.000,00.");
      return;
    }
    setPriceError("");
    onAction(freight.id, "counter", price);
  };

  return (
    <Card as="article" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="flex min-w-0 flex-wrap items-center gap-x-2 break-words text-lg font-semibold text-slate-900">
          <span>{freight.origin}</span><ArrowRightIcon weight="bold" className="size-4 text-slate-400" /><span className="sr-only">ate</span><span>{freight.destination}</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {queue && <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700 ring-1 ring-inset ring-accent-200">Fila da cidade</span>}
          <FreightStatusBadge status={freight.status} />
        </div>
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        <DetailItem icon={CalendarBlankIcon} label="Data e horario">{formatScheduledAt(freight.scheduledAt)}</DetailItem>
        <DetailItem icon={UserCircleIcon} label="Cliente">{freight.clientName}</DetailItem>
        {freight.city && <DetailItem icon={TruckIcon} label="Cidade">{freight.city}</DetailItem>}
      </dl>
      <p className="mt-4 break-words text-sm leading-relaxed text-slate-700">{freight.description}</p>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 rounded-xl bg-slate-50 p-4 text-sm">
        <p><span className="text-slate-600">Oferta: </span><strong className="text-slate-900">{formatMoney(freight.priceOffered)}</strong></p>
        {freight.counterPrice != null && <p><span className="text-slate-600">Contraproposta: </span><strong className="text-slate-900">{formatMoney(freight.counterPrice)}</strong></p>}
        {freight.agreedPrice != null && <p><span className="text-slate-600">Combinado: </span><strong className="text-slate-900">{formatMoney(freight.agreedPrice)}</strong></p>}
      </div>
      {freight.responseDeadline && ["PENDENTE", "CONTRAPROPOSTA"].includes(freight.status) && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-800">
          <ClockIcon weight="bold" className="size-4" />{formatRemaining(freight.responseDeadline, now)}
        </p>
      )}
      {freight.status === "CONTRAPROPOSTA" && <Alert tone="info" className="mt-4">Aguardando a resposta do cliente a sua contraproposta.</Alert>}
      {contacts && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h4 className="font-semibold text-slate-900">Contato do cliente</h4>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {contacts.phone && <a className="inline-flex min-h-11 items-center font-medium text-primary-700 underline-offset-4 hover:underline" href={`tel:${onlyDigits(contacts.phone)}`}>Telefone: {contacts.phone}</a>}
            {contacts.email && <a className="inline-flex min-h-11 items-center font-medium text-primary-700 underline-offset-4 hover:underline" href={`mailto:${contacts.email}`}>E-mail: {contacts.email}</a>}
          </div>
        </div>
      )}
      {pending && responseOpen && approved && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => onAction(freight.id, "accept")}>{busy ? <ButtonSpinner /> : <CheckCircleIcon weight="bold" className="size-4" />}Aceitar</Button>
            {!queue && <>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setCounterOpen((open) => !open)}>Contrapropor</Button>
              <Button size="sm" variant="danger" disabled={busy} onClick={() => onAction(freight.id, "reject")}>Recusar</Button>
            </>}
          </div>
          {counterOpen && !queue && <div className="mt-4 max-w-sm rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
            <Field label="Novo valor (R$)" required error={priceError} hint="Uma rodada de contraproposta por pedido.">
              <Input type="text" inputMode="decimal" value={counterPrice} onChange={(event) => setCounterPrice(event.target.value)} placeholder="175,00" />
            </Field>
            <Button size="sm" className="mt-3" disabled={busy} onClick={submitCounter}>Enviar contraproposta</Button>
          </div>}
        </div>
      )}
      {pending && !approved && <Alert tone="warning" className="mt-4">Seu cadastro precisa estar aprovado para responder a este pedido.</Alert>}
      {pending && !responseOpen && <Alert tone="warning" className="mt-4">O prazo encerrou. Atualizando o pedido...</Alert>}
      {freight.status === "ACEITO" && <div className="mt-5 border-t border-slate-100 pt-4"><Button size="sm" disabled={busy} onClick={() => onAction(freight.id, "start")}>Iniciar frete</Button></div>}
      {freight.status === "EM_ANDAMENTO" && <div className="mt-5 border-t border-slate-100 pt-4"><Button size="sm" disabled={busy} onClick={() => onAction(freight.id, "complete")}>Concluir frete</Button></div>}
    </Card>
  );
}

export function DriverDashboard() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading, isError: profileError, error: profileCause } = useQuery({
    queryKey: ["driver", "me"], queryFn: getMyDriverProfile,
    staleTime: 0, refetchInterval: 10_000, refetchOnWindowFocus: true,
  });
  const { data: freights, isLoading, isError, error } = useDriverFreights();
  const [tab, setTab] = useState<Tab>("pending");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const availability = useMutation({
    mutationFn: updateAvailability,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["driver", "me"] });
      queryClient.invalidateQueries({ queryKey: ["freights", "driver"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["provider", updated.id] });
    },
  });
  const action = useMutation({
    mutationFn: ({ id, type, price }: { id: string; type: Action; price?: number }) => {
      switch (type) {
        case "accept": return acceptDriverFreight(id);
        case "reject": return rejectDriverFreight(id);
        case "counter": return counterDriverFreight(id, price!);
        case "start": return startDriverFreight(id);
        case "complete": return completeDriverFreight(id);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["freights"] }),
  });

  const list = freights ?? [];
  const pending = list.filter((item) => ["PENDENTE", "CONTRAPROPOSTA"].includes(item.status));
  const active = list.filter((item) => ["ACEITO", "EM_ANDAMENTO"].includes(item.status));
  const history = list.filter((item) => ["CONCLUIDO", "RECUSADO", "EXPIRADO", "CANCELADO"].includes(item.status));
  const awaiting = pending.filter((item) => item.status === "PENDENTE").length;
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pending", label: "Solicitacoes pendentes", count: pending.length },
    { id: "active", label: "Em andamento", count: active.length },
    { id: "history", label: "Historico", count: history.length },
  ];
  const visible = tab === "pending" ? pending : tab === "active" ? active : history;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHeader title="Painel do motorista" description="Controle sua disponibilidade e responda aos pedidos pelo app." />
      {profileLoading ? <Spinner label="Carregando perfil..." /> : profileError ? <div className="mt-8"><ErrorNote message={queryErrorMessage(profileCause)} /></div> : profile && (
        <Card className="mt-8 flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{profile.name}</h2>
            <div className="mt-2"><StatusBadge status={profile.status} /></div>
            {profile.status !== "APROVADO" && <p className="mt-2 max-w-xl text-sm text-slate-600">
              {profile.status === "PENDENTE" ? "Seu cadastro esta em analise. Voce podera receber pedidos apos a aprovacao." :
                profile.status === "REJEITADO" ? "Seu cadastro foi recusado. Fale com a equipe para revisar os dados." :
                "Seu cadastro esta inativo. Fale com a equipe para reativar."}
            </p>}
          </div>
          <Switch checked={profile.available} disabled={profile.status !== "APROVADO" || availability.isPending}
            onChange={(checked) => availability.mutate(checked)} label={profile.available ? "Disponivel" : "Indisponivel"} />
        </Card>
      )}
      {availability.isError && <Alert tone="danger" className="mt-4">{queryErrorMessage(availability.error)}</Alert>}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pedem resposta" value={awaiting} icon={ClockIcon} tone="warning" />
        <StatCard label="Em andamento" value={active.length} icon={TruckIcon} tone="primary" />
        <StatCard label="Concluidos" value={history.filter((item) => item.status === "CONCLUIDO").length} icon={CurrencyCircleDollarIcon} tone="success" />
      </div>
      <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-3" role="group" aria-label="Filtrar pedidos do motorista">
        {tabs.map((item) => <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)}
          className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition-colors duration-150 ${tab === item.id ? "bg-primary-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}>
          {item.label} <span aria-hidden="true">({item.count})</span>
        </button>)}
      </div>
      {action.isError && <Alert tone="danger" className="mt-5">{queryErrorMessage(action.error, "Nao foi possivel atualizar o pedido.")}</Alert>}
      <p role="status" className="sr-only">{awaiting} {awaiting === 1 ? "pedido aguarda" : "pedidos aguardam"} sua resposta.</p>
      <div className="mt-5">
        {isLoading ? <Spinner label="Carregando pedidos..." /> : isError ? <ErrorNote message={queryErrorMessage(error)} /> :
          !visible.length ? <EmptyState icon={PackageIcon} title="Nenhum pedido nesta aba" description={tab === "pending" ? "Novos pedidos aparecem aqui em ate 10 segundos." : undefined} /> :
          <ul className="space-y-4">{visible.map((freight) => <li key={freight.id}>
            <DriverFreightCard freight={freight} now={now} approved={profile?.status === "APROVADO"} busy={action.isPending && action.variables?.id === freight.id}
              onAction={(id, type, price) => action.mutate({ id, type, price })} />
          </li>)}</ul>}
      </div>
    </div>
  );
}
