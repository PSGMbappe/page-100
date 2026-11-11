// Feature: teletext-engine, Property 2: Mosaic sub-block count

/**
 * Property 2: Mosaic sub-block count
 *   For any valid mosaic character code, the number of active sub-blocks
 *   returned by subBlocks() SHALL equal the number of set bits in the
 *   decoded bitmask.
 *   Validates: Requirements 3.1, 3.2, 3.5
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { createMosaicRenderer } from '../../src/engine/MosaicRenderer.js';

const renderer = createMosaicRenderer();

const validCodeArb = fc.oneof(
  fc.integer({ min: 0x20, max: 0x3f }),
  fc.integer({ min: 0x60, max: 0x7f }),
);

function popcount(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

describe('MosaicRenderer — Property 2: Mosaic sub-block count', () => {
  it('active sub-blocks equal set bits in the decoded bitmask', () => {
    fc.assert(
      fc.property(validCodeArb, (code) => {
        const mask = renderer.decode(code);
        return renderer.subBlocks(mask).filter(Boolean).length === popcount(mask);
      }),
      { numRuns: 100 },
    );
  });

  it('each sub-block maps to its own bit (no transposition)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 63 }), (mask) => {
        const blocks = renderer.subBlocks(mask);
        return blocks.every((on, i) => on === (((mask >> i) & 1) === 1));
      }),
      { numRuns: 100 },
    );
  });
});
