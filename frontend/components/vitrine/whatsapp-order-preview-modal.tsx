type Props = {
  open: boolean;
  onClose: () => void;
  messageText: string;
  waUrl: string;
};

export function WhatsAppOrderPreviewModal({ open, onClose, messageText, waUrl }: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-preview-title"
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-loja-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-loja-ink/10 px-4 py-3">
          <h2 id="wa-preview-title" className="text-lg font-bold">
            Mensagem do pedido
          </h2>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-loja-muted hover:bg-loja-ink/5"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
        <p className="border-b border-loja-ink/5 px-4 py-2 text-[0.75rem] text-loja-muted">
          Será enviada para o WhatsApp da loja com o texto abaixo.
        </p>
        <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap break-words px-4 py-3 text-[0.82rem] text-loja-ink">
          {messageText || "—"}
        </pre>
        <div className="flex flex-wrap gap-2 border-t border-loja-ink/10 p-4">
          <button
            type="button"
            className="flex-1 rounded-xl border border-loja-ink/15 py-3 text-sm font-semibold"
            onClick={onClose}
          >
            Ajustar carrinho
          </button>
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl bg-loja-whatsapp py-3 text-center text-sm font-bold text-white"
              onClick={onClose}
            >
              Abrir WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
