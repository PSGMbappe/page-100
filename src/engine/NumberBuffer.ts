/**
 * NumberBuffer — accumulates up to three digit characters for page navigation input.
 * Pure data structure with zero browser-API dependencies.
 */

import type { NumberBuffer } from './types';

export function createNumberBuffer(): NumberBuffer {
  let digits = '';

  return {
    get digits(): string {
      return digits;
    },

    append(digit: string): boolean {
      if (digits.length >= 3) {
        return false;
      }
      digits += digit;
      return true;
    },

    backspace(): boolean {
      if (digits.length === 0) {
        return false;
      }
      digits = digits.slice(0, -1);
      return true;
    },

    clear(): void {
      digits = '';
    },

    get isFull(): boolean {
      return digits.length === 3;
    },

    get isEmpty(): boolean {
      return digits.length === 0;
    },
  };
}
