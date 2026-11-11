/**
 * SubPageRotator — advances multi-part pages every 15 s, wrapping around,
 * and pauses while held. No browser-API dependencies.
 */

import type { SubPageRotator } from './types';

export function createSubPageRotator(intervalMs = 15_000): SubPageRotator {
  let total = 1;
  let index = 0;
  let held = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const clear = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const rotator: SubPageRotator = {
    onAdvance: () => {},

    get currentIndex() {
      return index;
    },

    get isHeld() {
      return held;
    },

    start(totalSubPages: number) {
      clear();
      held = false;
      if (!Number.isInteger(totalSubPages) || totalSubPages < 1) {
        console.warn(`SubPageRotator: invalid sub-page count ${totalSubPages}; using 1`);
        totalSubPages = 1;
      }
      total = totalSubPages;
      index = 0;
      if (total > 1) {
        timer = setInterval(() => {
          if (held) return;
          index = (index + 1) % total;
          rotator.onAdvance(index);
        }, intervalMs);
      }
    },

    stop() {
      clear();
      held = false;
    },

    hold() {
      held = true;
    },

    resume() {
      held = false;
    },
  };

  return rotator;
}
