/**
 * Unit tests for the Navigator state machine and MockDataStore.
 * Requirements: 7.1–7.10, 8.10, 8.11, 11.1–11.7, 14.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createNavigator, type NavigatorEvents } from '../../src/engine/Navigator.js';
import { createNumberBuffer } from '../../src/engine/NumberBuffer.js';
import { createMockDataStore } from '../../src/data/MockDataStore.js';

function setup() {
  const events = {
    onBufferChange: vi.fn(),
    onSearchStart: vi.fn(),
    onFound: vi.fn(),
    onNotFound: vi.fn(),
    onLinkUnavailable: vi.fn(),
  } satisfies NavigatorEvents;
  const nav = createNavigator({ provider: createMockDataStore(), buffer: createNumberBuffer(), events });
  return { nav, events };
}

const typeDigits = (nav: ReturnType<typeof setup>['nav'], s: string) => [...s].forEach((d) => nav.onDigit(d));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('Navigator', () => {
  it('idle → buffering → loading → found for an existing page', async () => {
    const { nav, events } = setup();
    expect(nav.state).toBe('idle');
    nav.onDigit('3');
    expect(nav.state).toBe('buffering');
    typeDigits(nav, '02');
    expect(nav.state).toBe('loading');
    expect(events.onSearchStart).toHaveBeenCalledWith(302);
    await vi.advanceTimersByTimeAsync(999);
    expect(events.onFound).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(events.onFound).toHaveBeenCalledWith(expect.objectContaining({ number: 302 }));
    expect(nav.currentPage).toBe(302);
    expect(nav.state).toBe('idle');
    expect(events.onBufferChange).toHaveBeenLastCalledWith('');
  });

  it('idle → loading → not-found for a missing typed page', async () => {
    const { nav, events } = setup();
    typeDigits(nav, '999');
    await vi.advanceTimersByTimeAsync(1000);
    expect(events.onNotFound).toHaveBeenCalledWith(999);
    expect(nav.currentPage).toBe(100);
    expect(nav.state).toBe('idle');
  });

  it('navigateTo() loads directly (Fastext)', async () => {
    const { nav, events } = setup();
    nav.navigateTo(401);
    expect(nav.state).toBe('loading');
    await vi.advanceTimersByTimeAsync(1000);
    expect(events.onFound).toHaveBeenCalledWith(expect.objectContaining({ number: 401 }));
  });

  it('a link to a missing page stays on the current page', async () => {
    const { nav, events } = setup();
    nav.navigateTo(777);
    await vi.advanceTimersByTimeAsync(1000);
    expect(events.onLinkUnavailable).toHaveBeenCalledWith(777);
    expect(events.onNotFound).not.toHaveBeenCalled();
    expect(nav.currentPage).toBe(100);
  });

  it('clears the buffer after 5 s without input', () => {
    const { nav, events } = setup();
    typeDigits(nav, '30');
    vi.advanceTimersByTime(4999);
    expect(nav.state).toBe('buffering');
    vi.advanceTimersByTime(1);
    expect(nav.state).toBe('idle');
    expect(events.onBufferChange).toHaveBeenLastCalledWith('');
  });

  it('backspace removes a digit; removing the last returns to idle', () => {
    const { nav, events } = setup();
    typeDigits(nav, '30');
    nav.onBackspace();
    expect(events.onBufferChange).toHaveBeenLastCalledWith('3');
    expect(nav.state).toBe('buffering');
    nav.onBackspace();
    expect(nav.state).toBe('idle');
  });

  it('ignores backspace when nothing is typed', () => {
    const { nav, events } = setup();
    nav.onBackspace();
    expect(events.onBufferChange).not.toHaveBeenCalled();
  });

  it('ignores digits while a page is loading', async () => {
    const { nav, events } = setup();
    typeDigits(nav, '101');
    nav.onDigit('4');
    expect(events.onBufferChange).not.toHaveBeenCalledWith('4');
    await vi.advanceTimersByTimeAsync(1000);
    expect(nav.currentPage).toBe(101);
  });

  it('ignores non-digit keys', () => {
    const { nav } = setup();
    nav.onDigit('x');
    expect(nav.state).toBe('idle');
  });

  it('tracks the visible sub-page', () => {
    const { nav } = setup();
    nav.setSubPage(2);
    expect(nav.currentSubPage).toBe(2);
  });
});

describe('MockDataStore', () => {
  it('lists the five mock pages', async () => {
    expect(await createMockDataStore().listPages()).toEqual([100, 101, 150, 302, 401]);
  });

  it('returns null for a missing page', async () => {
    expect(await createMockDataStore().getPage(999)).toBeNull();
  });

  it('page 100 has a mosaic logo of at least 4×2 cells', async () => {
    const page = (await createMockDataStore().getPage(100))!;
    const cells = page.subPages[0].cells;
    const mosaicRows = cells.filter((row) => row.filter((c) => c.mosaic).length >= 4);
    expect(mosaicRows.length).toBeGreaterThanOrEqual(2);
  });

  it('page 150 has at least three concealed answers', async () => {
    const page = (await createMockDataStore().getPage(150))!;
    const answerRows = page.subPages[0].cells.filter((row) => row.some((c) => c.concealed));
    expect(answerRows.length).toBeGreaterThanOrEqual(3);
  });

  it('page 401 has a weather map of at least 10 mosaic cells', async () => {
    const page = (await createMockDataStore().getPage(401))!;
    const count = page.subPages[0].cells.flat().filter((c) => c.mosaic).length;
    expect(count).toBeGreaterThanOrEqual(10);
  });

  it('every page has full 25×40 sub-pages and Fastext labels that fit', async () => {
    const store = createMockDataStore();
    for (const n of await store.listPages()) {
      const page = (await store.getPage(n))!;
      for (const sub of page.subPages) {
        expect(sub.cells).toHaveLength(25);
        sub.cells.forEach((row) => expect(row).toHaveLength(40));
        expect(sub.total).toBe(page.subPages.length);
      }
      Object.values(page.fastextLinks).forEach((link) => expect(link!.label.length).toBeLessThanOrEqual(10));
    }
  });

  it('pages 101 and 302 rotate through two sub-pages; 101 has double-height headlines; 302 flashes', async () => {
    const store = createMockDataStore();
    const news = (await store.getPage(101))!;
    const sport = (await store.getPage(302))!;
    expect(news.subPages).toHaveLength(2);
    expect(sport.subPages).toHaveLength(2);
    expect(news.subPages[0].cells.flat().some((c) => c.doubleHeight)).toBe(true);
    expect(sport.subPages[0].cells.flat().some((c) => c.flash)).toBe(true);
  });
});
