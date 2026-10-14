import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircleIcon,
  MapPinIcon,
  PackageIcon,
  PaperPlaneTiltIcon,
  UserCircleIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import { createFreight, getProvider, listPublicProviders } from "../lib/api";
import type { FreightRequest, Provider, ServiceTag, VehicleType } from "../lib/types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import { useAuth } from "../lib/auth";
import { freightMessage, whatsappLink, whatsappNumber } from "../lib/whatsapp";
import {
  Alert,
  BackLink,
  Button,
  ButtonLink,
  ButtonSpinner,
  Card,
  Field,
  FormSection,
  Input,
  PageHeader,
  Select,
  Textarea,
  buttonClasses,
  queryErrorMessage,
} from "../components/ui";

function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Pedido registrado para um prestador com WhatsApp: em vez de ir direto para
// Meus fretes, a tela oferece a mensagem pronta com os dados do pedido. Abrir
// o WhatsApp sozinho depois do envio seria bloqueado como pop-up.
interface CreatedFreight {
  freight: FreightRequest;
  whatsapp: string;
}

function FreightCreated({
  freight,
  whatsapp,
  clientName,
}: CreatedFreight & { clientName?: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const message = freightMessage(freight, clientName);

  // O formulario some; o foco vai para o titulo da nova tela.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircleIcon weight="fill" className="size-8" />
        </span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 text-3xl font-bold tracking-tight text-slate-900 focus:outline-hidden"
        >
          Pedido registrado!
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-slate-600">
          Agora envie os dados para {freight.providerName ?? "o prestador"} pelo
          WhatsApp e combine preco e horario diretamente. O andamento fica em
          Meus fretes.
        </p>
      </div>

      <Card className="mt-8 p-6">
        <p className="text-sm font-semibold text-slate-900">Mensagem pronta</p>
        <div className="mt-3 whitespace-pre-line break-words rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-inset ring-slate-200">
          {message}
        </div>
        <p className="mt-3 text-sm text-slate-500">
          Voce pode revisar e editar o texto no WhatsApp antes de enviar.
        </p>
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href={whatsappLink(whatsapp, message)}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses({ variant: "whatsapp", size: "lg" })}
        >
          <WhatsappLogoIcon weight="fill" className="size-5" />
          Enviar pelo WhatsApp
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
        <ButtonLink to="/meus-fretes" variant="secondary" size="lg">
          Ver meus fretes
        </ButtonLink>
      </div>
    </div>
  );
}

// A tela de pedido registrado vale so para a navegacao em que o pedido foi
// feito. Abrir /solicitar de novo (pelo rodape, por exemplo) traz o formulario
// em branco, como quando o envio sempre levava a Meus fretes.
export function RequestFreight() {
  const location = useLocation();
  const { user } = useAuth();
  const [created, setCreated] = useState<
    (CreatedFreight & { locationKey: string }) | null
  >(null);

  if (created?.locationKey === location.key) {
    return (
      <FreightCreated
        freight={created.freight}
        whatsapp={created.whatsapp}
        clientName={user?.name}
      />
    );
  }

  return (
    <FreightForm
      onCreated={(result) => setCreated({ ...result, locationKey: location.key })}
    />
  );
}

function FreightForm({
  onCreated,
}: {
  onCreated: (created: CreatedFreight) => void;
}) {
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

  const providers = catalog?.items ?? [];

  // O prestador vem da lista do select ou, se nao estiver nela, do perfil
  // que abriu o formulario (?prestador=).
  const findProvider = (id: string | null): Provider | undefined => {
    if (!id) return undefined;
    return (
      providers.find((p) => p.id === id) ??
      (preset && preset.id === id ? preset : undefined)
    );
  };

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
    onSuccess: (freight) => {
      const number = whatsappNumber(findProvider(freight.providerId)?.contacts.whatsapp);
      if (number) onCreated({ freight, whatsapp: number });
      else navigate("/meus-fretes");
    },
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

  const minDate = todayInputValue();
  const selected = findProvider(providerId);
  const selectedHasWhatsapp = Boolean(whatsappNumber(selected?.contacts.whatsapp));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <BackLink to={presetId ? `/prestador/${presetId}` : "/catalogo"}>
        Voltar
      </BackLink>

      <div className="mt-4">
        <PageHeader
          title="Solicitar frete"
          description="Registre origem, destino e o que precisa transportar. A equipe acompanha o pedido e o status fica visivel em Meus fretes. O contato com o prestador continua direto, pelos canais do perfil."
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <FormSection icon={UserCircleIcon} title="Quem vai fazer o frete">
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

          {selected && selectedHasWhatsapp && (
            <p className="flex gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-inset ring-emerald-200">
              <WhatsappLogoIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
              Depois de registrar, voce envia os dados do pedido para{" "}
              {selected.name} pelo WhatsApp, com a mensagem ja escrita.
            </p>
          )}
        </FormSection>

        <FormSection icon={MapPinIcon} title="Trajeto e data">
          <div className="grid gap-5 sm:grid-cols-2">
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

          <div className="sm:w-1/2 sm:pr-2.5">
            <Field label="Data desejada" required error={errors.scheduledDate}>
              <Input
                type="date"
                min={minDate}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </Field>
          </div>
        </FormSection>

        <FormSection icon={PackageIcon} title="Carga">
          <div className="grid gap-5 sm:grid-cols-2">
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
          </div>

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
        </FormSection>

        {mutation.isError && (
          <Alert tone="danger">
            {queryErrorMessage(mutation.error, "Nao foi possivel registrar o pedido.")}
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            {mutation.isPending ? (
              <>
                <ButtonSpinner />
                Enviando...
              </>
            ) : (
              <>
                <PaperPlaneTiltIcon weight="bold" className="size-5" />
                Registrar pedido
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
