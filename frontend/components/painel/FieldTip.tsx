/** Dica curta ao pairar — ajuda o lojista sem poluir o layout. */
export function FieldTip({ text }: { text: string }) {
  return (
    <span
      className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold leading-none text-slate-500"
      title={text}
      role="img"
      aria-label={text}
    >
      ?
    </span>
  );
}
