// Feature: teletext-engine, Property 4: NumberBuffer digit accumulation invariant
// Feature: teletext-engine, Property 5: NumberBuffer backspace is a left-inverse of append

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { createNumberBuffer } from '../../src/engine/NumberBuffer.js';

const digitArb = fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9');

describe('NumberBuffer — Property 4: digit accumulation invariant', () => {
  it('digits is a prefix of the input, never longer than 3, isFull iff length 3', () => {
    // Validates: Requirements 7.1, 7.2
    fc.assert(
      fc.property(fc.array(digitArb, { maxLength: 10 }), (input) => {
        const buf = createNumberBuffer();
        for (const d of input) {
          buf.append(d);
          if (buf.digits.length > 3) return false;
          if (buf.isFull !== (buf.digits.length === 3)) return false;
        }
        return input.join('').startsWith(buf.digits) && buf.digits === input.slice(0, 3).join('');
      }),
      { numRuns: 100 },
    );
  });
});

describe('NumberBuffer — Property 5: backspace is a left-inverse of append', () => {
  it('backspace removes exactly the last digit', () => {
    // Validates: Requirements 7.8
    fc.assert(
      fc.property(fc.array(digitArb, { minLength: 1, maxLength: 3 }), (input) => {
        const buf = createNumberBuffer();
        input.forEach((d) => buf.append(d));
        const before = buf.digits;
        const ok = buf.backspace();
        return ok && buf.digits === before.slice(0, -1);
      }),
      { numRuns: 100 },
    );
  });
});
