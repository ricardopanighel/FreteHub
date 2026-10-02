import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFreight, getProvider, listPublicProviders } from "../lib/api";
import type { ServiceTag, VehicleType } from "../lib/types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import { Button, Field, Input, Select, Textarea } from "../components/ui";

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function RequestFreight() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetId = params.get("prestador") ?? "";

  const [providerId, setProviderId] = useState(presetId);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [service, setService] = useState<ServiceTag | "">("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: catalog } = useQuery({
    queryKey: ["providers", "select"],
    queryFn: () =>
      listPublicProviders(
        { search: "", vehicleType: "", region: "", service: "" },
        1,
        50,
      ),
  });

  const { data: preset } = useQuery({
    queryKey: ["provider", presetId],
    queryFn: () => getProvider(presetId),
    enabled: Boolean(presetId),
  });

  useEffect(() => {
    if (!preset || preset.status !== "APROVADO") return;
    setProviderId(preset.id);
    setVehicleType((current) => current || preset.vehicleType);
  }, [preset]);

  const mutation = useMutation({
    mutationFn: () =>
      createFreight({
        providerId: providerId || null,
        origin,
        destination,
        description,
        scheduledDate,
        vehicleType,
        service,
      }),
    onSuccess: () => navigate("/meus-fretes"),
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!origin.trim()) next.origin = "Informe a origem.";
    if (!destination.trim()) next.destination = "Informe o destino.";
    if (!scheduledDate) next.scheduledDate = "Informe a data desejada.";
    else if (scheduledDate < todayInputValue())
      next.scheduledDate = "A data nao pode estar no passado.";
    if (!description.trim()) next.description = "Descreva a carga.";
    else if (description.trim().length < 10)
      next.description = "Descreva a carga com um pouco mais de detalhe.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  const providers = catalog?.items ?? [];
  const minDate = todayInputValue();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        to={presetId ? `/prestador/${presetId}` : "/catalogo"}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-600"
      >
        &larr; Voltar
      </Link>

      <h1 className="text-3xl font-bold text-slate-900">Solicitar frete</h1>
      <p className="mt-2 text-sm text-slate-500">
        Registre origem, destino e o que precisa transportar. A equipe
        acompanha o pedido e o status fica visivel em Meus fretes. O contato
        com o prestador continua direto, pelos canais do perfil.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <Field
          label="Prestador"
          hint="Opcional. Deixe em branco se ainda nao escolheu."
        >
          <Select
            value={providerId}
            onChange={(e) => {
              const nextId = e.target.value;
              setProviderId(nextId);
              const chosen = providers.find((p) => p.id === nextId);
              if (chosen) setVehicleType(chosen.vehicleType);
            }}
          >
            <option value="">Ainda nao escolhi</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {VEHICLE_LABELS[p.vehicleType]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Origem" required error={errors.origin}>
            <Input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Bairro, cidade"
              required
            />
          </Field>
          <Field label="Destino" required error={errors.destination}>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Bairro, cidade"
              required
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data desejada" required error={errors.scheduledDate}>
            <Input
              type="date"
              min={minDate}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </Field>
          <Field label="Tipo de veiculo">
            <Select
              value={vehicleType}
              onChange={(e) =>
                setVehicleType(e.target.value as VehicleType | "")
              }
            >
              <option value="">Tanto faz</option>
              {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((key) => (
                <option key={key} value={key}>
                  {VEHICLE_LABELS[key]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Servico">
          <Select
            value={service}
            onChange={(e) => setService(e.target.value as ServiceTag | "")}
          >
            <option value="">Nao especificado</option>
            {(Object.keys(SERVICE_LABELS) as ServiceTag[]).map((key) => (
              <option key={key} value={key}>
                {SERVICE_LABELS[key]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="O que vai no frete"
          required
          error={errors.description}
          hint="Volumes, peso aproximado, se precisa de ajudante ou se tem escada."
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: sofa de 3 lugares, duas caixas e uma geladeira. Terceiro andar sem elevador."
            required
          />
        </Field>

        {mutation.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Nao foi possivel registrar o pedido."}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Enviando..." : "Registrar pedido"}
          </Button>
        </div>
      </form>
    </div>
  );
}
