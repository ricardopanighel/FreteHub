import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  ClipboardTextIcon,
  HandshakeIcon,
  MagnifyingGlassIcon,
  MapTrifoldIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  type Icon,
} from "@phosphor-icons/react";
import { listPublicProviders } from "../lib/api";
import type { VehicleType } from "../lib/types";
import { VEHICLE_LABELS } from "../lib/types";
import { ProviderCard, ProviderGridSkeleton } from "../components/ProviderCard";
import { VehicleIcon } from "../components/VehicleIcon";
import { ButtonLink, ErrorNote, queryErrorMessage } from "../components/ui";

const STEPS: { icon: Icon; title: string; text: string }[] = [
  {
    icon: MagnifyingGlassIcon,
    title: "Busque no catalogo",
    text: "Filtre por tipo de veiculo, regiao e servico para encontrar o prestador ideal.",
  },
  {
    icon: SealCheckIcon,
    title: "Veja o perfil validado",
    text: "Cada prestador passa pela curadoria da nossa equipe antes de ser publicado.",
  },
  {
    icon: ClipboardTextIcon,
    title: "Solicite e acompanhe",
    text: "Abra um pedido de frete e veja o status. O contato com o prestador continua direto.",
  },
];

const DIFFERENTIALS: { icon: Icon; title: string; text: string }[] = [
  {
    icon: ShieldCheckIcon,
    title: "Prestadores validados",
    text: "Documentacao, dados do veiculo e contatos conferidos pela equipe FreteHub.",
  },
  {
    icon: MapTrifoldIcon,
    title: "Foco em fretes urbanos",
    text: "Pensado para cargas pequenas e mudancas curtas - nao distancias longas.",
  },
  {
    icon: HandshakeIcon,
    title: "Contato direto",
    text: "Voce escolhe o canal e negocia preco e condicoes diretamente com o prestador.",
  },
];

const VEHICLES = Object.keys(VEHICLE_LABELS) as VehicleType[];

export function Home() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["providers", "destaques"],
    queryFn: () =>
      listPublicProviders(
        { search: "", vehicleType: "", region: "", service: "" },
        1,
        3,
      ),
  });

  return (
    <div>
      {/* Hero */}
      <section className="surface-dark bg-navy-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ring-white/15">
              <SealCheckIcon weight="fill" className="size-4 text-accent-400" />
              Catalogo com curadoria
            </p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              Fretes urbanos e mudancas curtas, com gente de{" "}
              <span className="text-accent-400">confianca</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Encontre motoristas e prestadores validados pela nossa equipe.
              Compare, fale direto e contrate sem a bagunca dos grupos de
              WhatsApp e classificados.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink to="/catalogo" variant="accent" size="lg">
                <MagnifyingGlassIcon weight="bold" className="size-5" />
                Explorar catalogo
              </ButtonLink>
              <ButtonLink to="/solicitar" variant="inverse" size="lg">
                Solicitar frete
              </ButtonLink>
              <Link
                to="/seja-prestador"
                className="group inline-flex min-h-12 items-center gap-1.5 rounded-lg px-3 text-base font-semibold text-slate-200 transition-colors duration-150 hover:text-white"
              >
                Quero ser prestador
                <ArrowRightIcon
                  weight="bold"
                  className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=70"
              alt="Motorista de frete carregando uma van"
              className="aspect-[4/3] w-full rounded-3xl object-cover"
            />
            {/* Repete o "Catalogo com curadoria" so como ilustracao. */}
            <div
              aria-hidden="true"
              className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-900 ring-1 ring-slate-900/10"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <SealCheckIcon weight="fill" className="size-6" />
              </span>
              <span>
                <span className="block text-sm font-semibold">Perfil validado</span>
                <span className="block text-xs text-slate-600">
                  Documentos e veiculo conferidos
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 lg:flex-row lg:items-center lg:gap-10">
            <p className="shrink-0 text-sm font-semibold text-slate-400">
              Tipos de veiculo
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {VEHICLES.map((v) => (
                <li key={v} className="flex items-center gap-2 text-sm text-slate-300">
                  <VehicleIcon type={v} weight="duotone" className="size-5 text-accent-400" />
                  {VEHICLE_LABELS[v]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Como funciona
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Encontre um prestador validado, registre o pedido e acompanhe o
            andamento. A negociacao de preco continua direta com o prestador.
          </p>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: StepIcon, title, text }, i) => (
            <li key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <StepIcon weight="duotone" className="size-6" />
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  Passo {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Destaques */}
      <section className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Prestadores em destaque
              </h2>
              <p className="mt-2 text-base text-slate-600">
                Alguns dos profissionais ativos no catalogo.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="group hidden min-h-11 items-center gap-1.5 rounded-lg text-sm font-semibold text-primary-700 transition-colors duration-150 hover:text-primary-800 sm:inline-flex"
            >
              Ver todos
              <span className="sr-only"> os prestadores</span>
              <ArrowRightIcon
                weight="bold"
                className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <div className="mt-10">
            {isLoading ? (
              <ProviderGridSkeleton
                count={3}
                label="Carregando prestadores em destaque..."
              />
            ) : isError ? (
              <ErrorNote message={queryErrorMessage(error)} />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data?.items.map((p) => (
                  <ProviderCard key={p.id} provider={p} />
                ))}
              </div>
            )}
          </div>

          <ButtonLink
            to="/catalogo"
            variant="secondary"
            className="mt-8 w-full sm:hidden"
          >
            Ver todos os prestadores
          </ButtonLink>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Por que usar o FreteHub
        </h2>
        <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {DIFFERENTIALS.map(({ icon: ItemIcon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                <ItemIcon weight="duotone" className="size-6" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Chamada para prestadores */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="surface-dark flex flex-col gap-8 rounded-3xl bg-navy-900 px-6 py-10 text-white sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14 lg:py-14">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Faz fretes ou pequenas mudancas?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Cadastre seu perfil. Depois da validacao da equipe, ele aparece
              no catalogo para quem procura frete.
            </p>
          </div>
          <ButtonLink
            to="/seja-prestador"
            variant="accent"
            size="lg"
            className="shrink-0 self-start lg:self-auto"
          >
            Quero ser prestador
            <ArrowRightIcon weight="bold" className="size-5" />
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
