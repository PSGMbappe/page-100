/**
 * Unit tests for NumberBuffer
 * Requirements: 7.2, 7.9, 14.2
 */

import { describe, it, expect } from 'vitest';
import { createNumberBuffer } from '../../src/engine/NumberBuffer.js';

describe('NumberBuffer', () => {
  it('starts empty', () => {
    const b = createNumberBuffer();
    expect(b.digits).toBe('');
    expect(b.isEmpty).toBe(true);
    expect(b.isFull).toBe(false);
  });

  it('ignores a fourth digit without changing the buffer', () => {
    const b = createNumberBuffer();
    ['3', '0', '2'].forEach((d) => b.append(d));
    expect(b.append('9')).toBe(false);
    expect(b.digits).toBe('302');
    expect(b.isFull).toBe(true);
  });

  it('backspace on an empty buffer returns false', () => {
    expect(createNumberBuffer().backspace()).toBe(false);
  });

  it('clear() resets a full buffer', () => {
    const b = createNumberBuffer();
    ['1', '5', '0'].forEach((d) => b.append(d));
    b.clear();
    expect(b.digits).toBe('');
    expect(b.isEmpty).toBe(true);
  });
});
