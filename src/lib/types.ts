// Tipos de dominio do FreteHub.
// Estes tipos espelham o contrato esperado da API REST (Spring Boot) e sao
// usados tanto pela camada de mock (localStorage) quanto pelos componentes.

export type VehicleType =
  | "MOTO"
  | "CARRO"
  | "FIORINO"
  | "VAN"
  | "CAMINHAO_PEQUENO"
  | "CAMINHAO_BAU";

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  MOTO: "Moto",
  CARRO: "Carro",
  FIORINO: "Fiorino / Utilitario",
  VAN: "Van",
  CAMINHAO_PEQUENO: "Caminhao pequeno (3/4)",
  CAMINHAO_BAU: "Caminhao bau",
};

export type ServiceTag =
  | "FRETE_PEQUENO"
  | "MUDANCA_RESIDENCIAL"
  | "MUDANCA_COMERCIAL"
  | "ENTREGA_EXPRESSA"
  | "CARGA_FRAGIL"
  | "MONTAGEM_MOVEIS"
  | "AJUDANTE_CARGA";

export const SERVICE_LABELS: Record<ServiceTag, string> = {
  FRETE_PEQUENO: "Frete pequeno",
  MUDANCA_RESIDENCIAL: "Mudanca residencial",
  MUDANCA_COMERCIAL: "Mudanca comercial",
  ENTREGA_EXPRESSA: "Entrega expressa",
  CARGA_FRAGIL: "Carga fragil",
  MONTAGEM_MOVEIS: "Montagem de moveis",
  AJUDANTE_CARGA: "Ajudante de carga",
};

// Status do ciclo de curadoria de um motorista.
export type ProviderStatus = "PENDENTE" | "APROVADO" | "REJEITADO" | "INATIVO";

export const STATUS_LABELS: Record<ProviderStatus, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado (ativo)",
  REJEITADO: "Rejeitado",
  INATIVO: "Inativo",
};

export interface ContactChannels {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number; // 1..5
  comment: string;
  createdAt: string; // ISO
}

export interface Provider {
  id: string;
  name: string;
  headline: string; // chamada curta exibida no card
  bio: string;
  photoUrl: string;
  vehicleType: VehicleType;
  vehicleDescription: string;
  regions: string[]; // bairros / cidades de atuacao
  services: ServiceTag[];
  contacts: ContactChannels | null;
  type: ProviderType;
  available: boolean;
  documentsVerified: boolean;
  status: ProviderStatus;
  documentNote?: string | null; // observacao interna da curadoria
  createdAt: string;
  reviews: Review[];
}

export type ProviderType = "INTERNO" | "EXTERNO";
export type UserRole = "CLIENTE" | "ADMIN" | "MOTORISTA";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CatalogFilters {
  search: string;
  vehicleType: VehicleType | "";
  region: string;
  service: ServiceTag | "";
  type?: ProviderType | "";
  available?: boolean;
  city?: string;
}

// Ciclo de uma solicitacao de frete acompanhada pelo cliente e pela equipe.
export type FreightStatus =
  | "PENDENTE"
  | "CONTRAPROPOSTA"
  | "ACEITO"
  | "RECUSADO"
  | "EXPIRADO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "CANCELADO";

export const FREIGHT_STATUS_LABELS: Record<FreightStatus, string> = {
  PENDENTE: "Pendente",
  CONTRAPROPOSTA: "Contraproposta",
  ACEITO: "Aceito",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluido",
  CANCELADO: "Cancelado",
};

export interface FreightRequest {
  id: string;
  clientId: string;
  clientName: string;
  providerId: string | null;
  providerName: string | null;
  origin: string;
  destination: string;
  description: string;
  city: string | null;
  scheduledAt: string; // ISO UTC
  contactPhone: string | null;
  priceOffered: number | null;
  counterPrice: number | null;
  agreedPrice: number | null;
  responseDeadline: string | null;
  providerContacts: ContactChannels | null;
  clientContact: ContactChannels | null;
  vehicleType: VehicleType | null;
  service: ServiceTag | null;
  status: FreightStatus;
  createdAt: string;
  updatedAt: string;
}
