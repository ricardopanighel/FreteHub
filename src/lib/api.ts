import type {
  CatalogFilters,
  Provider,
  ProviderStatus,
  Review,
  User,
} from "./types";
import { SEED_PROVIDERS, SEED_USERS } from "./seed";

/**
 * Camada de acesso a dados (mock).
 *
 * Esta camada simula a API REST do back-end (Spring Boot) usando o
 * localStorage do navegador. Todas as funcoes sao assincronas e retornam
 * Promises, exatamente como chamadas `fetch` reais retornariam. Quando o
 * back-end estiver pronto, basta substituir o corpo destas funcoes por
 * chamadas HTTP (ex: `fetch("/api/providers")`) mantendo as assinaturas.
 */

const PROVIDERS_KEY = "fretehub:providers";
const USERS_KEY = "fretehub:users";

type StoredUser = User & { password: string };

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function readProviders(): Provider[] {
  const raw = localStorage.getItem(PROVIDERS_KEY);
  if (!raw) {
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify(SEED_PROVIDERS));
    return structuredClone(SEED_PROVIDERS);
  }
  try {
    return JSON.parse(raw) as Provider[];
  } catch {
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify(SEED_PROVIDERS));
    return structuredClone(SEED_PROVIDERS);
  }
}

function writeProviders(providers: Provider[]): void {
  localStorage.setItem(PROVIDERS_KEY, JSON.stringify(providers));
}

function readUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    return structuredClone(SEED_USERS);
  }
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    return structuredClone(SEED_USERS);
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ----------------------------- Catalogo publico -----------------------------

export interface PaginatedProviders {
  items: Provider[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listPublicProviders(
  filters: CatalogFilters,
  page = 1,
  pageSize = 9,
): Promise<PaginatedProviders> {
  const all = readProviders().filter((p) => p.status === "APROVADO");

  const term = normalize(filters.search.trim());
  const filtered = all.filter((p) => {
    if (filters.vehicleType && p.vehicleType !== filters.vehicleType) {
      return false;
    }
    if (filters.service && !p.services.includes(filters.service)) {
      return false;
    }
    if (filters.region) {
      const hasRegion = p.regions.some((r) =>
        normalize(r).includes(normalize(filters.region)),
      );
      if (!hasRegion) return false;
    }
    if (term) {
      const haystack = normalize(
        [p.name, p.headline, p.bio, ...p.regions].join(" "),
      );
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return delay({ items, total: filtered.length, page, pageSize });
}

export async function getProvider(id: string): Promise<Provider | null> {
  const provider = readProviders().find((p) => p.id === id) ?? null;
  return delay(provider);
}

// Regioes distintas para alimentar o filtro do catalogo.
export async function listRegions(): Promise<string[]> {
  const regions = new Set<string>();
  readProviders()
    .filter((p) => p.status === "APROVADO")
    .forEach((p) => p.regions.forEach((r) => regions.add(r)));
  return delay([...regions].sort((a, b) => a.localeCompare(b)));
}

// ----------------------------- Cadastro / curadoria -------------------------

export type NewProviderInput = Omit<
  Provider,
  "id" | "status" | "createdAt" | "reviews"
>;

export async function createProvider(
  input: NewProviderInput,
): Promise<Provider> {
  const providers = readProviders();
  const provider: Provider = {
    ...input,
    id: `p-${crypto.randomUUID().slice(0, 8)}`,
    status: "PENDENTE",
    createdAt: new Date().toISOString(),
    reviews: [],
  };
  providers.unshift(provider);
  writeProviders(providers);
  return delay(provider);
}

// Admin: lista todos os prestadores (qualquer status).
export async function listAllProviders(): Promise<Provider[]> {
  const all = readProviders().sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return delay(all);
}

export async function updateProviderStatus(
  id: string,
  status: ProviderStatus,
  documentNote?: string,
): Promise<Provider> {
  const providers = readProviders();
  const index = providers.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Prestador nao encontrado");
  providers[index] = {
    ...providers[index],
    status,
    documentNote: documentNote ?? providers[index].documentNote,
  };
  writeProviders(providers);
  return delay(providers[index]);
}

export async function addReview(
  providerId: string,
  review: Omit<Review, "id" | "createdAt">,
): Promise<Provider> {
  const providers = readProviders();
  const index = providers.findIndex((p) => p.id === providerId);
  if (index === -1) throw new Error("Prestador nao encontrado");
  const full: Review = {
    ...review,
    id: `r-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  };
  providers[index] = {
    ...providers[index],
    reviews: [full, ...providers[index].reviews],
  };
  writeProviders(providers);
  return delay(providers[index]);
}

// ----------------------------- Autenticacao (mock) --------------------------

export interface AuthResult {
  user: User;
  token: string;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const users = readUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim(),
  );
  if (!found || found.password !== password) {
    throw new Error("E-mail ou senha invalidos.");
  }
  const { password: _omit, ...user } = found;
  void _omit;
  // Token "JWT" simulado apenas para o MVP front-end.
  const token = btoa(`${user.id}:${Date.now()}`);
  return delay({ user, token });
}

export async function registerClient(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
    throw new Error("Ja existe uma conta com este e-mail.");
  }
  const user: StoredUser = {
    id: `u-${crypto.randomUUID().slice(0, 8)}`,
    name: name.trim(),
    email: email.trim(),
    role: "CLIENTE",
    password,
  };
  users.push(user);
  writeUsers(users);
  const { password: _omit, ...safe } = user;
  void _omit;
  const token = btoa(`${user.id}:${Date.now()}`);
  return delay({ user: safe, token });
}
