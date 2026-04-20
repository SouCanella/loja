import type { DeliveryOptionPublic, PaymentMethodPublic } from "@/lib/vitrine/types";

export const DELIVERY_FALLBACK: DeliveryOptionPublic[] = [
  {
    id: "retirada",
    title: "Retirar na loja",
    hint: "Sem taxa de entrega; combinamos horário pelo WhatsApp.",
  },
  {
    id: "loja_entrega",
    title: "Entrega pela loja",
    hint: "Taxa e região combinadas no WhatsApp.",
  },
  {
    id: "uber",
    title: "Uber Entregas",
    hint: "O pedido no app Uber é combinado por aqui (link, endereço e horário).",
  },
  {
    id: "nove",
    title: "99 Entregas",
    hint: "O pedido no app 99 é combinado por aqui (link, endereço e horário).",
  },
];

export const PAYMENT_FALLBACK: PaymentMethodPublic[] = [
  { id: "pix", label: "PIX (chave ou QR enviados após confirmação)" },
  { id: "entrega_dinheiro", label: "Dinheiro na entrega ou na retirada" },
  { id: "entrega_cartao", label: "Cartão de crédito/débito na entrega" },
  { id: "entrega_pix", label: "PIX na entrega (na hora)" },
];
