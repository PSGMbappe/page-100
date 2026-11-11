/**
 * GridRenderer — draws the 40×25 grid onto a <canvas>.
 *
 * Cells are whole device pixels (crisp on Retina): the canvas backing store is
 * sized in device pixels and its CSS size is that divided by devicePixelRatio.
 * Handles colours, mosaics, double height, flash and concealed (Reveal) cells.
 */

import type { Cell, ColourModel, FlashClock, GridModel, MosaicRenderer } from '../engine/types';

export interface Layout {
  dpr: number;
  /** Cell size in device pixels (whole numbers). */
  cellW: number;
  cellH: number;
  /** Canvas backing-store size in device pixels. */
  canvasW: number;
  canvasH: number;
  /** Canvas display size in CSS pixels. */
  cssW: number;
  cssH: number;
}

/** Target grid aspect 4:3 → each cell is 5 wide by 6 tall. */
const CELL_ASPECT = 5 / 6;

/** Largest whole-pixel grid that fits the available CSS area at 4:3. */
export function computeLayout(availW: number, availH: number, dpr = 1): Layout {
  const maxW = Math.max(1, Math.floor(availW * dpr));
  const maxH = Math.max(1, Math.floor(availH * dpr));
  let cellH = Math.max(6, Math.floor(Math.min(maxH / 25, maxW / 40 / CELL_ASPECT)));
  let cellW = Math.max(5, Math.round(cellH * CELL_ASPECT));
  while (cellW * 40 > maxW && cellH > 6) {
    cellH -= 1;
    cellW = Math.max(5, Math.round(cellH * CELL_ASPECT));
  }
  const canvasW = cellW * 40;
  const canvasH = cellH * 25;
  return { dpr, cellW, cellH, canvasW, canvasH, cssW: canvasW / dpr, cssH: canvasH / dpr };
}

export interface GridRendererDeps {
  canvas: HTMLCanvasElement;
  grid: GridModel;
  colours: ColourModel;
  mosaic: MosaicRenderer;
  flash: FlashClock;
  isRevealed: () => boolean;
  fontFamily?: string;
}

export interface GridRenderer {
  readonly layout: Layout;
  resize(availW: number, availH: number, dpr?: number): void;
  renderAll(): void;
  renderRow(row: number): void;
  /** Grid cell under a CSS-pixel point on the canvas, or null. */
  cellAt(x: number, y: number): { row: number; col: number } | null;
  destroy(): void;
}

export function createGridRenderer(deps: GridRendererDeps): GridRenderer {
  const { canvas, grid, colours, mosaic, flash } = deps;
  const font = deps.fontFamily ?? 'Bedstead, monospace';
  const ctx = canvas.getContext('2d');
  let layout = computeLayout(640, 480, 1);

  /** A cell is hidden under a double-height cell in the row above. */
  const isCovered = (row: number, col: number): boolean => {
    if (row === 0 || row > 24) return false;
    const above = grid.getCell(row - 1, col);
    return above.doubleHeight && row - 1 <= 23 && !isCovered(row - 1, col);
  };

  function drawCell(row: number, col: number): void {
    if (!ctx || isCovered(row, col)) return;
    const cell: Cell = grid.getCell(row, col);
    const { cellW: w, cellH } = layout;
    const tall = cell.doubleHeight && row <= 23;
    const h = tall ? cellH * 2 : cellH;
    const x = col * w;
    const y = row * cellH;

    ctx.fillStyle = colours.toRGB(cell.bg);
    ctx.fillRect(x, y, w, h);

    const hiddenByFlash = cell.flash && !flash.phase;
    const hiddenByConceal = cell.concealed && !deps.isRevealed();
    if (hiddenByFlash || hiddenByConceal) return;

    ctx.fillStyle = colours.toRGB(cell.fg);
    if (cell.mosaic) {
      let blocks: boolean[];
      try {
        blocks = mosaic.subBlocks(mosaic.decode(cell.char));
      } catch {
        return; // invalid mosaic code: render as fully inactive
      }
      const w1 = Math.floor(w / 2);
      const ys = [0, Math.round(h / 3), Math.round((2 * h) / 3), h];
      blocks.forEach((on, i) => {
        if (!on) return;
        const colIdx = i % 2;
        const rowIdx = Math.floor(i / 2);
        const bx = x + (colIdx === 0 ? 0 : w1);
        const bw = colIdx === 0 ? w1 : w - w1;
        ctx.fillRect(bx, y + ys[rowIdx], bw, ys[rowIdx + 1] - ys[rowIdx]);
      });
      return;
    }

    if (cell.char === 0x20) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.font = `${cellH}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Double height: stretch the glyph vertically ×2.
    ctx.translate(x + w / 2, y + h / 2);
    if (tall) ctx.scale(1, 2);
    ctx.fillText(String.fromCodePoint(cell.char), 0, 0, w);
    ctx.restore();
  }

  function renderRow(row: number): void {
    for (let col = 0; col < 40; col++) drawCell(row, col);
  }

  function renderAll(): void {
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, layout.canvasW, layout.canvasH);
    for (let row = 0; row < 25; row++) renderRow(row);
  }

  const unsubscribe = flash.subscribe(() => {
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 40; col++) {
        if (grid.getCell(row, col).flash) drawCell(row, col);
      }
    }
  });

  return {
    get layout() {
      return layout;
    },
    resize(availW, availH, dpr = globalThis.devicePixelRatio || 1) {
      layout = computeLayout(availW, availH, dpr);
      canvas.width = layout.canvasW;
      canvas.height = layout.canvasH;
      canvas.style.width = `${layout.cssW}px`;
      canvas.style.height = `${layout.cssH}px`;
      renderAll();
    },
    renderAll,
    renderRow,
    cellAt(px, py) {
      const col = Math.floor((px * layout.dpr) / layout.cellW);
      const row = Math.floor((py * layout.dpr) / layout.cellH);
      if (row < 0 || row > 24 || col < 0 || col > 39) return null;
      return { row, col };
    },
    destroy() {
      unsubscribe();
    },
  };
}
