import type { FreightRequest } from "./types";
import { SERVICE_LABELS, VEHICLE_LABELS } from "./types";
import { formatDay, onlyDigits } from "./format";

/**
 * Links do WhatsApp (wa.me) com mensagem ja preenchida.
 *
 * O contato com o prestador continua externo: a plataforma so monta o texto
 * e abre a conversa no WhatsApp do proprio cliente, que revisa e envia.
 */

// Numero no formato do wa.me: so digitos e com DDI. Cadastros feitos sem o
// 55 (ex.: "13 99999-0000") recebem o codigo do Brasil; com "+" na frente, o
// DDI ja foi digitado. Os demais seguem como foram cadastrados.
export function whatsappNumber(raw: string | undefined): string | null {
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

// Mensagem enviada depois de registrar o pedido, com os dados do formulario.
export function freightMessage(
  freight: FreightRequest,
  clientName?: string,
): string {
  const intro = clientName
    ? `Ola! Sou ${clientName} e encontrei seu perfil no FreteHub.`
    : "Ola! Encontrei seu perfil no FreteHub.";

  const lines = [
    intro,
    "Registrei um pedido de frete com estes dados:",
    "",
    `Origem: ${freight.origin}`,
    `Destino: ${freight.destination}`,
    `Data desejada: ${formatDay(freight.scheduledDate)}`,
  ];
  if (freight.vehicleType) {
    lines.push(`Veiculo: ${VEHICLE_LABELS[freight.vehicleType]}`);
  }
  if (freight.service) {
    lines.push(`Servico: ${SERVICE_LABELS[freight.service]}`);
  }
  lines.push(`Carga: ${freight.description}`, "", "Pode me passar um orcamento?");
  return lines.join("\n");
}
