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
  "id" | "status" | "createdAt" | "reviews" | "type" | "available" | "documentsVerified" | "contacts"
> & { contacts: NonNullable<Provider["contacts"]> };

export interface NewFreightInput {
  providerId: string | null;
  city: string;
  origin: string;
  destination: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  contactPhone: string;
  priceOffered: number;
  vehicleType: VehicleType | "";
  service: ServiceTag | "";
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
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
  const auth = path.startsWith("/api/auth/") ? {} : authHeader();
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

  // So uma rota protegida pode invalidar a sessao salva.
  if (response.status === 401 && auth.Authorization) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as
    | (T & { message?: string })
    | null;

  if (!response.ok) {
    throw new ApiError(body?.message || "Nao foi possivel concluir a operacao.", response.status);
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
  if (filters.type) params.set("type", filters.type);
  if (filters.city) params.set("city", filters.city);
  if (filters.available !== undefined) params.set("available", String(filters.available));
  return `/api/providers?${params.toString()}`;
}

export function listPublicProviders(
  filters: CatalogFilters,
  page = 1,
  pageSize = 9,
): Promise<PaginatedProviders> {
  return request(catalogQuery(filters, page, pageSize));
}

export async function listAvailableDrivers(city: string): Promise<Provider[]> {
  const filters: CatalogFilters = {
    search: "", vehicleType: "", region: "", service: "",
    type: "INTERNO", available: true, city,
  };
  const pageSize = 50;
  const first = await listPublicProviders(filters, 1, pageSize);
  const providers = [...first.items];
  for (let page = 2; page <= Math.ceil(first.total / pageSize); page++) {
    const result = await listPublicProviders(filters, page, pageSize);
    providers.push(...result.items);
  }
  return providers;
}

export function getProvider(id: string): Promise<Provider | null> {
  return request<Provider>(`/api/providers/${id}`).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  });
}

export function listRegions(): Promise<string[]> {
  return request("/api/regions");
}

export function listCities(): Promise<string[]> {
  return request("/api/cities");
}

export function createProvider(input: NewProviderInput): Promise<Provider> {
  return request("/api/providers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function registerDriver(email: string, password: string, provider: NewProviderInput): Promise<AuthResult> {
  return request("/api/auth/register-driver", {
    method: "POST",
    body: JSON.stringify({ email, password, provider }),
  });
}

export function getMyDriverProfile(): Promise<Provider> {
  return request("/api/driver/me");
}

export function updateAvailability(available: boolean): Promise<Provider> {
  return request("/api/driver/me/availability", {
    method: "PATCH", body: JSON.stringify({ available }),
  });
}

export function listDriverFreights(): Promise<FreightRequest[]> {
  return request("/api/driver/freights");
}

function driverAction(id: string, action: string, body?: object): Promise<FreightRequest> {
  return request(`/api/driver/freights/${id}/${action}`, {
    method: "POST", ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export const acceptDriverFreight = (id: string) => driverAction(id, "accept");
export const rejectDriverFreight = (id: string) => driverAction(id, "reject");
export const counterDriverFreight = (id: string, price: number) => driverAction(id, "counter-offer", { price });
export const startDriverFreight = (id: string) => driverAction(id, "start");
export const completeDriverFreight = (id: string) => driverAction(id, "complete");

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

export function respondToCounterOffer(id: string, accept: boolean): Promise<FreightRequest> {
  return request(`/api/freights/${id}/counter-offer/${accept ? "accept" : "reject"}`, { method: "POST" });
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
