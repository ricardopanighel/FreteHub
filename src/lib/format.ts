// "2026-10-14" (ou ISO completo) -> "14/10/2026", sem passar por Date para
// nao sofrer com fuso horario.
export function formatDay(value: string): string {
  const day = value.slice(0, 10);
  const [year, month, date] = day.split("-");
  if (!year || !month || !date) return value;
  return `${date}/${month}/${year}`;
}

// Data e hora vindas da API (Instant em UTC) no horario local.
export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR");
}

export function formatScheduledAt(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short",
  }).format(new Date(value));
}

export function formatMoney(value: number | null | undefined): string {
  return value == null ? "A combinar" : new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL",
  }).format(value);
}

// Aceita "1500", "1500,50", "1500.50" e o formato com milhar "1.500,00".
export function parseMoneyInput(value: string): number | null {
  const clean = value.trim();
  let normalized: string;
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(clean)) {
    normalized = clean.replace(/\./g, "").replace(",", ".");
  } else if (/^\d+(?:[,.]\d{1,2})?$/.test(clean)) {
    normalized = clean.replace(",", ".");
  } else {
    return null;
  }
  const number = Number(normalized);
  return number > 0 && number <= 100000 ? number : null;
}

// 180.5 -> "180,50", para preencher um campo de valor.
export function formatMoneyInput(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export function formatRemaining(deadline: string | null, now = Date.now()): string {
  if (!deadline) return "Sem prazo";
  const seconds = Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / 1000));
  if (seconds === 0) return "Prazo encerrado";
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")} restantes`;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}
