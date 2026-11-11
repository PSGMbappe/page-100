/**
 * Page 100 — app entry point. Wires the engine, mock data, renderer,
 * remote control, keyboard and screen-reader view together.
 */

import { createGridModel } from './engine/GridModel';
import { createColourModel } from './engine/ColourModel';
import { createMosaicRenderer } from './engine/MosaicRenderer';
import { createFlashClock } from './engine/FlashClock';
import { createNumberBuffer } from './engine/NumberBuffer';
import { createRevealMode, createHoldMode } from './engine/ToggleMode';
import { createSubPageRotator } from './engine/SubPageRotator';
import { createScreenReaderGenerator } from './engine/ScreenReaderGenerator';
import { createHeaderRow } from './engine/HeaderRow';
import { renderFastext, fastextColourAt, type FastextColour } from './engine/FastextBar';
import { createNavigator } from './engine/Navigator';
import { createMockDataStore } from './data/MockDataStore';
import { createPageBuilder } from './data/pageBuilder';
import { createGridRenderer } from './ui/GridRenderer';
import { createOnScreenRemote } from './ui/OnScreenRemote';
import type { Cell, PageData } from './engine/types';

const canvas = document.getElementById('teletext') as HTMLCanvasElement;
const screenEl = document.getElementById('screen') as HTMLElement;
const remoteEl = document.getElementById('remote') as HTMLElement;
const srView = document.getElementById('sr-view') as HTMLElement;

// ---- Engine ---------------------------------------------------------------

const grid = createGridModel();
const colours = createColourModel();
const mosaic = createMosaicRenderer();
const flash = createFlashClock();
const buffer = createNumberBuffer();
const reveal = createRevealMode();
const hold = createHoldMode();
const rotator = createSubPageRotator();
const screenReader = createScreenReaderGenerator();
const provider = createMockDataStore();

// ---- App state ------------------------------------------------------------

let page: PageData | null = null;
let subIndex = 0;
let typed = '';
let searching: number | null = null;
let searchTimer: ReturnType<typeof setInterval> | null = null;
/** Body override (e.g. "page not found"); null shows the current page. */
let bodyOverride: Cell[][] | null = null;
let statusTimer: ReturnType<typeof setTimeout> | null = null;

const renderer = createGridRenderer({
  canvas,
  grid,
  colours,
  mosaic,
  flash,
  isRevealed: () => reveal.isActive,
});

const header = createHeaderRow(
  grid,
  () => ({
    typed,
    currentPage: page?.number ?? 100,
    subPage: subIndex + 1,
    subPageTotal: page?.subPages.length ?? 1,
    held: hold.isActive,
    cursorOn: true,
    searching,
  }),
  () => renderer.renderRow(0),
);

/** Copy rows 1–23 of the current body, then header and Fastext rows. */
function compose(): void {
  const body = bodyOverride ?? page?.subPages[subIndex]?.cells;
  for (let row = 1; row <= 23; row++) {
    for (let col = 0; col < 40; col++) {
      const cell = body?.[row]?.[col];
      grid.setCell(row, col, cell ?? { char: 0x20, fg: 'white', bg: 'black', mosaic: false, doubleHeight: false, flash: false, concealed: false });
    }
  }
  renderFastext(grid, page?.fastextLinks ?? {});
  header.render();
  renderer.renderAll();
}

function announce(): void {
  srView.textContent = screenReader.generate(grid, reveal.isActive).join('\n');
}

function showStatus(message: string): void {
  // A one-line message on row 23 for three seconds (e.g. "PAGE 777 UNAVAILABLE").
  const text = message.toUpperCase().slice(0, 38);
  const start = Math.floor((40 - text.length) / 2);
  for (let col = 0; col < 40; col++) {
    const ch = col >= start && col < start + text.length ? text.codePointAt(col - start)! : 0x20;
    grid.setCell(23, col, { char: ch, fg: 'red', bg: 'black', mosaic: false, doubleHeight: false, flash: false, concealed: false });
  }
  renderer.renderRow(23);
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(compose, 3000);
}

function notFoundBody(target: number): Cell[][] {
  return createPageBuilder()
    .text(9, 4, `PAGE ${target} NOT FOUND`, { fg: 'yellow', doubleHeight: true })
    .text(13, 4, 'This page is not being broadcast.', { fg: 'white' })
    .text(15, 4, 'Type 100 for the index.', { fg: 'cyan' })
    .build();
}

