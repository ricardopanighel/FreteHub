import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  CaretLeftIcon,
  CaretRightIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import { listPublicProviders, listRegions } from "../lib/api";
import type { CatalogFilters, ServiceTag, VehicleType } from "../lib/types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "../lib/types";
import { ProviderCard, ProviderGridSkeleton } from "../components/ProviderCard";
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  PageHeader,
  Select,
  cx,
  queryErrorMessage,
} from "../components/ui";

const EMPTY: CatalogFilters = {
  search: "",
  vehicleType: "",
  region: "",
  service: "",
};

const PAGE_SIZE = 9;

function resultLabel(total: number, filtered: boolean): string {
  const noun = total === 1 ? "prestador" : "prestadores";
  if (!filtered) return `${total} ${noun} no catalogo`;
  return `${total} ${noun} ${total === 1 ? "encontrado" : "encontrados"}`;
}

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

  const { data, isLoading, isFetching, isError, error } = useQuery({
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PageHeader
        title="Catalogo de prestadores"
        description="Todos os prestadores abaixo foram validados pela equipe FreteHub."
      />

      {/* Barra de busca + filtros */}
      <Card className="mt-8 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="sm:col-span-3 lg:col-span-1">
            <Field label="Busca">
              <span className="relative block">
                <MagnifyingGlassIcon
                  weight="bold"
                  className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500"
                />
                <Input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar por nome, regiao ou tipo de servico..."
                  className="pl-11"
                />
              </span>
            </Field>
          </div>

          <Field label="Veiculo">
            <Select
              value={filters.vehicleType}
              onChange={(e) =>
                updateFilter("vehicleType", e.target.value as VehicleType | "")
              }
            >
              <option value="">Todos os veiculos</option>
              {Object.entries(VEHICLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Regiao">
            <Select
              value={filters.region}
              onChange={(e) => updateFilter("region", e.target.value)}
            >
              <option value="">Todas as regioes</option>
              {regions?.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Servico">
            <Select
              value={filters.service}
              onChange={(e) =>
                updateFilter("service", e.target.value as ServiceTag | "")
              }
            >
              <option value="">Todos os servicos</option>
              {Object.entries(SERVICE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {/* Contagem fica sempre no DOM para o leitor de tela anunciar a mudanca. */}
      <div className="mt-6 flex min-h-10 flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm font-medium text-slate-600">
          {data ? resultLabel(data.total, Boolean(hasActiveFilters)) : ""}
        </p>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <XIcon weight="bold" className="size-4" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="mt-4">
        <h2 className="sr-only">Resultados</h2>
        {isLoading ? (
          <ProviderGridSkeleton count={6} label="Buscando prestadores..." />
        ) : isError ? (
          <ErrorNote message={queryErrorMessage(error)} />
        ) : data && data.items.length > 0 ? (
          <>
            <div
              aria-busy={isFetching}
              className={cx(
                "grid gap-6 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3",
                isFetching && "opacity-60",
              )}
            >
              {data.items.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Paginacao"
                className="mt-12 flex items-center justify-center gap-3"
              >
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <CaretLeftIcon weight="bold" className="size-4" />
                  Anterior
                </Button>
                <span className="px-2 text-sm tabular-nums text-slate-600">
                  Pagina {page} de {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Proxima
                  <CaretRightIcon weight="bold" className="size-4" />
                </Button>
              </nav>
            )}
          </>
        ) : (
          <EmptyState
            icon={MagnifyingGlassIcon}
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
