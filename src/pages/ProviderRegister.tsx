import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ChatsCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  IdentificationBadgeIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  TruckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { createProvider, type NewProviderInput } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  ACCEPTED_PHOTO_TYPES,
  photoUploadEnabled,
  uploadPhoto,
  validatePhoto,
} from "../lib/upload";
import type { ServiceTag, VehicleType } from "../lib/types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import {
  Alert,
  Button,
  ButtonLink,
  ButtonSpinner,
  Field,
  FieldSet,
  FormSection,
  Input,
  PageHeader,
  Select,
  Switch,
  Textarea,
  cx,
  queryErrorMessage,
} from "../components/ui";

const emptyForm = {
  name: "",
  headline: "",
  bio: "",
  photoUrl: "",
  vehicleType: "" as VehicleType | "",
  vehicleDescription: "",
  regions: "",
  services: [] as ServiceTag[],
  phone: "",
  whatsapp: "",
  email: "",
  password: "",
};

type FormState = typeof emptyForm;

const STEPS = [
  {
    title: "Envie seus dados",
    text: "Conte sobre voce, o veiculo, as regioes que atende e como falar com voce.",
  },
  {
    title: "A equipe valida",
    text: "Conferimos a documentacao e as informacoes do veiculo.",
  },
  {
    title: "Seu perfil aparece no catalogo",
    text: "Clientes enviam pedidos pelo app ou entram em contato diretamente, conforme sua escolha.",
  },
];

function RegistrationSent({ onReset }: { onReset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // O formulario some; o foco vai para o titulo da nova tela.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 text-center sm:py-16">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <CheckCircleIcon weight="fill" className="size-8" />
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 text-3xl font-bold tracking-tight text-slate-900 focus:outline-hidden"
      >
        Cadastro enviado!
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">
        Recebemos seus dados. Nossa equipe vai validar a documentacao e as
        informacoes do veiculo antes de publicar seu perfil no catalogo.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink to="/catalogo" variant="secondary" size="lg">
          Ver catalogo
        </ButtonLink>
        <Button type="button" size="lg" onClick={onReset}>
          Enviar outro cadastro
        </Button>
      </div>
    </div>
  );
}

