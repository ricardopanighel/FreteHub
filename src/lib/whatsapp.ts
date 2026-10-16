import type { FreightRequest } from "./types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "./types";
import { formatMoney, formatScheduledAt, onlyDigits } from "./format";

/**
 * Links do WhatsApp (wa.me) com mensagem ja preenchida.
 *
 * No diretorio, o contato e direto. Nos pedidos pelo app, o WhatsApp fica
 * disponivel apos o aceite; o cliente revisa a mensagem antes de enviar.
 */

// Numero no formato do wa.me: so digitos e com DDI. Cadastros feitos sem o
// 55 (ex.: "13 99999-0000") recebem o codigo do Brasil; com "+" na frente, o
// DDI ja foi digitado. Os demais seguem como foram cadastrados.
export function whatsappNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = onlyDigits(raw).replace(/^0+/, "");
  if (!digits) return null;
  const missingCountryCode =
    !raw.trim().startsWith("+") && (digits.length === 10 || digits.length === 11);
  return missingCountryCode ? `55${digits}` : digits;
}

export function whatsappLink(number: string, text?: string): string {
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// Mensagem do botao de WhatsApp no perfil, antes de qualquer pedido.
export function profileGreeting(): string {
  return "Ola! Encontrei seu perfil no FreteHub e gostaria de um orcamento de frete.";
}

// Mensagem para alinhar detalhes depois que o motorista aceita o pedido.
export function freightMessage(
  freight: FreightRequest,
  clientName?: string,
): string {
  const intro = clientName
    ? `Ola! Sou ${clientName} e encontrei seu perfil no FreteHub.`
    : "Ola! Encontrei seu perfil no FreteHub.";

  const lines = [
    intro,
    "Nosso frete foi aceito no app. Vamos alinhar os detalhes?",
    "",
    `Origem: ${freight.origin}`,
    `Destino: ${freight.destination}`,
    `Data e horario: ${formatScheduledAt(freight.scheduledAt)}`,
    `Valor combinado: ${formatMoney(freight.agreedPrice)}`,
  ];
  if (freight.vehicleType) {
    lines.push(`Veiculo: ${VEHICLE_LABELS[freight.vehicleType]}`);
  }
  if (freight.service) {
    lines.push(`Servico: ${SERVICE_LABELS[freight.service]}`);
  }
  lines.push(`Carga: ${freight.description}`);
  return lines.join("\n");
}
