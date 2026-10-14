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

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}
