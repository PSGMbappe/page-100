/**
 * GridModel — 40-column × 25-row character cell storage.
 *
 * Zero browser-API dependencies; importable in Node.js.
 */

import { Cell, DEFAULT_CELL, ColourName, GridModel } from './types.js';

// ---------------------------------------------------------------------------
// Colour validation (inline, ColourModel not yet implemented)
// ---------------------------------------------------------------------------

const VALID_COLOURS: ColourName[] = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
];

function isValidColour(name: string): name is ColourName {
  return (VALID_COLOURS as string[]).includes(name);
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

function cloneCell(cell: Cell): Cell {
  return { ...cell };
}

function freshGrid(): Cell[][] {
  return Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => cloneCell(DEFAULT_CELL))
  );
}

function assertInRange(row: number, col: number): void {
  if (row < 0 || row > 24 || !Number.isInteger(row)) {
    throw new RangeError(
      `Row ${row} is out of range; valid range is 0–24.`
    );
  }
  if (col < 0 || col > 39 || !Number.isInteger(col)) {
    throw new RangeError(
      `Column ${col} is out of range; valid range is 0–39.`
    );
  }
}

function createGridModel(): GridModel {
  let grid: Cell[][] = freshGrid();

  return {
    rows: 25,
    cols: 40,

    getCell(row: number, col: number): Cell {
      assertInRange(row, col);
      return { ...grid[row][col] };
    },

    setCell(row: number, col: number, partial: Partial<Cell>): void {
      assertInRange(row, col);

      // Validate colour names before applying any changes
      if (partial.fg !== undefined && !isValidColour(partial.fg)) {
        throw new TypeError(
          `Invalid foreground colour "${partial.fg}". ` +
          `Must be one of: ${VALID_COLOURS.join(', ')}.`
        );
      }
      if (partial.bg !== undefined && !isValidColour(partial.bg)) {
        throw new TypeError(
          `Invalid background colour "${partial.bg}". ` +
          `Must be one of: ${VALID_COLOURS.join(', ')}.`
        );
      }

      grid[row][col] = { ...grid[row][col], ...partial };
    },

    reset(): void {
      grid = freshGrid();
    },
  };
}

export { createGridModel };
