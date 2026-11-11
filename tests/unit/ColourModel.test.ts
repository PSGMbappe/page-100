/**
 * Unit tests for ColourModel
 * Requirements: 2.4, 14.2
 */

import { describe, it, expect } from 'vitest';
import { createColourModel } from '../../src/engine/ColourModel.js';
import { VALID_COLOURS } from '../property/helpers.js';

describe('ColourModel', () => {
  const colourModel = createColourModel();

  // ---------------------------------------------------------------------------
  // toRGB — all eight colour mappings (Requirement 2.4)
  // ---------------------------------------------------------------------------

  describe('toRGB — fixed colour-to-RGB mappings', () => {
    it('maps black to #000000', () => {
      expect(colourModel.toRGB('black')).toBe('#000000');
    });

    it('maps red to #FF0000', () => {
      expect(colourModel.toRGB('red')).toBe('#FF0000');
    });

    it('maps green to #00FF00', () => {
      expect(colourModel.toRGB('green')).toBe('#00FF00');
    });

    it('maps yellow to #FFFF00', () => {
      expect(colourModel.toRGB('yellow')).toBe('#FFFF00');
    });

    it('maps blue to #0000FF', () => {
      expect(colourModel.toRGB('blue')).toBe('#0000FF');
    });

    it('maps magenta to #FF00FF', () => {
      expect(colourModel.toRGB('magenta')).toBe('#FF00FF');
    });

    it('maps cyan to #00FFFF', () => {
      expect(colourModel.toRGB('cyan')).toBe('#00FFFF');
    });

    it('maps white to #FFFFFF', () => {
      expect(colourModel.toRGB('white')).toBe('#FFFFFF');
    });

    it('returns a string in #RRGGBB format for every valid colour', () => {
      for (const colour of VALID_COLOURS) {
        expect(colourModel.toRGB(colour)).toMatch(/^#[0-9A-F]{6}$/);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // toRGB — throws for unknown names (Requirement 2.4)
  // ---------------------------------------------------------------------------

  describe('toRGB — throws for unknown colour names', () => {
    it('throws an error for an empty string', () => {
      expect(() => colourModel.toRGB('' as any)).toThrow();
    });

    it('throws an error for "purple"', () => {
      expect(() => colourModel.toRGB('purple' as any)).toThrow();
    });

    it('throws an error for "orange"', () => {
      expect(() => colourModel.toRGB('orange' as any)).toThrow();
    });

    it('throws an error for mixed-case "Red"', () => {
      expect(() => colourModel.toRGB('Red' as any)).toThrow();
    });

    it('throws an error for all-caps "BLACK"', () => {
      expect(() => colourModel.toRGB('BLACK' as any)).toThrow();
    });

    it('throws an error for "WHITE "  (trailing space)', () => {
      expect(() => colourModel.toRGB('WHITE ' as any)).toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // isValid — valid colour names (Requirement 2.4)
  // ---------------------------------------------------------------------------

  describe('isValid — returns true for all eight valid colour names', () => {
    for (const colour of VALID_COLOURS) {
      it(`returns true for "${colour}"`, () => {
        expect(colourModel.isValid(colour)).toBe(true);
      });
    }
  });

  // ---------------------------------------------------------------------------
  // isValid — invalid colour names (Requirement 2.4)
  // ---------------------------------------------------------------------------

  describe('isValid — returns false for invalid names', () => {
    it('returns false for empty string', () => {
      expect(colourModel.isValid('')).toBe(false);
    });

    it('returns false for mixed-case "Red"', () => {
      expect(colourModel.isValid('Red')).toBe(false);
    });

    it('returns false for mixed-case "Green"', () => {
      expect(colourModel.isValid('Green')).toBe(false);
    });

    it('returns false for all-caps "BLACK"', () => {
      expect(colourModel.isValid('BLACK')).toBe(false);
    });

    it('returns false for all-caps "WHITE"', () => {
      expect(colourModel.isValid('WHITE')).toBe(false);
    });

    it('returns false for all-caps "CYAN"', () => {
      expect(colourModel.isValid('CYAN')).toBe(false);
    });

    it('returns false for "purple"', () => {
      expect(colourModel.isValid('purple')).toBe(false);
    });

    it('returns false for "orange"', () => {
      expect(colourModel.isValid('orange')).toBe(false);
    });

    it('returns false for a numeric string "123"', () => {
      expect(colourModel.isValid('123')).toBe(false);
    });

    it('returns false for a name with leading whitespace " red"', () => {
      expect(colourModel.isValid(' red')).toBe(false);
    });

    it('returns false for a name with trailing whitespace "blue "', () => {
      expect(colourModel.isValid('blue ')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // isValid acts as a type-guard (narrow check)
  // ---------------------------------------------------------------------------

  describe('isValid — acts as a type-guard', () => {
    it('narrows the type to ColourName for a valid input', () => {
      const name: string = 'cyan';
      if (colourModel.isValid(name)) {
        // TypeScript would narrow `name` to ColourName here; runtime check:
        expect(VALID_COLOURS).toContain(name);
      } else {
        throw new Error('Expected isValid to return true for "cyan"');
      }
    });
  });
});