export function ProviderRegister() {
  const navigate = useNavigate();
  const { isAuthenticated, registerDriver } = useAuth();
  const [receiveInApp, setReceiveInApp] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [driverError, setDriverError] = useState<string | null>(null);
  const [driverPending, setDriverPending] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    const invalid = validatePhoto(file);
    setPhotoError(invalid);
    if (invalid) return;
    setPhotoUploading(true);
    try {
      set("photoUrl", await uploadPhoto(file));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "Nao foi possivel enviar a foto.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: createProvider,
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleService = (tag: ServiceTag) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(tag)
        ? f.services.filter((s) => s !== tag)
        : [...f.services, tag],
    }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Informe o nome.";
    if (!form.headline.trim()) e.headline = "Informe uma chamada curta.";
    if (!form.vehicleType) e.vehicleType = "Selecione o tipo de veiculo.";
    if (!form.regions.trim()) e.regions = "Informe ao menos uma regiao.";
    if (form.services.length === 0)
      e.services = "Selecione ao menos um servico.";
    if (!form.whatsapp.trim() && !form.phone.trim() && (receiveInApp || !form.email.trim()))
      e.contacts = receiveInApp ? "Informe WhatsApp ou telefone para receber pedidos." : "Informe ao menos um canal de contato.";
    if (receiveInApp && !form.email.trim()) e.email = "Informe o e-mail da conta.";
    else if (receiveInApp && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Informe um e-mail valido.";
    if (receiveInApp && form.password.length < 6)
      e.password = "A senha deve ter ao menos 6 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const input: NewProviderInput = {
      name: form.name.trim(),
      headline: form.headline.trim(),
      bio: form.bio.trim(),
      photoUrl:
        form.photoUrl.trim() ||
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=70",
      vehicleType: form.vehicleType as VehicleType,
      vehicleDescription: form.vehicleDescription.trim(),
      regions: form.regions
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      services: form.services,
      contacts: {
        phone: form.phone.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined,
      },
    };
    if (!receiveInApp) {
      mutation.mutate(input);
      return;
    }
    setDriverError(null);
    setDriverPending(true);
    try {
      await registerDriver(form.email.trim(), form.password, input);
      navigate("/painel-motorista", { replace: true });
    } catch (error) {
      setDriverError(error instanceof Error ? error.message : "Nao foi possivel criar a conta.");
    } finally {
      setDriverPending(false);
    }
  };

  if (mutation.isSuccess && !receiveInApp) {
    return (
      <RegistrationSent
        onReset={() => {
          setForm(emptyForm);
          mutation.reset();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHeader
        title="Seja um motorista"
        description="Cadastre seu perfil para receber pedidos pelo app ou aparecer no diretorio de contato direto. Ambos passam pela curadoria."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
        {/* Resumo do processo, ao lado do formulario em telas largas. */}
        <aside
          aria-labelledby="como-funciona"
          className="surface-dark hidden rounded-2xl bg-navy-950 p-8 text-white lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:block"
        >
          <h2 id="como-funciona" className="text-base font-semibold">
            Como funciona
          </h2>
          <ol className="mt-6 space-y-6">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-navy-950"
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </aside>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 lg:col-start-1 lg:row-start-1"
        >
          <FormSection icon={IdentificationBadgeIcon} title="Forma de atendimento">
            <Switch checked={receiveInApp} onChange={(value) => { setReceiveInApp(value); setDriverError(null); mutation.reset(); }} label="Receber pedidos pelo app" />
            <p className="text-sm text-slate-600">
              {receiveInApp
                ? "Crie uma conta para aceitar, recusar ou contrapropor pedidos no painel do motorista."
                : "Seu perfil aparece no diretorio com os contatos para falar diretamente com clientes."}
            </p>
            {isAuthenticated && receiveInApp && (
              <Alert tone="warning">Ao criar a conta de motorista, sua sessao atual sera trocada pela nova conta.</Alert>
            )}
          </FormSection>

          <FormSection icon={IdentificationBadgeIcon} title="Dados do motorista">
            <Field label="Nome / nome do servico" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex: Carlos Transportes"
              />
            </Field>
            <Field
              label="Chamada curta"
              required
              error={errors.headline}
              hint="Aparece no card do catalogo."
            >
              <Input
                value={form.headline}
                onChange={(e) => set("headline", e.target.value)}
                placeholder="Ex: Fretes rapidos e mudancas na regiao central"
              />
            </Field>
            <Field label="Descricao / apresentacao">
              <Textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Conte sua experiencia, diferenciais e como voce trabalha."
              />
            </Field>
            {photoUploadEnabled ? (
              <Field
                label="Foto"
                hint="Opcional. JPG, PNG ou WEBP de ate 5 MB."
                error={photoError ?? undefined}
              >
                <div className="flex items-center gap-4">
                  {form.photoUrl && (
                    <img
                      src={form.photoUrl}
                      alt="Previa da foto"
                      className="size-16 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                    />
                  )}
                  <Input
                    type="file"
                    accept={ACCEPTED_PHOTO_TYPES.join(",")}
                    disabled={photoUploading}
                    onChange={(e) => handlePhoto(e.target.files?.[0])}
                    className="py-2 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium file:text-slate-800"
                  />
                  {photoUploading && <ButtonSpinner />}
                </div>
              </Field>
            ) : (
              <Field label="URL da foto" hint="Opcional.">
                <Input
                  inputMode="url"
                  value={form.photoUrl}
                  onChange={(e) => set("photoUrl", e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            )}
          </FormSection>

          <FormSection icon={TruckIcon} title="Veiculo e atuacao">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tipo de veiculo" required error={errors.vehicleType}>
                <Select
                  value={form.vehicleType}
                  onChange={(e) =>
                    set("vehicleType", e.target.value as VehicleType | "")
                  }
                >
                  <option value="">Selecione...</option>
                  {Object.entries(VEHICLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Descricao do veiculo">
                <Input
                  value={form.vehicleDescription}
                  onChange={(e) => set("vehicleDescription", e.target.value)}
                  placeholder="Ex: Fiat Fiorino 2019, bau fechado"
                />
              </Field>
            </div>
            <Field
              label="Regioes de atendimento"
              required
              error={errors.regions}
              hint="Separe por virgula. Ex: Santos - Gonzaga, Sao Vicente, Praia Grande"
            >
              <Input
                value={form.regions}
                onChange={(e) => set("regions", e.target.value)}
                placeholder="Santos - Gonzaga, Sao Vicente, Praia Grande"
              />
            </Field>
            <FieldSet
              legend="Servicos oferecidos"
              required
              error={errors.services}
            >
              <div className="flex flex-wrap gap-2">
                {Object.entries(SERVICE_LABELS).map(([value, label]) => {
                  const tag = value as ServiceTag;
                  const active = form.services.includes(tag);
                  return (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={active}
                      onClick={() => toggleService(tag)}
                      className={cx(
                        "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium ring-1 ring-inset transition-colors duration-150",
                        active
                          ? "bg-primary-600 text-white ring-primary-600 hover:bg-primary-700"
                          : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 hover:ring-slate-400",
                      )}
                    >
                      {active ? (
                        <CheckIcon weight="bold" className="size-4" />
                      ) : (
                        <PlusIcon weight="bold" className="size-4" />
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>
            </FieldSet>
          </FormSection>

          <FormSection
            icon={ChatsCircleIcon}
            title="Canais de contato"
            description={receiveInApp
              ? "Informe WhatsApp ou telefone. Seu contato aparece para o cliente depois que voce aceita o pedido."
              : "Informe ao menos um canal para contato direto dos clientes."}
          >
            {errors.contacts && (
              <p className="flex items-start gap-1.5 text-sm font-medium text-red-700">
                <WarningCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
                {errors.contacts}
              </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="WhatsApp" hint="Inclua o DDD.">
                <Input
                  type="tel"
                  autoComplete="tel"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  placeholder="+55 13 99999-0000"
                />
              </Field>
              <Field label="Telefone">
                <Input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+55 13 3333-0000"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={receiveInApp ? "E-mail da conta" : "E-mail de contato"} required={receiveInApp} error={errors.email}>
                  <Input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="contato@email.com"
                    required={receiveInApp}
                  />
                </Field>
              </div>
            </div>
            {receiveInApp && (
              <Field label="Senha" required error={errors.password} hint="Minimo de 6 caracteres.">
                <Input type="password" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} />
              </Field>
            )}
          </FormSection>

          {(mutation.isError || driverError) && (
            <Alert tone="danger">
              {driverError ?? queryErrorMessage(
                mutation.error,
                "Nao foi possivel enviar o cadastro. Tente novamente.",
              )}
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <ButtonLink to="/" variant="secondary" size="lg">
              Cancelar
            </ButtonLink>
            <Button type="submit" size="lg" disabled={mutation.isPending || driverPending || photoUploading}>
              {mutation.isPending || driverPending ? (
                <>
                  <ButtonSpinner />
                  Enviando...
                </>
              ) : (
                <>
                  <PaperPlaneTiltIcon weight="bold" className="size-5" />
                  {receiveInApp ? "Criar conta de motorista" : "Enviar para validacao"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
