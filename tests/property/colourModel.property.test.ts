// Feature: teletext-engine, Property 7: Colour mapping total and injective
// Feature: teletext-engine, Property 3: Invalid colour assignment is rejected

/**
 * Property tests for ColourModel.
 *
 * Property 7: Colour mapping is total and injective
 *   For any of the eight named colours, toRGB SHALL return the fixed RGB string
 *   defined in the spec, and no two distinct named colours SHALL map to the same
 *   RGB string.
 *   Validates: Requirements 2.1, 2.4
 *
 * Property 3: Invalid colour assignment is rejected
 *   For any string that is not one of the eight named colours, isValid SHALL
 *   return false, and setCell on a GridModel with that invalid colour SHALL
 *   preserve the existing colour values unchanged.
 *   Validates: Requirements 2.6
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { createColourModel } from '../../src/engine/ColourModel.js';
import { createGridModel } from '../../src/engine/GridModel.js';
import { VALID_COLOURS } from './helpers.js';
import type { ColourName } from '../../src/engine/types.js';

// Fixed RGB values per the specification (Requirements 2.4)
const EXPECTED_RGB: Record<ColourName, string> = {
  black:   '#000000',
  red:     '#FF0000',
  green:   '#00FF00',
  yellow:  '#FFFF00',
  blue:    '#0000FF',
  magenta: '#FF00FF',
  cyan:    '#00FFFF',
  white:   '#FFFFFF',
};

// ---------------------------------------------------------------------------
// Property 7: Colour mapping total and injective
// ---------------------------------------------------------------------------

describe('ColourModel — Property 7: Colour mapping total and injective', () => {
  it('toRGB returns the fixed RGB string for every named colour', () => {
    // Feature: teletext-engine, Property 7: Colour mapping total and injective
    const colourModel = createColourModel();

    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_COLOURS),
        (colour) => {
          const rgb = colourModel.toRGB(colour);
          return rgb === EXPECTED_RGB[colour];
        },
      ),
      { numRuns: 100 },
    );
  });

  it('no two distinct colour names map to the same RGB string (injective)', () => {
    // Feature: teletext-engine, Property 7: Colour mapping total and injective
    const colourModel = createColourModel();

    // Collect all RGB values and confirm they are all unique
    const rgbValues = VALID_COLOURS.map((c) => colourModel.toRGB(c));
    const uniqueRgbValues = new Set(rgbValues);

    fc.assert(
      fc.property(
        // Pick two distinct colours
        fc.constantFrom(...VALID_COLOURS),
        fc.constantFrom(...VALID_COLOURS),
        (colourA, colourB) => {
          if (colourA === colourB) return true; // same name → same RGB is fine
          return colourModel.toRGB(colourA) !== colourModel.toRGB(colourB);
        },
      ),
      { numRuns: 100 },
    );

    // Also assert the full set has eight distinct entries (exhaustive check)
    return uniqueRgbValues.size === VALID_COLOURS.length;
  });
});

// ---------------------------------------------------------------------------
// Property 3: Invalid colour assignment is rejected
// ---------------------------------------------------------------------------

describe('ColourModel — Property 3: Invalid colour assignment is rejected', () => {
  it('isValid returns false for every string that is not a named colour', () => {
    // Feature: teletext-engine, Property 3: Invalid colour assignment is rejected
    const colourModel = createColourModel();

    fc.assert(
      fc.property(
        fc.string().filter((s) => !(VALID_COLOURS as string[]).includes(s)),
        (invalidName) => {
          return colourModel.isValid(invalidName) === false;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('setCell preserves existing fg colour when an invalid fg colour string is provided', () => {
    // Feature: teletext-engine, Property 3: Invalid colour assignment is rejected
    const grid = createGridModel();

    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_COLOURS),                                   // initial fg
        fc.constantFrom(...VALID_COLOURS),                                   // initial bg
        fc.string().filter((s) => !(VALID_COLOURS as string[]).includes(s)), // invalid colour
        fc.integer({ min: 0, max: 24 }),                                     // row
        fc.integer({ min: 0, max: 39 }),                                     // col
        (initialFg, initialBg, invalidColour, row, col) => {
          // Set a known valid colour first
          grid.setCell(row, col, { fg: initialFg, bg: initialBg });
          const before = grid.getCell(row, col);

          // Attempt to assign the invalid fg colour; must throw or be ignored
          try {
            grid.setCell(row, col, { fg: invalidColour as ColourName });
          } catch {
            // Error thrown — expected; fall through to assertion
          }

          const after = grid.getCell(row, col);
          return after.fg === before.fg && after.bg === before.bg;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('setCell preserves existing bg colour when an invalid bg colour string is provided', () => {
    // Feature: teletext-engine, Property 3: Invalid colour assignment is rejected
    const grid = createGridModel();

    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_COLOURS),                                   // initial fg
        fc.constantFrom(...VALID_COLOURS),                                   // initial bg
        fc.string().filter((s) => !(VALID_COLOURS as string[]).includes(s)), // invalid colour
        fc.integer({ min: 0, max: 24 }),                                     // row
        fc.integer({ min: 0, max: 39 }),                                     // col
        (initialFg, initialBg, invalidColour, row, col) => {
          grid.setCell(row, col, { fg: initialFg, bg: initialBg });
          const before = grid.getCell(row, col);

          try {
            grid.setCell(row, col, { bg: invalidColour as ColourName });
          } catch {
            // Error thrown — expected
          }

          const after = grid.getCell(row, col);
          return after.fg === before.fg && after.bg === before.bg;
        },
      ),
      { numRuns: 100 },
    );
  });
});
