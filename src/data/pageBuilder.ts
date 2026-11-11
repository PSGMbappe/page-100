/**
 * Helpers for composing teletext pages: text runs, background bands,
 * mosaic pixel art and big block letters.
 */

import type { Cell, ColourName } from '../engine/types';
import { DEFAULT_CELL } from '../engine/types';
import { createMosaicRenderer } from '../engine/MosaicRenderer';

const mosaic = createMosaicRenderer();

export interface TextStyle {
  fg?: ColourName;
  bg?: ColourName;
  doubleHeight?: boolean;
  flash?: boolean;
  concealed?: boolean;
}

export interface PageBuilder {
  /** Write a text run starting at (row, col); clipped at column 39. */
  text(row: number, col: number, str: string, style?: TextStyle): PageBuilder;
  /** Paint a background colour across columns [from, to] on the given rows. */
  band(rowFrom: number, rowTo: number, bg: ColourName, colFrom?: number, colTo?: number): PageBuilder;
  /** Draw pixel art: '#' = lit pixel. Each cell covers 2×3 pixels. */
  pixels(row: number, col: number, art: string[], fg: ColourName, bg?: ColourName): PageBuilder;
  /** Place a single mosaic cell from a 6-bit mask. */
  block(row: number, col: number, mask: number, fg: ColourName, bg?: ColourName): PageBuilder;
  /** The finished 25×40 cell array. */
  build(): Cell[][];
}

export function createPageBuilder(): PageBuilder {
  const cells: Cell[][] = Array.from({ length: 25 }, () =>
    Array.from({ length: 40 }, () => ({ ...DEFAULT_CELL })),
  );

  const inGrid = (r: number, c: number) => r >= 0 && r < 25 && c >= 0 && c < 40;

  const builder: PageBuilder = {
    text(row, col, str, style = {}) {
      [...str].forEach((ch, i) => {
        const c = col + i;
        if (!inGrid(row, c)) return;
        const prev = cells[row][c];
        cells[row][c] = {
          ...DEFAULT_CELL,
          char: ch.codePointAt(0) ?? 0x20,
          fg: style.fg ?? 'white',
          bg: style.bg ?? prev.bg,
          doubleHeight: style.doubleHeight ?? false,
          flash: style.flash ?? false,
          concealed: style.concealed ?? false,
        };
      });
      return builder;
    },

    band(rowFrom, rowTo, bg, colFrom = 0, colTo = 39) {
      for (let r = rowFrom; r <= rowTo; r++) {
        for (let c = colFrom; c <= colTo; c++) {
          if (inGrid(r, c)) cells[r][c] = { ...cells[r][c], bg };
        }
      }
      return builder;
    },

    pixels(row, col, art, fg, bg) {
      const width = Math.max(...art.map((l) => l.length));
      const cellRows = Math.ceil(art.length / 3);
      const cellCols = Math.ceil(width / 2);
      const lit = (x: number, y: number) => art[y]?.[x] === '#';
      for (let cr = 0; cr < cellRows; cr++) {
        for (let cc = 0; cc < cellCols; cc++) {
          const x = cc * 2;
          const y = cr * 3;
          const mask =
            (lit(x, y) ? 1 : 0) |
            (lit(x + 1, y) ? 2 : 0) |
            (lit(x, y + 1) ? 4 : 0) |
            (lit(x + 1, y + 1) ? 8 : 0) |
            (lit(x, y + 2) ? 16 : 0) |
            (lit(x + 1, y + 2) ? 32 : 0);
          builder.block(row + cr, col + cc, mask, fg, bg);
        }
      }
      return builder;
    },

    block(row, col, mask, fg, bg) {
      if (!inGrid(row, col)) return builder;
      cells[row][col] = {
        ...DEFAULT_CELL,
        char: mosaic.encode(mask),
        mosaic: true,
        fg,
        bg: bg ?? cells[row][col].bg,
      };
      return builder;
    },

    build() {
      return cells.map((row) => row.map((cell) => ({ ...cell })));
    },
  };

  return builder;
}

// ---------------------------------------------------------------------------
// Big block letters (5×7 pixel font) rendered as mosaic pixel art
// ---------------------------------------------------------------------------

const FONT: Record<string, string[]> = {
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.####'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};

/** Pixel art for a word in the 5×7 font, 1 px gap between letters. */
export function bigText(word: string): string[] {
  const lines = Array.from({ length: 7 }, () => '');
  for (const ch of word.toUpperCase()) {
    const glyph = FONT[ch] ?? FONT[' '];
    for (let y = 0; y < 7; y++) lines[y] += glyph[y] + '.';
  }
  return lines;
}
