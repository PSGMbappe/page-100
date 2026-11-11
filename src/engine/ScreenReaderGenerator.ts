/**
 * ScreenReaderGenerator — plain-text version of the grid for assistive tech.
 * Mosaic cells become "[graphic]" (runs of mosaics collapse to one),
 * concealed cells stay blank unless Reveal is active.
 */

import type { GridModel, ScreenReaderGenerator } from './types';

export function createScreenReaderGenerator(): ScreenReaderGenerator {
  return {
    generate(grid: GridModel, revealActive: boolean): string[] {
      const lines: string[] = [];
      for (let row = 0; row < grid.rows; row++) {
        let line = '';
        let inGraphic = false;
        for (let col = 0; col < grid.cols; col++) {
          const cell = grid.getCell(row, col);
          if (cell.mosaic) {
            if (!inGraphic) line += '[graphic]';
            inGraphic = true;
            continue;
          }
          inGraphic = false;
          if (cell.concealed && !revealActive) {
            line += ' ';
          } else {
            line += String.fromCodePoint(cell.char);
          }
        }
        const trimmed = line.replace(/ +$/u, '');
        if (trimmed.trim().length > 0) lines.push(trimmed);
      }
      return lines;
    },
  };
}
