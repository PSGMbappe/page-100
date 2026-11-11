/**
 * Shared fast-check arbitraries for property tests.
 * Importable in Node.js with no browser-API dependencies.
 */

import * as fc from 'fast-check';
import type { Cell, ColourName } from '../../src/engine/types.js';

export const VALID_COLOURS: ColourName[] = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
];

export const colourArb: fc.Arbitrary<ColourName> = fc.constantFrom(...VALID_COLOURS);

/** Generates a random valid Cell with all fields populated. */
export const cellArbitrary: fc.Arbitrary<Cell> = fc.record({
  char: fc.integer({ min: 0x20, max: 0x7E }),
  fg: colourArb,
  bg: colourArb,
  mosaic: fc.boolean(),
  doubleHeight: fc.boolean(),
  flash: fc.boolean(),
  concealed: fc.boolean(),
});
