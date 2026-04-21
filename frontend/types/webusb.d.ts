/**
 * Web USB API — `navigator.usb` não está em todas as lib DOM antigas;
 * declaração mínima para uso em `OrderPrintPanel` sem `as any`.
 */
export {};

declare global {
  interface Navigator {
    /** Web USB (Chrome/Edge, contexto seguro). Opcional: ausente noutros browsers. */
    readonly usb?: USB;
  }
}
