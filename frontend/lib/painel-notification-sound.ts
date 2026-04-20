/**
 * Alerta sonoro discreto para novo pedido (Web Audio API).
 * Muitos browsers exigem interacção do utilizador antes de tocar — usar `unlockNotificationAudio` no primeiro clique.
 */

let sharedCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new AC();
  }
  return sharedCtx;
}

/** Chamar uma vez após clique/toque no painel para desbloquear áudio (política dos browsers). */
export function unlockNotificationAudio(): void {
  const ctx = getContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
}

/** Dois bipes curtos (~880 Hz + ~660 Hz). */
export async function playNewOrderChime(): Promise<void> {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }
  if (ctx.state !== "running") {
    return;
  }
  const t0 = ctx.currentTime;
  const beep = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t0 + start);
    gain.gain.setValueAtTime(0, t0 + start);
    gain.gain.linearRampToValueAtTime(0.07, t0 + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0 + start);
    osc.stop(t0 + start + dur + 0.02);
  };
  beep(880, 0, 0.1);
  beep(660, 0.12, 0.1);
}

export const PAINEL_NOTIF_SOUND_KEY = "painel_notif_sound";

export function getSoundEnabledFromStorage(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(PAINEL_NOTIF_SOUND_KEY);
  if (v === null) return true;
  return v === "1";
}

export function setSoundEnabledInStorage(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PAINEL_NOTIF_SOUND_KEY, enabled ? "1" : "0");
}
