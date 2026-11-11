/**
 * Unit tests for HeaderRow, FastextBar and ScreenReaderGenerator.
 * Requirements: 6.2–6.8, 8.2, 8.9, 12.1–12.5
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createGridModel } from '../../src/engine/GridModel.js';
import { renderHeader, formatDate, formatTime, createHeaderRow, type HeaderState } from '../../src/engine/HeaderRow.js';
import { renderFastext, fitLabel, fastextColourAt } from '../../src/engine/FastextBar.js';
import { createScreenReaderGenerator } from '../../src/engine/ScreenReaderGenerator.js';
import type { GridModel } from '../../src/engine/types.js';

const rowText = (grid: GridModel, row: number, from = 0, to = 39) => {
  let s = '';
  for (let c = from; c <= to; c++) s += String.fromCodePoint(grid.getCell(row, c).char);
  return s;
};

const base: HeaderState = {
  typed: '',
  currentPage: 100,
  subPage: 1,
  subPageTotal: 1,
  held: false,
  cursorOn: true,
  searching: null,
};
const NOW = new Date(2026, 10, 5, 9, 7, 3); // 05 NOV 09:07:03

describe('HeaderRow', () => {
  it('formats date and time', () => {
    expect(formatDate(NOW)).toBe('05 NOV');
    expect(formatTime(NOW)).toBe('09:07:03');
  });

  it('lays out every field in its columns', () => {
    const g = createGridModel();
    renderHeader(g, base, NOW);
    expect(rowText(g, 0, 0, 2)).toBe('100');
    expect(rowText(g, 0, 4, 11)).toBe('PAGE 100');
    expect(rowText(g, 0, 13, 17)).toBe('     ');
    expect(rowText(g, 0, 20, 25)).toBe('05 NOV');
    expect(rowText(g, 0, 32, 39)).toBe('09:07:03');
  });

  it('shows typed digits with a cursor instead of the page number', () => {
    const g = createGridModel();
    renderHeader(g, { ...base, typed: '3' }, NOW);
    expect(rowText(g, 0, 0, 2)).toBe('3- ');
    renderHeader(g, { ...base, typed: '30', cursorOn: false }, NOW);
    expect(rowText(g, 0, 0, 2)).toBe('30 ');
  });

  it('shows M/N for multi-part pages and HOLD when held', () => {
    const g = createGridModel();
    renderHeader(g, { ...base, subPage: 2, subPageTotal: 3 }, NOW);
    expect(rowText(g, 0, 13, 17)).toBe('2/3  ');
    renderHeader(g, { ...base, subPage: 2, subPageTotal: 3, held: true }, NOW);
    expect(rowText(g, 0, 13, 17)).toBe('HOLD ');
  });

  it('shows the searching animation while loading', () => {
    const g = createGridModel();
    renderHeader(g, { ...base, typed: '302', searching: 117 }, NOW);
    expect(rowText(g, 0, 4, 11)).toBe('SEARCH..');
    expect(rowText(g, 0, 13, 17)).toBe('P117 ');
  });

  it('ticks on a timer and stops cleanly', () => {
    vi.useFakeTimers();
    const g = createGridModel();
    const onChange = vi.fn();
    const header = createHeaderRow(g, () => base, onChange);
    header.start();
    vi.advanceTimersByTime(2000);
    expect(onChange).toHaveBeenCalledTimes(4);
    header.stop();
    vi.advanceTimersByTime(2000);
    expect(onChange).toHaveBeenCalledTimes(4);
    vi.useRealTimers();
  });
});

afterEach(() => vi.useRealTimers());

describe('FastextBar', () => {
  it('pads short labels and truncates long ones to 10 characters', () => {
    expect(fitLabel('News')).toBe('NEWS      ');
    expect(fitLabel('Extraordinarily long')).toBe('EXTRAORDIN');
  });

  it('writes four coloured slots on row 24', () => {
    const g = createGridModel();
    renderFastext(g, {
      red: { page: 101, label: 'News' },
      green: { page: 302, label: 'Sport' },
      yellow: { page: 401, label: 'Weather' },
      cyan: { page: 150, label: 'Quiz' },
    });
    expect(rowText(g, 24)).toBe('NEWS      SPORT     WEATHER   QUIZ      ');
    expect(g.getCell(24, 0).fg).toBe('red');
    expect(g.getCell(24, 10).fg).toBe('green');
    expect(g.getCell(24, 20).fg).toBe('yellow');
    expect(g.getCell(24, 30).fg).toBe('cyan');
  });

  it('leaves an undefined link slot blank', () => {
    const g = createGridModel();
    renderFastext(g, { red: { page: 101, label: 'News' } });
    expect(rowText(g, 24, 10, 19)).toBe(' '.repeat(10));
  });

  it('maps columns back to their colour', () => {
    expect(fastextColourAt(0)).toBe('red');
    expect(fastextColourAt(15)).toBe('green');
    expect(fastextColourAt(29)).toBe('yellow');
    expect(fastextColourAt(39)).toBe('cyan');
  });
});

describe('ScreenReaderGenerator', () => {
  const sr = createScreenReaderGenerator();

  it('turns mosaic runs into a single [graphic] placeholder', () => {
    const g = createGridModel();
    g.setCell(1, 0, { mosaic: true, char: 0x7f });
    g.setCell(1, 1, { mosaic: true, char: 0x7f });
    g.setCell(1, 3, { char: 'A'.codePointAt(0)! });
    expect(sr.generate(g, false)).toEqual(['[graphic] A']);
  });

  it('hides concealed cells unless reveal is active', () => {
    const g = createGridModel();
    g.setCell(2, 0, { char: 'X'.codePointAt(0)!, concealed: true });
    expect(sr.generate(g, false)).toEqual([]);
    expect(sr.generate(g, true)).toEqual(['X']);
  });

  it('omits empty rows and trims trailing spaces', () => {
    const g = createGridModel();
    g.setCell(5, 2, { char: 'H'.codePointAt(0)! });
    g.setCell(5, 3, { char: 'i'.codePointAt(0)! });
    expect(sr.generate(g, false)).toEqual(['  Hi']);
  });
});
