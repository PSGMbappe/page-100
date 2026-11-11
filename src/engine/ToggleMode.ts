/**
 * RevealMode and HoldMode — simple on/off display modes.
 * Reveal is display-only: it never changes cell data.
 */

export interface ToggleMode {
  readonly isActive: boolean;
  activate(): void;
  deactivate(): void;
  toggle(): boolean;
  /** Back to the inactive state (used on every page change). */
  reset(): void;
}

function createToggleMode(): ToggleMode {
  let active = false;
  return {
    get isActive() {
      return active;
    },
    activate() {
      active = true;
    },
    deactivate() {
      active = false;
    },
    toggle() {
      active = !active;
      return active;
    },
    reset() {
      active = false;
    },
  };
}

export const createRevealMode = createToggleMode;
export const createHoldMode = createToggleMode;
