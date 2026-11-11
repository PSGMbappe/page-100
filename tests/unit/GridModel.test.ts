/**
 * Unit tests for GridModel
 * Requirements: 1.6, 2.6, 14.2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createGridModel } from '../../src/engine/GridModel.js';
import { DEFAULT_CELL, Cell, GridModel } from '../../src/engine/types.js';

describe('GridModel', () => {
  let grid: GridModel;

  beforeEach(() => {
    grid = createGridModel();
  });

  // ---------------------------------------------------------------------------
  // Dimensions
  // ---------------------------------------------------------------------------

  describe('dimensions', () => {
    it('exposes rows = 25', () => {
      expect(grid.rows).toBe(25);
    });

    it('exposes cols = 40', () => {
      expect(grid.cols).toBe(40);
    });
  });

  // ---------------------------------------------------------------------------
  // getCell / setCell at boundary coordinates
  // ---------------------------------------------------------------------------

  describe('getCell at boundary coordinates', () => {
    it('reads cell at (0, 0) without throwing', () => {
      expect(() => grid.getCell(0, 0)).not.toThrow();
    });

    it('reads cell at (24, 39) without throwing', () => {
      expect(() => grid.getCell(24, 39)).not.toThrow();
    });

    it('returns a cell equal to DEFAULT_CELL at (0, 0) on fresh grid', () => {
      expect(grid.getCell(0, 0)).toEqual(DEFAULT_CELL);
    });

    it('returns a cell equal to DEFAULT_CELL at (24, 39) on fresh grid', () => {
      expect(grid.getCell(24, 39)).toEqual(DEFAULT_CELL);
    });
  });

  describe('setCell at boundary coordinates', () => {
    it('writes and reads back at (0, 0)', () => {
      grid.setCell(0, 0, { char: 0x41, fg: 'red' });
      const cell = grid.getCell(0, 0);
      expect(cell.char).toBe(0x41);
      expect(cell.fg).toBe('red');
    });

    it('writes and reads back at (24, 39)', () => {
      grid.setCell(24, 39, { char: 0x42, bg: 'blue' });
      const cell = grid.getCell(24, 39);
      expect(cell.char).toBe(0x42);
      expect(cell.bg).toBe('blue');
    });
  });

  // ---------------------------------------------------------------------------
  // RangeError on out-of-range reads
  // ---------------------------------------------------------------------------

  describe('getCell throws RangeError for out-of-range coordinates', () => {
    it('throws for row -1', () => {
      expect(() => grid.getCell(-1, 0)).toThrow(RangeError);
    });

    it('throws for row 25', () => {
      expect(() => grid.getCell(25, 0)).toThrow(RangeError);
    });

    it('throws for col -1', () => {
      expect(() => grid.getCell(0, -1)).toThrow(RangeError);
    });

    it('throws for col 40', () => {
      expect(() => grid.getCell(0, 40)).toThrow(RangeError);
    });
  });

  // ---------------------------------------------------------------------------
  // RangeError on out-of-range writes
  // ---------------------------------------------------------------------------

  describe('setCell throws RangeError for out-of-range coordinates', () => {
    it('throws for row -1', () => {
      expect(() => grid.setCell(-1, 0, { char: 0x41 })).toThrow(RangeError);
    });

    it('throws for row 25', () => {
      expect(() => grid.setCell(25, 0, { char: 0x41 })).toThrow(RangeError);
    });

    it('throws for col -1', () => {
      expect(() => grid.setCell(0, -1, { char: 0x41 })).toThrow(RangeError);
    });

    it('throws for col 40', () => {
      expect(() => grid.setCell(0, 40, { char: 0x41 })).toThrow(RangeError);
    });
  });

  // ---------------------------------------------------------------------------
  // reset() returns all cells to DEFAULT_CELL
  // ---------------------------------------------------------------------------

  describe('reset()', () => {
    it('returns a modified cell at (0,0) to DEFAULT_CELL', () => {
      grid.setCell(0, 0, { char: 0x41, fg: 'red', bg: 'green', mosaic: true });
      grid.reset();
      expect(grid.getCell(0, 0)).toEqual(DEFAULT_CELL);
    });

    it('returns a modified cell at (24,39) to DEFAULT_CELL', () => {
      grid.setCell(24, 39, { char: 0x5A, flash: true, doubleHeight: true });
      grid.reset();
      expect(grid.getCell(24, 39)).toEqual(DEFAULT_CELL);
    });

    it('resets all 25×40 cells to DEFAULT_CELL', () => {
      // Modify several cells across the grid
      grid.setCell(0, 0, { char: 0x41 });
      grid.setCell(12, 20, { fg: 'cyan', bg: 'magenta' });
      grid.setCell(24, 39, { mosaic: true, flash: true });

      grid.reset();

      let allDefault = true;
      for (let row = 0; row < 25; row++) {
        for (let col = 0; col < 40; col++) {
          if (JSON.stringify(grid.getCell(row, col)) !== JSON.stringify(DEFAULT_CELL)) {
            allDefault = false;
            break;
          }
        }
        if (!allDefault) break;
      }
      expect(allDefault).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid colour name rejection preserves existing colour
  // ---------------------------------------------------------------------------

  describe('setCell with invalid colour name', () => {
    it('throws TypeError for invalid fg colour', () => {
      expect(() => grid.setCell(0, 0, { fg: 'purple' as any })).toThrow(TypeError);
    });

    it('throws TypeError for invalid bg colour', () => {
      expect(() => grid.setCell(0, 0, { bg: 'orange' as any })).toThrow(TypeError);
    });

    it('preserves existing fg colour when an invalid fg is supplied', () => {
      grid.setCell(0, 0, { fg: 'cyan' });
      expect(() => grid.setCell(0, 0, { fg: 'purple' as any })).toThrow();
      expect(grid.getCell(0, 0).fg).toBe('cyan');
    });

    it('preserves existing bg colour when an invalid bg is supplied', () => {
      grid.setCell(0, 0, { bg: 'magenta' });
      expect(() => grid.setCell(0, 0, { bg: 'hotpink' as any })).toThrow();
      expect(grid.getCell(0, 0).bg).toBe('magenta');
    });

    it('preserves the entire cell when an invalid colour causes rejection', () => {
      grid.setCell(5, 10, { char: 0x48, fg: 'red', bg: 'yellow' });
      const before = grid.getCell(5, 10);

      expect(() => grid.setCell(5, 10, { fg: 'invisible' as any })).toThrow();

      expect(grid.getCell(5, 10)).toEqual(before);
    });
  });

  // ---------------------------------------------------------------------------
  // Partial updates only change specified fields
  // ---------------------------------------------------------------------------

  describe('setCell with valid partial updates', () => {
    it('only changes fg and leaves other fields untouched', () => {
      const initial: Partial<Cell> = { char: 0x48, fg: 'white', bg: 'black', flash: true };
      grid.setCell(3, 7, initial);
      grid.setCell(3, 7, { fg: 'green' });
      const cell = grid.getCell(3, 7);
      expect(cell.fg).toBe('green');
      expect(cell.char).toBe(0x48);
      expect(cell.bg).toBe('black');
      expect(cell.flash).toBe(true);
    });

    it('only changes bg and leaves other fields untouched', () => {
      grid.setCell(1, 1, { char: 0x50, fg: 'cyan', mosaic: true });
      grid.setCell(1, 1, { bg: 'blue' });
      const cell = grid.getCell(1, 1);
      expect(cell.bg).toBe('blue');
      expect(cell.char).toBe(0x50);
      expect(cell.fg).toBe('cyan');
      expect(cell.mosaic).toBe(true);
    });

    it('only changes char and leaves colour/attribute fields untouched', () => {
      grid.setCell(2, 2, { fg: 'red', bg: 'yellow', doubleHeight: true, flash: true });
      grid.setCell(2, 2, { char: 0x58 });
      const cell = grid.getCell(2, 2);
      expect(cell.char).toBe(0x58);
      expect(cell.fg).toBe('red');
      expect(cell.bg).toBe('yellow');
      expect(cell.doubleHeight).toBe(true);
      expect(cell.flash).toBe(true);
    });

    it('applies all fields when a full cell is supplied', () => {
      const full: Cell = {
        char: 0x61,
        fg: 'magenta',
        bg: 'green',
        mosaic: true,
        doubleHeight: false,
        flash: true,
        concealed: true,
      };
      grid.setCell(10, 20, full);
      expect(grid.getCell(10, 20)).toEqual(full);
    });
  });

  // ---------------------------------------------------------------------------
  // getCell returns a copy (mutation safety)
  // ---------------------------------------------------------------------------

  describe('getCell returns an independent copy', () => {
    it('mutating the returned cell does not affect the stored cell', () => {
      grid.setCell(0, 0, { char: 0x41 });
      const cell = grid.getCell(0, 0);
      (cell as any).char = 0xFF; // mutate the returned copy
      expect(grid.getCell(0, 0).char).toBe(0x41);
    });
  });
});
