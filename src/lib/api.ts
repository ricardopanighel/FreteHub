import type {
  CatalogFilters,
  FreightRequest,
  FreightStatus,
  Provider,
  ProviderStatus,
  ServiceTag,
  User,
  VehicleType,
} from "./types";

/**
 * Camada de acesso a dados.
 *
 * As assinaturas espelham a API REST (Spring Boot). Em desenvolvimento o Vite
 * encaminha `/api` para http://localhost:8080. Fora do dev, defina VITE_API_URL.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "";

// Disparado quando a API recusa o token enviado (expirado ou invalido).
// O AuthProvider escuta e encerra a sessao local.
export const SESSION_EXPIRED_EVENT = "fretehub:session-expired";

export interface PaginatedProviders {
  items: Provider[];
  total: number;
  page: number;
  pageSize: number;
}

export type NewProviderInput = Omit<
  Provider,
  "id" | "status" | "createdAt" | "reviews"
>;

export interface NewFreightInput {
  providerId: string | null;
  origin: string;
  destination: string;
  description: string;
  scheduledDate: string;
  vehicleType: VehicleType | "";
  service: ServiceTag | "";
}

export interface AuthResult {
  user: User;
  token: string;
}

function authHeader(): Record<string, string> {
  try {
    const raw = localStorage.getItem("fretehub:auth");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ? { Authorization: `Bearer ${parsed.token}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = authHeader();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...auth,
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Nao foi possivel conectar ao servidor.");
  }

  // So conta como sessao vencida se havia token: o 401 de senha errada no
  // login nao deve derrubar nada.
  if (response.status === 401 && auth.Authorization) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok) {
    throw new Error(body?.message || "Nao foi possivel concluir a operacao.");
  }
  return body as T;
}

function catalogQuery(filters: CatalogFilters, page: number, pageSize: number): string {
  const params = new URLSearchParams({
    search: filters.search,
    vehicleType: filters.vehicleType,
    region: filters.region,
    service: filters.service,
    page: String(page),
    pageSize: String(pageSize),
  });
  return `/api/providers?${params.toString()}`;
}

export function listPublicProviders(
  filters: CatalogFilters,
  page = 1,
  pageSize = 9,
): Promise<PaginatedProviders> {
  return request(catalogQuery(filters, page, pageSize));
}

export function getProvider(id: string): Promise<Provider | null> {
  return request<Provider>(`/api/providers/${id}`).catch((error: unknown) => {
    if (error instanceof Error && error.message === "Prestador nao encontrado.") {
      return null;
    }
    throw error;
  });
}

export function listRegions(): Promise<string[]> {
  return request("/api/regions");
}

export function createProvider(input: NewProviderInput): Promise<Provider> {
  return request("/api/providers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listAllProviders(): Promise<Provider[]> {
  return request("/api/admin/providers");
}

export function updateProviderStatus(
  id: string,
  status: ProviderStatus,
  documentNote?: string,
): Promise<Provider> {
  return request(`/api/admin/providers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, documentNote }),
  });
}

export function addReview(
  providerId: string,
  review: { rating: number; comment: string },
): Promise<Provider> {
  return request(`/api/providers/${providerId}/reviews`, {
    method: "POST",
    body: JSON.stringify(review),
  });
}

export function createFreight(input: NewFreightInput): Promise<FreightRequest> {
  return request("/api/freights", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      providerId: input.providerId || null,
      vehicleType: input.vehicleType || null,
      service: input.service || null,
    }),
  });
}

export function listMyFreights(): Promise<FreightRequest[]> {
  return request("/api/freights/mine");
}

export function listAllFreights(): Promise<FreightRequest[]> {
  return request("/api/admin/freights");
}

export function updateFreightStatus(
  id: string,
  status: FreightStatus,
): Promise<FreightRequest> {
  return request(`/api/admin/freights/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function cancelFreight(id: string): Promise<FreightRequest> {
  return request(`/api/freights/${id}/cancel`, { method: "POST" });
}

export function login(email: string, password: string): Promise<AuthResult> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerClient(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}
