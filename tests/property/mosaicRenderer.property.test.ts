// Feature: teletext-engine, Property 1: Mosaic character round-trip

/**
 * Property tests for MosaicRenderer.
 *
 * Property 1: Mosaic character round-trip
 *   For any valid mosaic character code (0x20–0x3F or 0x60–0x7F),
 *   encode(decode(code)) SHALL equal the original code.
 *   For any valid 6-bit bitmask (0–63),
 *   decode(encode(mask)) SHALL equal the original mask.
 *   Validates: Requirements 3.2, 3.5, 14.5
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { createMosaicRenderer } from '../../src/engine/MosaicRenderer.js';

const renderer = createMosaicRenderer();

/** Arbitrary producing valid mosaic character codes from both sub-ranges. */
const validCodeArb = fc.oneof(
  fc.integer({ min: 0x20, max: 0x3F }),
  fc.integer({ min: 0x60, max: 0x7F }),
);

/** Arbitrary producing valid 6-bit bitmask values. */
const validMaskArb = fc.integer({ min: 0, max: 63 });

// ---------------------------------------------------------------------------
// Property 1: Mosaic character round-trip
// ---------------------------------------------------------------------------

describe('MosaicRenderer — Property 1: Mosaic character round-trip', () => {
  it('encode(decode(code)) === code for all valid mosaic character codes', () => {
    // Feature: teletext-engine, Property 1: Mosaic character round-trip
    // Validates: Requirements 3.2, 3.5, 14.5
    fc.assert(
      fc.property(validCodeArb, (code) => {
        const mask = renderer.decode(code);
        const roundTripped = renderer.encode(mask);
        return roundTripped === code;
      }),
      { numRuns: 100 },
    );
  });

  it('decode(encode(mask)) === mask for all valid 6-bit bitmasks', () => {
    // Feature: teletext-engine, Property 1: Mosaic character round-trip
    // Validates: Requirements 3.2, 3.5, 14.5
    fc.assert(
      fc.property(validMaskArb, (mask) => {
        const code = renderer.encode(mask);
        const roundTripped = renderer.decode(code);
        return roundTripped === mask;
      }),
      { numRuns: 100 },
    );
  });
});
