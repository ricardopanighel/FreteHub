import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listPublicProviders } from "../lib/api";
import { ProviderCard } from "../components/ProviderCard";
import { Button, Spinner } from "../components/ui";

const STEPS = [
  {
    title: "Busque no catalogo",
    text: "Filtre por tipo de veiculo, regiao e servico para encontrar o prestador ideal.",
  },
  {
    title: "Veja o perfil validado",
    text: "Cada prestador passa pela curadoria da nossa equipe antes de ser publicado.",
  },
  {
    title: "Fale direto e contrate",
    text: "Entre em contato por WhatsApp, telefone ou e-mail e negocie sem intermediarios.",
  },
];

const DIFFERENTIALS = [
  {
    title: "Prestadores validados",
    text: "Documentacao, dados do veiculo e contatos conferidos pela equipe FreteHub.",
  },
  {
    title: "Foco em fretes urbanos",
    text: "Pensado para cargas pequenas e mudancas curtas - nao distancias longas.",
  },
  {
    title: "Contato direto",
    text: "Voce escolhe o canal e negocia preco e condicoes diretamente com o prestador.",
  },
];

export function Home() {
  const { data, isLoading } = useQuery({
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
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-white/25">
              Catalogo com curadoria
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Fretes urbanos e mudancas curtas, com gente de confianca
            </h1>
            <p className="mt-4 max-w-lg text-base text-brand-50/90">
              Encontre motoristas e prestadores validados pela nossa equipe.
              Compare, fale direto e contrate sem a bagunca dos grupos de
              WhatsApp e classificados.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/catalogo">
                <Button
                  variant="secondary"
                  className="bg-white text-brand-700 hover:bg-brand-50"
                >
                  Explorar catalogo
                </Button>
              </Link>
              <Link to="/seja-prestador">
                <Button className="bg-brand-900/40 ring-1 ring-inset ring-white/30 hover:bg-brand-900/60">
                  Quero ser prestador
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-3xl bg-white/10 p-2 ring-1 ring-inset ring-white/20 backdrop-blur">
              <img
                src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=70"
                alt="Motorista de frete carregando uma van"
                className="h-72 w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Como funciona
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
          Na primeira versao, o FreteHub conecta voce diretamente a prestadores
          validados. A negociacao acontece entre as partes.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Prestadores em destaque
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Alguns dos profissionais ativos no catalogo.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="hidden text-sm font-semibold text-brand-600 hover:text-brand-700 sm:block"
            >
              Ver todos &rarr;
            </Link>
          </div>
          {isLoading ? (
            <Spinner />
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data?.items.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Diferenciais */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {DIFFERENTIALS.map((d) => (
            <div key={d.title} className="rounded-2xl bg-slate-100/70 p-6">
              <h3 className="font-semibold text-slate-900">{d.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{d.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