function stopSearching(): void {
  if (searchTimer) clearInterval(searchTimer);
  searchTimer = null;
  searching = null;
}

// ---- Navigation -----------------------------------------------------------

const nav = createNavigator({
  provider,
  buffer,
  events: {
    onBufferChange(digits) {
      typed = digits;
      header.render();
    },
    onSearchStart(target) {
      // Classic teletext: the header rolls through page numbers while searching.
      let n = page?.number ?? 100;
      searching = n;
      header.render();
      if (searchTimer) clearInterval(searchTimer);
      searchTimer = setInterval(() => {
        n = n >= 899 ? 100 : n + 1;
        searching = n === target ? n + 1 : n;
        header.render();
      }, 40);
    },
    onFound(found) {
      stopSearching();
      page = found;
      subIndex = 0;
      bodyOverride = null;
      reveal.reset();
      hold.reset();
      remote.setReveal(false);
      remote.setHold(false);
      rotator.onAdvance = (i) => {
        subIndex = i;
        nav.setSubPage(i + 1);
        compose();
        announce();
      };
      rotator.start(found.subPages.length);
      compose();
      announce();
    },
    onNotFound(target) {
      stopSearching();
      rotator.stop();
      bodyOverride = notFoundBody(target);
      compose();
      announce();
    },
    onLinkUnavailable(target) {
      stopSearching();
      header.render();
      showStatus(`Page ${target} unavailable`);
    },
  },
});

function followFastext(colour: FastextColour): void {
  const link = page?.fastextLinks[colour];
  if (link) nav.navigateTo(link.page);
}

function toggleHold(): void {
  const active = hold.toggle();
  if (active) rotator.hold();
  else rotator.resume();
  remote.setHold(active);
  header.render();
}

function toggleReveal(): void {
  const active = reveal.toggle();
  remote.setReveal(active);
  renderer.renderAll();
  announce();
}

// ---- Remote, keyboard and mouse ------------------------------------------

const remote = createOnScreenRemote(remoteEl);
remoteEl.addEventListener('digit', (e) => nav.onDigit((e as CustomEvent<string>).detail));
remoteEl.addEventListener('backspace', () => nav.onBackspace());
remoteEl.addEventListener('hold', toggleHold);
remoteEl.addEventListener('reveal', toggleReveal);
remoteEl.addEventListener('fastext', (e) => followFastext((e as CustomEvent<FastextColour>).detail));
remoteEl.addEventListener('remotetoggle', () => requestAnimationFrame(fit));

window.addEventListener('keydown', (e) => {
  if (e.altKey && e.key.toLowerCase() === 't') {
    e.preventDefault();
    srView.focus();
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const key = e.key.toLowerCase();
  if (/^[0-9]$/.test(key)) nav.onDigit(key);
  else if (key === 'backspace') nav.onBackspace();
  else if (key === 'h') toggleHold();
  else if (key === 'v') toggleReveal();
  else if (key === 'r') followFastext('red');
  else if (key === 'g') followFastext('green');
  else if (key === 'y') followFastext('yellow');
  else if (key === 'c') followFastext('cyan');
  else return;
  e.preventDefault();
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const hit = renderer.cellAt(e.clientX - rect.left, e.clientY - rect.top);
  if (hit?.row === 24) followFastext(fastextColourAt(hit.col));
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const hit = renderer.cellAt(e.clientX - rect.left, e.clientY - rect.top);
  const link = hit?.row === 24 ? page?.fastextLinks[fastextColourAt(hit.col)] : undefined;
  canvas.style.cursor = link ? 'pointer' : 'default';
});

// ---- Layout ---------------------------------------------------------------

function fit(): void {
  const rect = screenEl.getBoundingClientRect();
  renderer.resize(rect.width, rect.height);
  compose();
}

new ResizeObserver(fit).observe(screenEl);

// ---- Start ----------------------------------------------------------------

async function start(): Promise<void> {
  try {
    await document.fonts.load('20px Bedstead');
  } catch {
    /* fall back to monospace */
  }
  fit();
  flash.start();
  header.start();
  nav.navigateTo(100);
}

void start();
