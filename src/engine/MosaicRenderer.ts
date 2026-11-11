/**
 * Mosaic character encode/decode logic for teletext Level 1 sixel block graphics.
 * No browser-API dependencies — importable in Node.js.
 */

import type { MosaicRenderer } from './types';

function createMosaicRenderer(): MosaicRenderer {
  return {
    /**
     * Decode a mosaic character code to a 6-bit bitmask.
     *
     * Valid input ranges: 0x20–0x3F and 0x60–0x7F.
     * Throws RangeError for anything outside these ranges (e.g. 0x40–0x5F).
     *
     * Formula: mask = (code & 0x1F) | ((code & 0x40) ? 0x20 : 0)
     */
    decode(charCode: number): number {
      const inLower = charCode >= 0x20 && charCode <= 0x3F;
      const inUpper = charCode >= 0x60 && charCode <= 0x7F;
      if (!inLower && !inUpper) {
        throw new RangeError(
          `MosaicRenderer.decode: character code 0x${charCode.toString(16).toUpperCase()} is outside valid ranges 0x20–0x3F and 0x60–0x7F`
        );
      }
      return (charCode & 0x1F) | ((charCode & 0x40) ? 0x20 : 0);
    },

    /**
     * Encode a 6-bit bitmask to a mosaic character code.
     *
     * Valid input range: 0–63 (6 bits).
     * Throws RangeError for values outside this range.
     *
     * Formula: code = 0x20 | (mask & 0x1F) | ((mask & 0x20) ? 0x40 : 0)
     */
    encode(bitmask: number): number {
      if (bitmask < 0 || bitmask > 63) {
        throw new RangeError(
          `MosaicRenderer.encode: bitmask ${bitmask} is outside valid range 0–63`
        );
      }
      return 0x20 | (bitmask & 0x1F) | ((bitmask & 0x20) ? 0x40 : 0);
    },

    /**
     * Return the six sub-block active states for a 6-bit bitmask.
     *
     * Bit positions (row-major):
     *   bit 0 = top-left,    bit 1 = top-right,
     *   bit 2 = middle-left, bit 3 = middle-right,
     *   bit 4 = bottom-left, bit 5 = bottom-right
     */
    subBlocks(bitmask: number): [boolean, boolean, boolean, boolean, boolean, boolean] {
      return [
        (bitmask & 0x01) !== 0, // bit 0: top-left
        (bitmask & 0x02) !== 0, // bit 1: top-right
        (bitmask & 0x04) !== 0, // bit 2: middle-left
        (bitmask & 0x08) !== 0, // bit 3: middle-right
        (bitmask & 0x10) !== 0, // bit 4: bottom-left
        (bitmask & 0x20) !== 0, // bit 5: bottom-right
      ];
    },
  };
}

export { createMosaicRenderer };
