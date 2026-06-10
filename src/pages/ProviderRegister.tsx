import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createProvider, type NewProviderInput } from "../lib/api";
import type { ServiceTag, VehicleType } from "../lib/types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import { Button, Field, Input, Select, Textarea } from "../components/ui";

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
};

type FormState = typeof emptyForm;

export function ProviderRegister() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (input: NewProviderInput) => createProvider(input),
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
    if (!form.whatsapp.trim() && !form.phone.trim() && !form.email.trim())
      e.contacts = "Informe ao menos um canal de contato.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    mutation.mutate({
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
    });
  };

  if (mutation.isSuccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Cadastro enviado!
        </h1>
        <p className="mt-2 text-slate-600">
          Recebemos seus dados. Nossa equipe vai validar a documentacao e as
          informacoes do veiculo antes de publicar seu perfil no catalogo.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/catalogo">
            <Button variant="secondary">Ver catalogo</Button>
          </Link>
          <Button
            onClick={() => {
              setForm(emptyForm);
              mutation.reset();
            }}
          >
            Enviar outro cadastro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Seja um prestador</h1>
        <p className="mt-1 text-sm text-slate-500">
          Preencha seus dados. Apos a validacao da nossa equipe, seu perfil fica
          disponivel no catalogo publico.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Dados do prestador
          </h2>
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
          <Field
            label="URL da foto"
            hint="Opcional no MVP. No produto final, o upload sera feito via Cloudinary."
          >
            <Input
              value={form.photoUrl}
              onChange={(e) => set("photoUrl", e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </section>

        <section className="space-y-4 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Veiculo e atuacao
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
          <Field label="Servicos oferecidos" required error={errors.services}>
            <div className="flex flex-wrap gap-2">
              {Object.entries(SERVICE_LABELS).map(([value, label]) => {
                const tag = value as ServiceTag;
                const active = form.services.includes(tag);
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => toggleService(tag)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                      active
                        ? "bg-brand-600 text-white ring-brand-600"
                        : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </Field>
        </section>

        <section className="space-y-4 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Canais de contato
          </h2>
          {errors.contacts && (
            <p className="text-xs font-medium text-red-600">
              {errors.contacts}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="WhatsApp">
              <Input
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="+55 13 99999-0000"
              />
            </Field>
            <Field label="Telefone">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+55 13 3333-0000"
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contato@email.com"
              />
            </Field>
          </div>
        </section>

        {mutation.isError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            Nao foi possivel enviar o cadastro. Tente novamente.
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
          <Link to="/">
            <Button variant="secondary" type="button">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Enviando..." : "Enviar para validacao"}
          </Button>
        </div>
      </form>
    </div>
  );
}
