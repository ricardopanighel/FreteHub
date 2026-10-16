import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CurrencyCircleDollarIcon, MapPinIcon, PackageIcon, UserCircleIcon } from "@phosphor-icons/react";
import { createFreight, getProvider, listAvailableDrivers, listCities } from "../lib/api";
import { useClientFreights } from "../lib/freightQueries";
import type { ServiceTag, VehicleType } from "../lib/types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import { formatMoneyInput, parseMoneyInput } from "../lib/format";
import {
  Alert, BackLink, Button, ButtonLink, ButtonSpinner, Field, FormSection,
  Input, PageHeader, Select, Textarea, queryErrorMessage,
} from "../components/ui";

function dateInSaoPaulo(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function timeInSaoPaulo(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

export function RequestFreight() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const presetId = params.get("motorista") ?? params.get("prestador") ?? "";
  const retryId = params.get("pedido") ?? "";
  const forceQueue = params.get("fila") === "1";
  const retryDirect = Boolean(retryId) && !forceQueue;
  const { data: mine } = useClientFreights();
  const [restoredId, setRestoredId] = useState("");
  const [providerId, setProviderId] = useState(forceQueue ? "" : presetId);
  const [city, setCity] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [priceOffered, setPriceOffered] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [service, setService] = useState<ServiceTag | "">("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: cities } = useQuery({ queryKey: ["cities"], queryFn: listCities });
  const { data: preset } = useQuery({
    queryKey: ["provider", presetId], queryFn: () => getProvider(presetId), enabled: Boolean(presetId),
  });
  const { data: catalog } = useQuery({
    queryKey: ["providers", "request", city],
    queryFn: () => listAvailableDrivers(city),
    enabled: Boolean(city),
  });

  // undefined: ainda carregando; null: o motorista do link nao existe mais.
  useEffect(() => {
    if (preset === undefined || retryId) return;
    if (!preset || preset.type !== "INTERNO" || !preset.available) {
      setProviderId("");
      return;
    }
    setProviderId(preset.id);
    setVehicleType(preset.vehicleType);
    setCity(preset.regions[0]?.split(" - ")[0] ?? "");
  }, [preset, retryId]);

  useEffect(() => {
    if (!retryId || restoredId === retryId) return;
    const previous = mine?.find((item) => item.id === retryId);
    if (!previous) return;
    setRestoredId(retryId);
    setProviderId("");
    setCity(previous.city ?? "");
    setOrigin(previous.origin);
    setDestination(previous.destination);
    setDescription(previous.description);
    setVehicleType(previous.vehicleType ?? "");
    setService(previous.service ?? "");
    setContactPhone(previous.contactPhone ?? "");
    setPriceOffered(previous.priceOffered == null ? "" : formatMoneyInput(previous.priceOffered));
    if (previous.scheduledAt) {
      const date = new Date(previous.scheduledAt);
      if (date.getTime() > Date.now()) {
        setScheduledDate(dateInSaoPaulo(date));
        setScheduledTime(timeInSaoPaulo(date));
      }
    }
  }, [retryId, restoredId, mine, forceQueue]);

  const providers = catalog ?? [];
  const previousProviderId = mine?.find((item) => item.id === retryId)?.providerId;
  const eligibleProviders = retryDirect
    ? providers.filter((item) => item.id !== previousProviderId)
    : providers;
  const selected = eligibleProviders.find((item) => item.id === providerId) ?? (preset?.id === providerId ? preset : null);
  const mutation = useMutation({
    mutationFn: () => createFreight({
      providerId: providerId || null, city, origin, destination, description,
      scheduledDate, scheduledTime, contactPhone, priceOffered: parseMoneyInput(priceOffered)!,
      vehicleType, service,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freights"] });
      navigate("/meus-fretes", { replace: true });
    },
  });

  const validate = () => {
    const next: Record<string, string> = {};
    if (!city) next.city = "Selecione a cidade.";
    if (retryDirect && !providerId) next.providerId = "Escolha outro motorista ou use Enviar para a fila.";
    if (!origin.trim()) next.origin = "Informe a origem.";
    if (!destination.trim()) next.destination = "Informe o destino.";
    if (!scheduledDate) next.scheduledDate = "Informe a data.";
    if (!scheduledTime) next.scheduledTime = "Informe o horario.";
    if (scheduledDate && scheduledTime && new Date(`${scheduledDate}T${scheduledTime}:00-03:00`).getTime() <= Date.now())
      next.scheduledDate = "A data e o horario devem estar no futuro.";
    if (!description.trim() || description.trim().length < 10) next.description = "Descreva a carga com ao menos 10 caracteres.";
    if (!contactPhone.trim()) next.contactPhone = "Informe seu telefone.";
    if (parseMoneyInput(priceOffered) == null)
      next.priceOffered = "Informe um valor entre R$ 0,01 e R$ 100.000,00, com ate 2 casas decimais.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <BackLink to={presetId ? `/motorista/${presetId}` : "/catalogo"}>Voltar</BackLink>
      <div className="mt-4"><PageHeader title="Solicitar frete" description="Escolha um motorista disponivel ou envie para a fila da cidade. Voce oferece o valor e acompanha a resposta em Minhas solicitacoes." /></div>
      <form onSubmit={(event) => { event.preventDefault(); if (validate()) mutation.mutate(); }} className="mt-8 space-y-6">
        <FormSection icon={UserCircleIcon} title="Motorista e cidade">
          <Field label="Cidade" required error={errors.city}>
            <Select value={city} onChange={(event) => { setCity(event.target.value); setProviderId(""); }}>
              <option value="">Selecione a cidade</option>
              {cities?.map((item) => <option key={item} value={item}>{item}</option>)}
              {city && !cities?.includes(city) && <option value={city}>{city}</option>}
            </Select>
          </Field>
          <Field label="Quem vai fazer o frete" required={retryDirect} error={errors.providerId} hint="A fila envia o pedido para os motoristas disponiveis da cidade.">
            <Select value={providerId} disabled={forceQueue && Boolean(retryId)} onChange={(event) => {
              setProviderId(event.target.value);
              const chosen = eligibleProviders.find((item) => item.id === event.target.value);
              if (chosen) setVehicleType(chosen.vehicleType);
            }}>
              <option value="">{retryDirect ? "Selecione outro motorista" : "Enviar para a fila da cidade"}</option>
              {!forceQueue && eligibleProviders.map((item) => <option key={item.id} value={item.id}>{item.name} - {VEHICLE_LABELS[item.vehicleType]}</option>)}
              {!retryDirect && selected && !providers.some((item) => item.id === selected.id) && <option value={selected.id}>{selected.name}</option>}
            </Select>
          </Field>
          {retryDirect && city && catalog && eligibleProviders.length === 0 && (
            <Alert tone="warning">Nao ha outro motorista disponivel nesta cidade. <ButtonLink to={`/solicitar?pedido=${retryId}&fila=1`} variant="secondary" size="sm" className="mt-3">Enviar para a fila</ButtonLink></Alert>
          )}
          {selected && <Alert tone="info">Pedido direto para {selected.name}. O contato sera liberado depois do aceite.</Alert>}
          {preset && !preset.available && <Alert tone="warning">Este motorista esta indisponivel. Escolha outro motorista ou envie para a fila.</Alert>}
        </FormSection>

        <FormSection icon={MapPinIcon} title="Trajeto e horario">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Origem" required error={errors.origin}><Input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Bairro, cidade" /></Field>
            <Field label="Destino" required error={errors.destination}><Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Bairro, cidade" /></Field>
            <Field label="Data" required error={errors.scheduledDate}><Input type="date" min={dateInSaoPaulo(new Date())} value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} /></Field>
            <Field label="Horario" required error={errors.scheduledTime}><Input type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} /></Field>
          </div>
        </FormSection>

        <FormSection icon={PackageIcon} title="Carga">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Tipo de veiculo"><Select value={vehicleType} onChange={(event) => setVehicleType(event.target.value as VehicleType | "")}>
              <option value="">Tanto faz</option>
              {Object.entries(VEHICLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select></Field>
            <Field label="Servico"><Select value={service} onChange={(event) => setService(event.target.value as ServiceTag | "")}>
              <option value="">Nao especificado</option>
              {Object.entries(SERVICE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select></Field>
          </div>
          <Field label="O que vai no frete" required error={errors.description} hint="Volumes, peso aproximado, escadas e necessidade de ajudante.">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex: Sofa, duas caixas e uma geladeira. Terceiro andar sem elevador." />
          </Field>
        </FormSection>

        <FormSection icon={CurrencyCircleDollarIcon} title="Oferta e contato">
          <Field label="Valor oferecido (R$)" required error={errors.priceOffered}><Input type="text" inputMode="decimal" value={priceOffered} onChange={(event) => setPriceOffered(event.target.value)} placeholder="150,00" /></Field>
          <Field label="Seu telefone" required error={errors.contactPhone} hint="O motorista recebe este numero apenas depois do aceite.">
            <Input type="tel" autoComplete="tel" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="+55 13 99999-0000" />
          </Field>
        </FormSection>

        {mutation.isError && <Alert tone="danger">{queryErrorMessage(mutation.error, "Nao foi possivel registrar o pedido.")}</Alert>}
        <div className="flex justify-end"><Button type="submit" size="lg" disabled={mutation.isPending} className="w-full sm:w-auto">
          {mutation.isPending && <ButtonSpinner />}{mutation.isPending ? "Enviando..." : "Enviar pedido"}
        </Button></div>
      </form>
    </div>
  );
}
