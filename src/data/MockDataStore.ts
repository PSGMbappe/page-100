/**
 * MockDataStore — the PageDataProvider used until live data arrives.
 * A live adapter implements the same async interface.
 */

import type { PageData, PageDataProvider } from '../engine/types';
import { buildMockPages } from './mockPages';

export function createMockDataStore(pages: PageData[] = buildMockPages()): PageDataProvider {
  const byNumber = new Map(pages.map((p) => [p.number, p]));
  return {
    async getPage(number: number) {
      return byNumber.get(number) ?? null;
    },
    async listPages() {
      return [...byNumber.keys()].sort((a, b) => a - b);
    },
  };
}
