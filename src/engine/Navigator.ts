/**
 * Navigator — the page-navigation state machine.
 *
 *   idle ──digit──▶ buffering ──3rd digit──▶ loading ──▶ found / not-found ──▶ idle
 *                      │  ▲ backspace / 5 s idle timeout clears the buffer
 *
 * Loading always lasts at least `minLoadMs` (the classic teletext "search"),
 * and awaits the async PageDataProvider so live data can plug in unchanged.
 * Timers use the global setTimeout, so tests drive them with fake timers.
 */

import type { NavState, Navigator, NumberBuffer, PageData, PageDataProvider } from './types';

export interface NavigatorEvents {
  /** Typed digits changed ('' when cleared). */
  onBufferChange?(digits: string): void;
  /** A page search started (show the searching animation). */
  onSearchStart?(target: number): void;
  /** The requested page exists and should be shown. */
  onFound?(page: PageData): void;
  /** A typed page number does not exist. */
  onNotFound?(target: number): void;
  /** A Fastext/programmatic link points at a page that does not exist; stay put. */
  onLinkUnavailable?(target: number): void;
}

export interface NavigatorOptions {
  provider: PageDataProvider;
  buffer: NumberBuffer;
  events?: NavigatorEvents;
  minLoadMs?: number;
  idleTimeoutMs?: number;
  initialPage?: number;
}

export interface PageNavigator extends Navigator {
  /** Update the visible sub-page (driven by the SubPageRotator). */
  setSubPage(index: number): void;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createNavigator(opts: NavigatorOptions): PageNavigator {
  const { provider, buffer, events = {} } = opts;
  const minLoadMs = opts.minLoadMs ?? 1000;
  const idleTimeoutMs = opts.idleTimeoutMs ?? 5000;

  let state: NavState = 'idle';
  let currentPage = opts.initialPage ?? 100;
  let currentSubPage = 1;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let loadToken = 0;

  const clearIdle = () => {
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = null;
  };

  const clearBuffer = () => {
    clearIdle();
    buffer.clear();
    events.onBufferChange?.('');
  };

  const armIdle = () => {
    clearIdle();
    idleTimer = setTimeout(() => {
      clearBuffer();
      if (state === 'buffering') state = 'idle';
    }, idleTimeoutMs);
  };

  async function load(target: number, origin: 'typed' | 'link'): Promise<void> {
    const token = ++loadToken;
    state = 'loading';
    clearIdle();
    events.onSearchStart?.(target);
    const [page] = await Promise.all([provider.getPage(target), delay(minLoadMs)]);
    if (token !== loadToken) return; // superseded by a newer navigation
    if (page) {
      state = 'found';
      currentPage = target;
      currentSubPage = 1;
      buffer.clear();
      events.onBufferChange?.('');
      events.onFound?.(page);
    } else {
      state = 'not-found';
      buffer.clear();
      events.onBufferChange?.('');
      if (origin === 'typed') events.onNotFound?.(target);
      else events.onLinkUnavailable?.(target);
    }
    state = 'idle';
  }

  return {
    get state() {
      return state;
    },
    get currentPage() {
      return currentPage;
    },
    get currentSubPage() {
      return currentSubPage;
    },

    setSubPage(index: number) {
      currentSubPage = index;
    },

    onDigit(d: string) {
      if (!/^[0-9]$/.test(d)) return;
      if (state === 'loading') return;
      if (!buffer.append(d)) return;
      state = 'buffering';
      events.onBufferChange?.(buffer.digits);
      if (buffer.isFull) {
        void load(Number(buffer.digits), 'typed');
      } else {
        armIdle();
      }
    },

    onBackspace() {
      if (state !== 'buffering') return;
      if (!buffer.backspace()) return;
      events.onBufferChange?.(buffer.digits);
      if (buffer.isEmpty) {
        clearIdle();
        state = 'idle';
      } else {
        armIdle();
      }
    },

    navigateTo(pageNumber: number) {
      if (state === 'loading') return;
      clearBuffer();
      void load(pageNumber, 'link');
    },
  };
}
