import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/data/**'],
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
