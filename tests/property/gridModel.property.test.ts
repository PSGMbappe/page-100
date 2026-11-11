// Feature: teletext-engine, Property 6: Grid Cell read/write round-trip

/**
 * Property 6: Grid Cell read/write round-trip
 *
 * Writing a cell to any valid coordinate and immediately reading it back
 * must produce a cell whose every field equals what was written.
 *
 * Validates: Requirements 1.6, 14.1
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { createGridModel } from '../../src/engine/GridModel.js';
import { cellArbitrary } from './helpers.js';

describe('GridModel — Property 6: Grid Cell read/write round-trip', () => {
  it('reading back a written cell returns the same field values for all valid coordinates', () => {
    const coordinateArb = fc.record({
      row: fc.integer({ min: 0, max: 24 }),
      col: fc.integer({ min: 0, max: 39 }),
    });

    fc.assert(
      fc.property(coordinateArb, cellArbitrary, ({ row, col }, cell) => {
        const grid = createGridModel();

        grid.setCell(row, col, cell);
        const result = grid.getCell(row, col);

        // Every field written must come back unchanged
        return (
          result.char === cell.char &&
          result.fg === cell.fg &&
          result.bg === cell.bg &&
          result.mosaic === cell.mosaic &&
          result.doubleHeight === cell.doubleHeight &&
          result.flash === cell.flash &&
          result.concealed === cell.concealed
        );
      }),
      { numRuns: 100 },
    );
  });
});
