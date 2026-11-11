/**
 * ColourModel: fixed 8-colour teletext palette.
 * Zero browser-API dependencies — importable in Node.js.
 */

import type { ColourModel, ColourName } from './types';

const COLOUR_MAP: Record<ColourName, string> = {
  black:   '#000000',
  red:     '#FF0000',
  green:   '#00FF00',
  yellow:  '#FFFF00',
  blue:    '#0000FF',
  magenta: '#FF00FF',
  cyan:    '#00FFFF',
  white:   '#FFFFFF',
};

const VALID_COLOURS = Object.keys(COLOUR_MAP) as ColourName[];

export function createColourModel(): ColourModel {
  return {
    toRGB(name: ColourName): string {
      const rgb = COLOUR_MAP[name];
      if (rgb === undefined) {
        throw new Error(`Unknown colour name: "${name}"`);
      }
      return rgb;
    },

    isValid(name: string): name is ColourName {
      return VALID_COLOURS.includes(name as ColourName);
    },
  };
}
