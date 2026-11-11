/**
 * Unit tests for MosaicRenderer
 * Requirements: 3.2, 3.6, 14.2, 14.5, 14.6
 */

import { describe, it, expect } from 'vitest';
import { createMosaicRenderer } from '../../src/engine/MosaicRenderer.js';

const r = createMosaicRenderer();

describe('MosaicRenderer.decode', () => {
  it('0x20 is an empty block', () => {
    expect(r.decode(0x20)).toBe(0);
  });

  it('0x7F is a solid block', () => {
    expect(r.decode(0x7f)).toBe(63);
  });

  it('0x21 lights only the top-left sub-block', () => {
    expect(r.subBlocks(r.decode(0x21))).toEqual([true, false, false, false, false, false]);
  });

  it('0x60 lights only the bottom-right sub-block', () => {
    expect(r.subBlocks(r.decode(0x60))).toEqual([false, false, false, false, false, true]);
  });

  it('0x35 lights top-left, middle-left and bottom-left (left column)', () => {
    expect(r.subBlocks(r.decode(0x35))).toEqual([true, false, true, false, true, false]);
  });

  it.each([0x40, 0x41, 0x5f, 0x1f, 0x80, -1])('rejects code 0x%s outside the mosaic ranges', (code) => {
    expect(() => r.decode(code)).toThrow(RangeError);
  });
});

describe('MosaicRenderer.encode', () => {
  it('bitmask 0 encodes to 0x20 (all inactive)', () => {
    expect(r.encode(0)).toBe(0x20);
  });

  it('bitmask 63 encodes to 0x7F (all active)', () => {
    expect(r.encode(63)).toBe(0x7f);
  });

  it.each([64, -1, 100])('rejects bitmask %s', (mask) => {
    expect(() => r.encode(mask)).toThrow(RangeError);
  });
});
