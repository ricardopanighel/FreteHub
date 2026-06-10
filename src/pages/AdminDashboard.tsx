import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAllProviders, updateProviderStatus } from "../lib/api";
import type { Provider, ProviderStatus } from "../lib/types";
import { VEHICLE_LABELS } from "../lib/types";
import { StatusBadge } from "../components/Badge";
import { Button, Spinner } from "../components/ui";

type Tab = "PENDENTE" | "APROVADO" | "TODOS";

const TABS: { key: Tab; label: string }[] = [
  { key: "PENDENTE", label: "Pendentes" },
  { key: "APROVADO", label: "Aprovados" },
  { key: "TODOS", label: "Todos" },
];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="text-3xl font-extrabold text-slate-900">{value}</span>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("PENDENTE");

  const { data: providers, isLoading } = useQuery({
    queryKey: ["admin", "providers"],
    queryFn: listAllProviders,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProviderStatus }) =>
      updateProviderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
  });

  const stats = useMemo(() => {
    const list = providers ?? [];
    return {
      total: list.length,
      pendentes: list.filter((p) => p.status === "PENDENTE").length,
      aprovados: list.filter((p) => p.status === "APROVADO").length,
    };
  }, [providers]);

  const filtered = useMemo(() => {
    const list = providers ?? [];
    if (tab === "TODOS") return list;
    return list.filter((p) => p.status === tab);
  }, [providers, tab]);

  const actionsFor = (p: Provider) => {
    const pendingId = mutation.isPending ? mutation.variables?.id : null;
    const busy = pendingId === p.id;
    return (
      <div className="flex flex-wrap gap-2">
        {p.status !== "APROVADO" && (
          <Button
            className="!px-3 !py-1.5 !text-xs"
            disabled={busy}
            onClick={() => mutation.mutate({ id: p.id, status: "APROVADO" })}
          >
            Aprovar
          </Button>
        )}
        {p.status === "APROVADO" && (
          <Button
            variant="secondary"
            className="!px-3 !py-1.5 !text-xs"
            disabled={busy}
            onClick={() => mutation.mutate({ id: p.id, status: "INATIVO" })}
          >
            Desativar
          </Button>
        )}
        {p.status !== "REJEITADO" && p.status !== "APROVADO" && (
          <Button
            variant="danger"
            className="!px-3 !py-1.5 !text-xs"
            disabled={busy}
            onClick={() => mutation.mutate({ id: p.id, status: "REJEITADO" })}
          >
            Rejeitar
          </Button>
        )}
        {(p.status === "REJEITADO" || p.status === "INATIVO") && (
          <Button
            className="!px-3 !py-1.5 !text-xs"
            disabled={busy}
            onClick={() => mutation.mutate({ id: p.id, status: "APROVADO" })}
          >
            Reativar
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Painel da equipe</h1>
        <p className="mt-1 text-sm text-slate-500">
          Valide a documentacao e gerencie a publicacao dos prestadores no
          catalogo.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total de cadastros" value={stats.total} />
        <StatCard label="Aguardando validacao" value={stats.pendentes} />
        <StatCard label="Ativos no catalogo" value={stats.aprovados} />
      </div>

      <div className="mt-8 flex gap-2 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner label="Carregando cadastros..." />
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          Nenhum prestador nesta aba.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <img
                src={p.photoUrl}
                alt={p.name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/prestador/${p.id}`}
                    className="font-semibold text-slate-900 hover:text-brand-700"
                  >
                    {p.name}
                  </Link>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {VEHICLE_LABELS[p.vehicleType]} &middot;{" "}
                  {p.regions.join(", ")}
                </p>
                {p.documentNote && (
                  <p className="mt-1 text-xs text-slate-400">
                    Nota: {p.documentNote}
                  </p>
                )}
              </div>
              {actionsFor(p)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
