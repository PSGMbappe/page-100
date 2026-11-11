/**
 * FastextBar — composes row 24: four coloured links, 10 columns each.
 */

import type { ColourName, GridModel, PageData } from './types';
import { DEFAULT_CELL } from './types';

export type FastextColour = 'red' | 'green' | 'yellow' | 'cyan';
export const FASTEXT_ORDER: FastextColour[] = ['red', 'green', 'yellow', 'cyan'];

export function fitLabel(label: string): string {
  return label.toUpperCase().slice(0, 10).padEnd(10, ' ');
}

export function renderFastext(grid: GridModel, links: PageData['fastextLinks']): void {
  FASTEXT_ORDER.forEach((colour, slot) => {
    const link = links[colour];
    const text = link ? fitLabel(link.label) : ' '.repeat(10);
    for (let i = 0; i < 10; i++) {
      grid.setCell(24, slot * 10 + i, {
        ...DEFAULT_CELL,
        char: text.codePointAt(i) ?? 0x20,
        fg: link ? (colour as ColourName) : 'black',
      });
    }
  });
}

/** Which colour slot a column on row 24 belongs to. */
export function fastextColourAt(col: number): FastextColour {
  return FASTEXT_ORDER[Math.min(3, Math.max(0, Math.floor(col / 10)))];
}
