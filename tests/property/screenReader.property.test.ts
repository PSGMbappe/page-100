// Feature: teletext-engine, Property 8: Screen reader view strips attributes
// Feature: teletext-engine, Property 9: Reveal mode preserves concealed attribute

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { createGridModel } from '../../src/engine/GridModel.js';
import { createScreenReaderGenerator } from '../../src/engine/ScreenReaderGenerator.js';
import { cellArbitrary } from './helpers.js';

const sr = createScreenReaderGenerator();

describe('ScreenReaderGenerator — Property 8: strips attributes', () => {
  it('output has only printable text, [graphic] placeholders and spaces', () => {
    // Validates: Requirements 12.1, 12.2, 12.3
    fc.assert(
      fc.property(fc.array(cellArbitrary, { minLength: 40, maxLength: 40 }), fc.boolean(), (row, reveal) => {
        const g = createGridModel();
        row.forEach((cell, col) => g.setCell(3, col, cell));
        const lines = sr.generate(g, reveal);
        return lines.every((line) => {
          const withoutGraphics = line.split('[graphic]').join('');
          // printable ASCII only: no control or attribute codes
          return /^[\x20-\x7E]*$/.test(withoutGraphics) && !/ $/.test(line);
        });
      }),
      { numRuns: 100 },
    );
  });
});

describe('ScreenReaderGenerator — Property 9: reveal preserves concealed attribute', () => {
  it('generate() never changes the concealed flag', () => {
    // Validates: Requirements 10.3, 10.5, 12.4, 12.5
    fc.assert(
      fc.property(fc.boolean(), fc.integer({ min: 0x21, max: 0x7e }), (reveal, ch) => {
        const g = createGridModel();
        g.setCell(10, 5, { char: ch, concealed: true });
        const lines = sr.generate(g, reveal);
        const stillConcealed = g.getCell(10, 5).concealed === true;
        const shown = lines.join('').includes(String.fromCodePoint(ch));
        return stillConcealed && shown === reveal;
      }),
      { numRuns: 100 },
    );
  });
});
