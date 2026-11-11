/**
 * HeaderRow — composes row 0: page number / typed digits, service name,
 * sub-page or HOLD indicator, date and ticking clock.
 *
 * Layout (cols): 0–2 page/typed, 4–11 "PAGE 100", 13–17 sub-page/HOLD,
 * 20–25 "DD MMM", 32–39 "HH:MM:SS".
 */

import type { ColourName, GridModel } from './types';
import { DEFAULT_CELL } from './types';

export interface HeaderState {
  /** Digits typed so far ('' when not typing). */
  typed: string;
  /** Page currently on screen. */
  currentPage: number;
  /** 1-based sub-page index and total. */
  subPage: number;
  subPageTotal: number;
  held: boolean;
  /** Cursor visibility for the blinking typing cursor. */
  cursorOn: boolean;
  /** While searching: the page number the header is "rolling" through. */
  searching: number | null;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const pad2 = (n: number) => String(n).padStart(2, '0');

export function formatDate(now: Date): string {
  return `${pad2(now.getDate())} ${MONTHS[now.getMonth()]}`;
}

export function formatTime(now: Date): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

function write(grid: GridModel, col: number, text: string, fg: ColourName, width = text.length): void {
  const padded = text.padEnd(width, ' ').slice(0, width);
  for (let i = 0; i < width; i++) {
    grid.setCell(0, col + i, { ...DEFAULT_CELL, char: padded.codePointAt(i) ?? 0x20, fg });
  }
}

/** Write the whole header row into the grid. Pure apart from the grid write. */
export function renderHeader(grid: GridModel, state: HeaderState, now: Date): void {
  for (let col = 0; col < 40; col++) grid.setCell(0, col, { ...DEFAULT_CELL });

  // cols 0–2: typed digits with a blinking cursor, or the current page.
  if (state.typed.length > 0) {
    const cursor = state.typed.length < 3 && state.cursorOn ? '-' : ' ';
    write(grid, 0, (state.typed + cursor).slice(0, 3), 'white', 3);
  } else {
    write(grid, 0, String(state.currentPage), 'white', 3);
  }

  // cols 4–11: service name, or a searching message.
  if (state.searching !== null) {
    write(grid, 4, 'SEARCH..', 'yellow', 8);
  } else {
    write(grid, 4, 'PAGE 100', 'cyan', 8);
  }

  // cols 13–17: rolling page counter while searching, else HOLD or M/N.
  let indicator = '';
  if (state.searching !== null) indicator = `P${state.searching}`;
  else if (state.held) indicator = 'HOLD';
  else if (state.subPageTotal > 1) indicator = `${state.subPage}/${state.subPageTotal}`;
  write(grid, 13, indicator, state.held ? 'red' : 'white', 5);

  write(grid, 20, formatDate(now), 'white', 6);
  write(grid, 32, formatTime(now), 'yellow', 8);
}

export interface HeaderRow {
  render(now?: Date): void;
  /** Start the 1 s clock tick and 500 ms cursor blink. */
  start(): void;
  stop(): void;
}

/**
 * Wraps renderHeader with the clock and cursor timers.
 * getState is read on every tick; onChange lets the renderer redraw row 0.
 */
export function createHeaderRow(
  grid: GridModel,
  getState: () => HeaderState,
  onChange: () => void = () => {},
): HeaderRow {
  let clock: ReturnType<typeof setInterval> | null = null;
  let cursorOn = true;

  const render = (now: Date = new Date()) => {
    renderHeader(grid, { ...getState(), cursorOn }, now);
    onChange();
  };

  return {
    render,
    start() {
      if (clock !== null) return;
      clock = setInterval(() => {
        cursorOn = !cursorOn;
        render();
      }, 500);
    },
    stop() {
      if (clock !== null) clearInterval(clock);
      clock = null;
    },
  };
}
