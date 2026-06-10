import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listPublicProviders, listRegions } from "../lib/api";
import type { CatalogFilters, ServiceTag, VehicleType } from "../lib/types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import { ProviderCard } from "../components/ProviderCard";
import { Button, EmptyState, Input, Select, Spinner } from "../components/ui";

const EMPTY: CatalogFilters = {
  search: "",
  vehicleType: "",
  region: "",
  service: "",
};

const PAGE_SIZE = 9;

export function Catalog() {
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  // Debounce da busca textual para nao disparar a query a cada tecla.
  useEffect(() => {
    const id = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: listRegions,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["providers", filters, page],
    queryFn: () => listPublicProviders(filters, page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1),
    [data],
  );

  const updateFilter = <K extends keyof CatalogFilters>(
    key: K,
    value: CatalogFilters[K],
  ) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const hasActiveFilters =
    filters.search || filters.vehicleType || filters.region || filters.service;

  const clearAll = () => {
    setFilters(EMPTY);
    setSearchInput("");
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Catalogo de prestadores
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Todos os prestadores abaixo foram validados pela equipe FreteHub.
        </p>
      </header>

      {/* Barra de busca + filtros */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nome, regiao ou tipo de servico..."
            className="pl-10"
            aria-label="Buscar prestadores"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Select
            value={filters.vehicleType}
            onChange={(e) =>
              updateFilter("vehicleType", e.target.value as VehicleType | "")
            }
            aria-label="Filtrar por tipo de veiculo"
          >
            <option value="">Todos os veiculos</option>
            {Object.entries(VEHICLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Select
            value={filters.region}
            onChange={(e) => updateFilter("region", e.target.value)}
            aria-label="Filtrar por regiao"
          >
            <option value="">Todas as regioes</option>
            {regions?.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>

          <Select
            value={filters.service}
            onChange={(e) =>
              updateFilter("service", e.target.value as ServiceTag | "")
            }
            aria-label="Filtrar por servico"
          >
            <option value="">Todos os servicos</option>
            {Object.entries(SERVICE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {data ? `${data.total} prestador(es) encontrado(s)` : ""}
            </span>
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="mt-8">
        {isLoading ? (
          <Spinner label="Buscando prestadores..." />
        ) : data && data.items.length > 0 ? (
          <>
            <div
              className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${
                isFetching ? "opacity-60 transition" : ""
              }`}
            >
              {data.items.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-sm text-slate-500">
                  Pagina {page} de {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Proxima
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Nenhum prestador encontrado"
            description="Tente ajustar a busca ou remover alguns filtros."
            action={
              hasActiveFilters ? (
                <Button variant="secondary" onClick={clearAll}>
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
