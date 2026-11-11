/**
 * Core types and interfaces for the Page 100 teletext engine.
 * All types in this file are framework-free and importable in Node.js.
 */

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

export type ColourName =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white';

// ---------------------------------------------------------------------------
// Cell
// ---------------------------------------------------------------------------

/**
 * A single character position in the teletext Grid.
 * Carries a character code, foreground/background colours, and display attributes.
 */
export interface Cell {
  /** Unicode code point (0x20 = space) */
  char: number;
  /** Foreground colour */
  fg: ColourName;
  /** Background colour */
  bg: ColourName;
  /** Render as mosaic (sixel block-graphic) rather than a text glyph */
  mosaic: boolean;
  /** Scale character to twice the row height (top half in this row, bottom half in row below) */
  doubleHeight: boolean;
  /** Apply 1 Hz flash (alternate between rendered and not-rendered) */
  flash: boolean;
  /** Hidden unless Reveal_Mode is active */
  concealed: boolean;
}

/** Default Cell values used to initialise and reset the Grid. */
export const DEFAULT_CELL: Cell = {
  char: 0x20,
  fg: 'white',
  bg: 'black',
  mosaic: false,
  doubleHeight: false,
  flash: false,
  concealed: false,
} as const;

// ---------------------------------------------------------------------------
// GridModel
// ---------------------------------------------------------------------------

/**
 * 40-column × 25-row character cell storage.
 * Row indices: 0–24. Column indices: 0–39.
 * Throws RangeError for out-of-range coordinates.
 */
export interface GridModel {
  getCell(row: number, col: number): Cell;
  setCell(row: number, col: number, cell: Partial<Cell>): void;
  /** Fill all cells with DEFAULT_CELL values. */
  reset(): void;
  readonly rows: 25;
  readonly cols: 40;
}

// ---------------------------------------------------------------------------
// ColourModel
// ---------------------------------------------------------------------------

export interface ColourModel {
  /** Returns the fixed '#RRGGBB' string for the named colour. Throws for unknown names. */
  toRGB(name: ColourName): string;
  /** Type-guard: returns true iff the string is one of the eight valid colour names. */
  isValid(name: string): name is ColourName;
}

// ---------------------------------------------------------------------------
// MosaicRenderer
// ---------------------------------------------------------------------------

export interface MosaicRenderer {
  /**
   * Decode character code → 6-bit bitmask (bits 0–5, row-major).
   * Throws RangeError for codes outside 0x20–0x3F and 0x60–0x7F.
   */
  decode(charCode: number): number;

  /**
   * Encode 6-bit bitmask → character code in the contiguous mosaic set.
   * Throws RangeError for bitmask values outside 0–63.
   */
  encode(bitmask: number): number;

  /**
   * Return the six sub-block active states for a given bitmask as an array
   * of booleans in row-major order [topL, topR, midL, midR, botL, botR].
   */
  subBlocks(bitmask: number): [boolean, boolean, boolean, boolean, boolean, boolean];
}

// ---------------------------------------------------------------------------
// FlashClock
// ---------------------------------------------------------------------------

export interface FlashClock {
  /** Current phase: true = character visible, false = character hidden */
  readonly phase: boolean;
  /** Subscribe; callback fired at every phase transition. Returns unsubscribe function. */
  subscribe(cb: (phase: boolean) => void): () => void;
  /** Start the 500 ms interval clock. Guards against double-start. */
  start(): void;
  /** Stop the clock and reset phase to true. */
  stop(): void;
}

// ---------------------------------------------------------------------------
// NumberBuffer
// ---------------------------------------------------------------------------

export interface NumberBuffer {
  /** Current accumulated digits: '', '1', '12', or '123' */
  readonly digits: string;
  /** Appends digit if not full; returns false when already at 3 digits. */
  append(digit: string): boolean;
  /** Removes last digit; returns false if already empty. */
  backspace(): boolean;
  /** Resets to empty string. */
  clear(): void;
  /** True when digits.length === 3. */
  readonly isFull: boolean;
  /** True when digits.length === 0. */
  readonly isEmpty: boolean;
}

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

export type NavState = 'idle' | 'buffering' | 'loading' | 'found' | 'not-found';

export interface Navigator {
  readonly state: NavState;
  onDigit(d: string): void;
  onBackspace(): void;
  /** Fastext / programmatic direct navigation. */
  navigateTo(pageNumber: number): void;
  readonly currentPage: number;
  readonly currentSubPage: number;
}

// ---------------------------------------------------------------------------
// SubPageRotator
// ---------------------------------------------------------------------------

export interface SubPageRotator {
  /** Begin 15 s rotation with the given total number of sub-pages. */
  start(totalSubPages: number): void;
  /** Stop the rotation interval. */
  stop(): void;
  /** Pause advancement without clearing the interval. */
  hold(): void;
  /** Resume advancement from currentIndex. */
  resume(): void;
  /** Current sub-page index (0-based). */
  readonly currentIndex: number;
  readonly isHeld: boolean;
  /** Called on each advance with the new 0-based index. */
  onAdvance: (index: number) => void;
}

// ---------------------------------------------------------------------------
// PageDataProvider
// ---------------------------------------------------------------------------

export interface PageData {
  number: number;
  subPages: SubPageData[];
  fastextLinks: {
    red?: { page: number; label: string };
    green?: { page: number; label: string };
    yellow?: { page: number; label: string };
    cyan?: { page: number; label: string };
  };
}

export interface SubPageData {
  /** 1-based sub-page index (e.g. 1 of 3). */
  index: number;
  /** Total number of sub-pages. */
  total: number;
  /** Cell data: [25 rows][40 cols] */
  cells: Cell[][];
}

export interface PageDataProvider {
  getPage(number: number): Promise<PageData | null>;
  listPages(): Promise<number[]>;
}

// ---------------------------------------------------------------------------
// ScreenReaderGenerator
// ---------------------------------------------------------------------------

export interface ScreenReaderGenerator {
  /**
   * Convert Grid rows to plain-text strings.
   * Returns one trimmed string per non-empty row, top-to-bottom.
   * Mosaic cells → "[graphic]". Concealed cells → " " when revealActive is false,
   * or their decoded character when true.
   */
  generate(grid: GridModel, revealActive: boolean): string[];
}
