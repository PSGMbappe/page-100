/**
 * FlashClock — one shared 1 Hz flash timer so every flashing cell on a page
 * blinks in sync (500 ms on, 500 ms off). No browser-API dependencies.
 */

import type { FlashClock } from './types';

export function createFlashClock(intervalMs = 500): FlashClock {
  let phase = true;
  let timer: ReturnType<typeof setInterval> | null = null;
  const subscribers = new Set<(phase: boolean) => void>();

  const notify = () => subscribers.forEach((cb) => cb(phase));

  return {
    get phase() {
      return phase;
    },

    subscribe(cb) {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },

    start() {
      if (timer !== null) return;
      timer = setInterval(() => {
        phase = !phase;
        notify();
      }, intervalMs);
    },

    stop() {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      phase = true;
      notify();
    },
  };
}
