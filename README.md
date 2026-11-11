# Page 100: teletext, resurrected

Page 100 brings back 1980s/90s UK TV teletext as a web app: chunky full-screen pages in eight colours, block graphics, double-height headlines and a ticking clock, navigated the old way by typing three-digit page numbers.

Built for **Kiroween 2026**, *Resurrection* category.

## Try it

- Type a page number on your keyboard (or the on-screen remote) and watch the header search for it.
- **R / G / Y / C** (or the coloured keys, or clicking the bottom row) follow the four Fastext links.
- **H** holds a multi-part page, **V** reveals hidden quiz answers, **Alt+T** opens a plain-text view for screen readers.

| Page | What's on it |
|---|---|
| 100 | Index, with a block-graphics logo |
| 101 | News headlines (2 rotating sub-pages, double-height headlines) |
| 150 | Quiz with concealed answers |
| 302 | Football scores (2 sub-pages, flashing live scores) |
| 401 | Weather map drawn in teletext mosaic graphics |

All stories, teams and figures on the mock pages are fictional.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + property-based tests (Vitest + fast-check)
npm run coverage   # coverage for the engine and data modules
npm run build      # static site in dist/ (deployable to GitHub Pages)
```

## How it's built

- **TypeScript + Vite**, no UI framework. The engine (`src/engine/`) is pure TypeScript with no browser dependencies, so every module is unit-tested in Node.
- **Canvas renderer** (`src/ui/GridRenderer.ts`) with whole-pixel cells, scaled for high-DPI screens, using the public-domain **Bedstead** teletext font (bundled in `public/fonts/`).
- **Async data provider**: pages come from `src/data/MockDataStore.ts` through the same `PageDataProvider` interface a live data adapter will use.
- **150 tests**, including property-based tests for the mosaic encoding, grid model, number entry and screen-reader output. 100% line coverage on the engine and data modules.

```
src/engine/   grid, colours, mosaics, navigator, header, Fastext, timers
src/data/     page builder, mock pages, data provider
src/ui/       canvas renderer, on-screen remote
tests/        unit and property tests
.kiro/        Kiro steering, spec and hooks
```

## Built with Kiro

This project was planned and started in **Kiro**:

- **Steering** (`.kiro/steering/`): product, tech and structure rules that every Kiro request follows.
- **Spec** (`.kiro/specs/teletext-engine/`): Kiro generated the requirements (EARS format), the design (architecture, interfaces, correctness properties) and the 21-task implementation plan, each reviewed and refined before approval.
- **Implementation**: Kiro implemented the project setup and the first engine modules (tasks 1–3, plus the mosaic and number-entry modules). After the Kiro credits ran out, the remaining tasks were implemented with Claude Code, following Kiro's spec and task list.
- **Hooks** (`.kiro/hooks/`): *Run tests on save* runs the Vitest suite whenever a source or test file is saved; *Page directory check* asks Kiro to verify the index, Fastext links and README page table whenever the pages change.

## Licence

MIT, see [LICENSE](LICENSE). The Bedstead font is public domain; see `public/fonts/BEDSTEAD-LICENCE.txt`.
