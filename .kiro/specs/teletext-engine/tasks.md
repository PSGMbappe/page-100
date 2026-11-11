# Implementation Plan: Teletext Engine

## Overview

Implement the teletext engine as a set of pure TypeScript modules under `src/engine/`, a Canvas-based renderer and DOM shell under `src/ui/`, and a mock data store under `src/data/`. Each engine module has zero browser-API dependencies and is independently importable in Node.js. The UI shell wires everything together via `src/main.ts` and an `index.html` entry point. All required tests use Vitest with fast-check for property-based testing.

## Tasks

- [x] 1. Set up project structure, tooling, and core TypeScript interfaces
  - Initialise `package.json` with these dev-dependencies (all exact versions): `vite`, `vitest`, `@vitest/coverage-v8`, `fast-check`, `typescript`, `jsdom`
  - Create `tsconfig.json` targeting ES2020 modules with `strict: true`
  - Create `vite.config.ts` with `base: './'` (for GitHub Pages deployment) and configure Vitest with `environment: 'jsdom'` and V8 coverage for `src/**`
  - Add npm scripts to `package.json`: `"dev": "vite"`, `"build": "vite build"`, `"preview": "vite preview"`, `"test": "vitest run"`, `"coverage": "vitest run --coverage"`
  - Create the directory tree: `src/engine/`, `src/ui/`, `src/data/`, `public/fonts/`, `tests/unit/`, `tests/property/`
  - Write `src/engine/types.ts` exporting all shared interfaces and types: `Cell`, `DEFAULT_CELL`, `ColourName`, `GridModel`, `ColourModel`, `MosaicRenderer`, `FlashClock`, `NumberBuffer`, `NavState`, `Navigator`, `SubPageRotator`, `PageData`, `SubPageData`, `PageDataProvider`, `ScreenReaderGenerator`
  - _Requirements: 1.6, 2.1, 3.1, 14.1_

- [x] 2. Implement GridModel
  - [x] 2.1 Implement `src/engine/GridModel.ts`
    - Internal storage: a `Cell[][]` of size 25×40 initialised with `DEFAULT_CELL` values
    - `getCell(row, col)`: throws `RangeError` for out-of-range coordinates
    - `setCell(row, col, partial)`: merges partial onto the existing cell; validates colour names via `ColourModel.isValid` and throws/preserves if invalid; throws `RangeError` for out-of-range coordinates
    - `reset()`: fills all cells with `DEFAULT_CELL`
    - Export `createGridModel(): GridModel`
    - _Requirements: 1.5, 1.6, 2.6_
  - [x] 2.2 Write property test for GridModel round-trip (Property 6)
    - **Property 6: Grid Cell read/write round-trip**
    - Use `fc.record({ row: fc.integer({min:0,max:24}), col: fc.integer({min:0,max:39}), cell: cellArbitrary })` to generate random valid cells and coordinates
    - Assert that writing then reading back produces a cell equal to what was written
    - **Validates: Requirements 1.6, 14.1**
    - `// Feature: teletext-engine, Property 6: Grid Cell read/write round-trip`
  - [x] 2.3 Write unit tests for GridModel
    - Test `getCell`/`setCell` at boundary coordinates (0,0), (24,39)
    - Test `RangeError` on out-of-range reads and writes
    - Test `reset()` returns all cells to `DEFAULT_CELL`
    - Test invalid colour name rejection preserves existing colour
    - _Requirements: 1.6, 2.6, 14.2_

- [x] 3. Implement ColourModel
  - [x] 3.1 Implement `src/engine/ColourModel.ts`
    - Hard-code the eight colour→RGB entries: black→#000000, red→#FF0000, green→#00FF00, yellow→#FFFF00, blue→#0000FF, magenta→#FF00FF, cyan→#00FFFF, white→#FFFFFF
    - `toRGB(name)`: returns the fixed `#RRGGBB` string; throws `Error` for unknown name
    - `isValid(name)`: type-guard returning true iff name is one of the eight
    - Export `createColourModel(): ColourModel`
    - _Requirements: 2.1, 2.4_
  - [x] 3.2 Write property test for ColourModel totality and injectivity (Property 7)
    - **Property 7: Colour mapping is total and injective**
    - Use `fc.constantFrom(...VALID_COLOURS)` to verify `toRGB` returns the specified RGB for every colour
    - Assert no two distinct colour names map to the same RGB string
    - **Validates: Requirements 2.1, 2.4**
    - `// Feature: teletext-engine, Property 7: Colour mapping total and injective`
  - [x] 3.3 Write property test for invalid colour rejection (Property 3)
    - **Property 3: Invalid colour assignment is rejected**
    - Use `fc.string().filter(s => !VALID_COLOURS.includes(s))` to generate invalid colour strings
    - Assert `isValid` returns false and `setCell` preserves existing colours when passed an invalid name
    - **Validates: Requirements 2.6**
    - `// Feature: teletext-engine, Property 3: Invalid colour assignment is rejected`
  - [x] 3.4 Write unit tests for ColourModel
    - Test all eight colour→RGB mappings exactly
    - Test `isValid` returns false for empty string, mixed-case names, and unknown strings
    - _Requirements: 2.4, 14.2_

- [x] 4. Implement MosaicRenderer
  - [x] 4.1 Implement `src/engine/MosaicRenderer.ts`
    - `decode(charCode)`: implement `mask = (code & 0x1F) | ((code & 0x40) ? 0x20 : 0)`; throw `RangeError` for codes outside 0x20–0x3F and 0x60–0x7F
    - `encode(bitmask)`: implement `code = 0x20 | (mask & 0x1F) | ((mask & 0x20) ? 0x40 : 0)`; throw `RangeError` for bitmask outside 0–63
    - `subBlocks(bitmask)`: return a 6-tuple of booleans for bits 0–5 in row-major order
    - Export `createMosaicRenderer(): MosaicRenderer`
    - _Requirements: 3.1, 3.2, 3.5, 14.5, 14.6_
  - [x] 4.2 Write property test for mosaic round-trip (Property 1)
    - **Property 1: Mosaic character round-trip**
    - Use `fc.oneof(fc.integer({min:0x20,max:0x3F}), fc.integer({min:0x60,max:0x7F}))` for valid codes
    - Assert `encode(decode(code)) === code` and `decode(encode(mask)) === mask` for all valid inputs
    - **Validates: Requirements 3.2, 3.5, 14.5**
    - `// Feature: teletext-engine, Property 1: Mosaic character round-trip`
  - [x] 4.3 Write property test for mosaic sub-block count (Property 2)
    - **Property 2: Mosaic sub-block count**
    - Use same arbitrary as Property 1
    - Assert `subBlocks(decode(code)).filter(Boolean).length === popcount(decode(code))`
    - **Validates: Requirements 3.1, 3.2, 3.5**
    - `// Feature: teletext-engine, Property 2: Mosaic sub-block count`
  - [x] 4.4 Write unit tests for MosaicRenderer
    - Test `decode` on a selection of known codes from both valid ranges
    - Test `RangeError` for codes 0x40–0x5F and codes outside both ranges
    - Test `encode` for bitmasks 0 (all inactive) and 63 (all active)
    - Test `RangeError` for bitmask 64 and negative values
    - _Requirements: 3.2, 3.6, 14.2, 14.5, 14.6_

- [x] 5. Implement NumberBuffer
  - [x] 5.1 Implement `src/engine/NumberBuffer.ts`
    - Internal state: `digits` string (max length 3)
    - `append(digit)`: appends if `digits.length < 3`, returns false if already full
    - `backspace()`: removes last character, returns false if already empty
    - `clear()`: resets to empty string
    - `isFull` / `isEmpty` computed getters
    - Export `createNumberBuffer(): NumberBuffer`
    - _Requirements: 7.1, 7.2, 7.8, 7.9_
  - [x] 5.2 Write property test for NumberBuffer accumulation invariant (Property 4)
    - **Property 4: NumberBuffer digit accumulation invariant**
    - Use `fc.array(fc.char().filter(c => /[0-9]/.test(c)), { maxLength: 10 })` to generate digit sequences
    - Assert `digits` is always a prefix of input, length never exceeds 3, and `isFull === (digits.length === 3)`
    - **Validates: Requirements 7.1, 7.2**
    - `// Feature: teletext-engine, Property 4: NumberBuffer digit accumulation invariant`
  - [x] 5.3 Write property test for NumberBuffer backspace invariant (Property 5)
    - **Property 5: NumberBuffer backspace is a left-inverse of append**
    - Use `fc.array(fc.char().filter(c => /[0-9]/.test(c)), { minLength: 1, maxLength: 3 })` to build a non-empty buffer
    - Assert that `backspace()` removes exactly the last digit and leaves all prior digits unchanged
    - **Validates: Requirements 7.8**
    - `// Feature: teletext-engine, Property 5: NumberBuffer backspace is a left-inverse of append`
  - [x] 5.4 Write unit tests for NumberBuffer
    - Test ignore-when-full: fourth `append` returns false without modifying `digits`
    - Test backspace on empty returns false
    - Test `clear()` resets fully-populated buffer
    - _Requirements: 7.2, 7.9, 14.2_

- [x] 6. Checkpoint — verify pure engine unit and property tests pass
  - Run `npx vitest run tests/unit tests/property` and ensure all tests pass with ≥80 % line coverage on the modules implemented so far
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement FlashClock
  - [x] 7.1 Implement `src/engine/FlashClock.ts`
    - Maintain `phase: boolean` (default `true`)
    - `start()`: call `setInterval(500)` toggling phase and notifying all subscribers; guard against double-start
    - `stop()`: clear the interval, reset `phase` to `true`, notify subscribers
    - `subscribe(cb)`: add callback to subscriber list; return unsubscribe function
    - Export `createFlashClock(): FlashClock`
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 7.2 Write unit tests for FlashClock
    - Use fake timers (Vitest `vi.useFakeTimers`) to advance 500 ms and assert phase toggled
    - Test that all subscribers receive each phase change
    - Test that `stop()` resets phase to `true` and no further callbacks fire
    - Test that `start()` called twice does not create two intervals
    - _Requirements: 5.2, 5.4_

- [x] 8. Implement RevealMode and HoldMode
  - [x] 8.1 Implement `src/engine/RevealMode.ts`
    - Simple boolean flag with `activate()`, `deactivate()`, `toggle()`, `reset()` (→ false), and `readonly isActive: boolean`
    - Export `createRevealMode()`
    - _Requirements: 10.1, 10.3, 10.4, 10.5, 10.6_
  - [x] 8.2 Implement `src/engine/HoldMode.ts`
    - Same shape as RevealMode: boolean flag with `activate()`, `deactivate()`, `toggle()`, `reset()` (→ false), and `readonly isActive: boolean`
    - Export `createHoldMode()`
    - _Requirements: 9.3, 9.4, 9.6_
  - [x] 8.3 Write unit tests for RevealMode and HoldMode
    - Test toggle, activate, deactivate, and reset transitions for both
    - _Requirements: 9.3, 9.4, 10.3, 10.5_

- [x] 9. Implement SubPageRotator
  - [x] 9.1 Implement `src/engine/SubPageRotator.ts`
    - `start(totalSubPages)`: begin 15 000 ms `setInterval`; set `currentIndex` to 0
    - `stop()`: clear the interval
    - `hold()`: set `isHeld = true`; do not clear interval but skip advance while held
    - `resume()`: set `isHeld = false`; rotation resumes from `currentIndex`
    - On interval tick: if not held, increment `currentIndex` modulo `totalSubPages` and call `onAdvance`
    - Clamp out-of-range `currentIndex` on `start` to 0 and log a warning
    - Export `createSubPageRotator(): SubPageRotator`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_
  - [x] 9.2 Write unit tests for SubPageRotator
    - Use fake timers to advance 15 s and assert `onAdvance` fired with incremented index
    - Test wrap-around from last to first sub-page
    - Test that `hold()` suppresses `onAdvance`, `resume()` re-enables it
    - Test that `stop()` prevents any further `onAdvance` calls
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 10. Implement ScreenReaderGenerator
  - [x] 10.1 Implement `src/engine/ScreenReaderGenerator.ts`
    - Iterate rows 0–24; for each cell: if `mosaic` → `"[graphic]"`; else if `concealed && !revealActive` → `" "`; else decode char code to string
    - Join each row's cells, trim trailing spaces, omit empty rows
    - Return the resulting string array
    - Export `createScreenReaderGenerator(): ScreenReaderGenerator`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [x] 10.2 Write property test for screen reader attribute stripping (Property 8)
    - **Property 8: Screen reader view strips attributes**
    - Use `fc.array(cellArbitrary, { minLength: 40, maxLength: 40 })` to generate a full row of arbitrary cells
    - Assert output contains no colour codes, attribute codes, or mosaic character codes
    - **Validates: Requirements 12.1, 12.2, 12.3**
    - `// Feature: teletext-engine, Property 8: Screen reader view strips attributes`
  - [x] 10.3 Write property test for reveal mode preserving concealed attribute (Property 9)
    - **Property 9: Reveal mode does not modify concealed attribute**
    - Use `fc.boolean()` for `revealActive` combined with a grid containing cells with `concealed: true`
    - Assert the cell's `concealed` field in `GridModel` remains `true` after `generate()` regardless of `revealActive`
    - **Validates: Requirements 10.3, 10.5, 12.4, 12.5**
    - `// Feature: teletext-engine, Property 9: Reveal mode preserves concealed attribute`
  - [x] 10.4 Write unit tests for ScreenReaderGenerator
    - Test mosaic cells produce `"[graphic]"`
    - Test concealed cells return `" "` when `revealActive = false` and actual character when `true`
    - Test empty rows are omitted from output
    - Test output contains no colour or attribute strings
    - _Requirements: 12.1–12.5_

- [x] 11. Implement HeaderRow and FastextBar
  - [x] 11.1 Implement `src/engine/HeaderRow.ts`
    - Accepts references to `GridModel`, `NumberBuffer`, `RevealMode`, current page number, and sub-page info
    - `render(now: Date)`: writes row 0 of the grid according to the header layout (cols 0–2 buffer/page, 4–11 "PAGE 100", 13–17 sub-page/hold, 20–25 date, 32–39 clock)
    - `start()` / `stop()`: manage the 1 s `setInterval` for the clock and 500 ms `setInterval` for the blinking cursor
    - Export `createHeaderRow(...)`
    - _Requirements: 6.1–6.8_
  - [x] 11.2 Implement `src/engine/FastextBar.ts`
    - Accepts a `PageData` reference
    - `render(grid: GridModel)`: writes row 24 according to the Fastext bar layout (cols 0–9 red, 10–19 green, 20–29 yellow, 30–39 cyan), padding/truncating labels to exactly 10 chars; blank slot if link is undefined
    - Export `createFastextBar()`
    - _Requirements: 8.1, 8.2, 8.3, 8.9_
  - [x] 11.3 Write unit tests for HeaderRow and FastextBar
    - Test HeaderRow writes correct cells at the specified column ranges for each field
    - Test that an empty NumberBuffer causes the current page number to appear in cols 0–2
    - Test that a 1- or 2-digit buffer shows digits plus a cursor placeholder
    - Test FastextBar pads short labels and truncates long labels to 10 chars
    - Test FastextBar renders a blank slot when a link is undefined
    - _Requirements: 6.2, 6.3, 6.4, 6.7, 6.8, 8.2, 8.9_

- [x] 12. Implement MockDataStore
  - [x] 12.1 Implement `src/data/MockDataStore.ts`
    - Define five `PageData` objects (pages 100, 101, 150, 302, 401) with cell arrays conforming to the mock catalogue in the design
    - Page 100: mosaic logo with ≥4×2 mosaic cells
    - Page 101: double-height headline cells on at least one row
    - Page 150: ≥3 Q&A pairs; answer cells have `concealed: true`
    - Page 302: ≥1 flashing score cell
    - Page 401: ≥10 mosaic cells forming a weather map
    - `getPage(number)`: return matching `PageData` wrapped in a resolved `Promise`, or `Promise<null>` if absent
    - `listPages()`: return `Promise<number[]>` of the five page numbers
    - Export `createMockDataStore(): PageDataProvider`
    - _Requirements: 11.1–11.7_
  - [x] 12.2 Write unit tests for MockDataStore
    - Test `getPage(100)` returns page 100 with ≥4 mosaic cells in a 2-row region
    - Test `getPage(150)` returns page with ≥3 concealed answer cells
    - Test `getPage(999)` returns `null`
    - Test `listPages()` returns exactly `[100, 101, 150, 302, 401]`
    - _Requirements: 11.1–11.5, 11.7_

- [x] 13. Implement Navigator
  - [x] 13.1 Implement `src/engine/Navigator.ts`
    - Finite state machine with states `idle | buffering | loading | found | not-found`
    - `onDigit(d)`: append to `NumberBuffer`; transition `idle → buffering`; when buffer reaches 3 digits transition `buffering → loading` and call `PageDataProvider.getPage()`
    - `onBackspace()`: delegate to `NumberBuffer.backspace()`; if buffer becomes empty, transition `buffering → idle`
    - `navigateTo(pageNumber)`: directly initiate a load from `idle` state (Fastext / programmatic)
    - `loading` state: await `getPage()` result but hold in loading for at least 1000 ms (±100 ms) using the injected timer; then transition to `found` or `not-found`
    - `found` state: apply `SubPageData.cells` to `GridModel`, update `FastextBar`, update `HeaderRow`, reset `RevealMode` and `HoldMode`, start `SubPageRotator` if >1 sub-page, then transition to `idle`
    - `not-found` state: render "page not found" message to grid, then transition to `idle`
    - 5 s idle timer on `NumberBuffer`: `clearTimeout` on each digit; if 5 s elapses without input, call `NumberBuffer.clear()` and transition back to `idle`
    - Export `createNavigator(...dependencies...): Navigator`
    - _Requirements: 7.1–7.10, 8.4–8.11, 9.6, 10.4, 10.6_
  - [x] 13.2 Write unit tests for Navigator state machine
    - Use `vi.useFakeTimers()` throughout
    - Test `idle → buffering → loading → found` happy path with 1000 ms advance
    - Test `idle → buffering → loading → not-found` when `getPage` returns `null`
    - Test Fastext `navigateTo` triggers load from idle
    - Test idle timeout (5 s) clears buffer and returns to idle
    - Test backspace while buffering removes digit; backspace to empty returns to idle
    - Test digit input while loading/found is ignored
    - _Requirements: 7.1–7.10, 14.2_

- [x] 14. Checkpoint — verify full engine test suite
  - Run `npx vitest run --coverage` and confirm all engine-module tests pass with ≥80 % line coverage across `GridModel`, `ColourModel`, `MosaicRenderer`, `NumberBuffer`, and `Navigator`
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Download and bundle the Bedstead teletext font
  - Visit the official Bedstead website (https://bjh21.me.uk/bedstead/) and download the font files
  - Copy the `bedstead.woff2` file (or the best available web format) into `public/fonts/bedstead.woff2`
  - Copy the font's licence and/or readme file into `public/fonts/` alongside the font file (e.g. `public/fonts/LICENCE` or `public/fonts/README`)
  - Verify the font file is not corrupt by opening it in a font viewer or running `woff2_decompress` if available
  - _Requirements: (design constraint — Bedstead font bundled locally, no CDN)_

- [x] 16. Implement GridRenderer
  - [x] 16.1 Implement `src/ui/GridRenderer.ts`
    - Accept `HTMLCanvasElement`, `GridModel`, `ColourModel`, `MosaicRenderer`, `FlashClock`, and `RevealMode` as constructor arguments
    - `init()`: await `document.fonts.ready`; then call `resize()` and `renderAll()`
    - `resize()`: compute `dpr = window.devicePixelRatio`; set canvas `width`/`height` attributes to `cssWidth * dpr` / `cssHeight * dpr`; call `ctx.scale(dpr, dpr)`; compute whole-pixel `cellWidth` and `cellHeight`; call `renderAll()`
    - `renderAll()`: iterate all 25×40 cells and render each with `renderCell()`
    - `renderCell(row, col)`: use `ColourModel.toRGB` for fill colours; for mosaic cells call `MosaicRenderer.subBlocks()` and use `fillRect` for each sub-block; for text cells use `ctx.fillText` with the Bedstead font; handle double-height cells (scale ×2 vertically, blank row below); handle flash (subscribe to `FlashClock` and re-render only flashing cells on each phase change)
    - Attach `window.addEventListener('resize', ...)` to call `resize()`
    - Export `createGridRenderer(...): GridRenderer`
    - _Requirements: 1.1–1.5, 2.3, 2.4, 2.5, 3.1–3.6, 4.1–4.6, 5.2–5.4_
  - [x] 16.2 Write unit tests for GridRenderer cell sizing
    - Use a mock canvas with `jsdom` or manual stubs; verify `cellWidth = Math.floor(canvasWidth / 40)` and `cellHeight = Math.floor(canvasHeight / 25)`
    - Verify `devicePixelRatio` scaling is applied to canvas `width`/`height` attributes
    - _Requirements: 1.5, 1.2_

- [x] 17. Implement OnScreenRemote
  - [x] 17.1 Implement `src/ui/OnScreenRemote.ts`
    - Render digit buttons 0–9, Backspace, Hold, and Reveal using vanilla DOM (no framework)
    - Collapse/Expand toggle: hide/show the remote body; update toggle label
    - Dispatch custom events (`digit`, `backspace`, `hold`, `reveal`) that `main.ts` wires to the Navigator/engine
    - Apply CSS media query layout: beside grid when viewport is wide enough, below when not
    - Add Fastext colour buttons (R, G, Y, C) that dispatch `fastext` events with the colour as payload
    - Export `createOnScreenRemote(containerEl: HTMLElement): OnScreenRemote`
    - _Requirements: 8.4–8.8, 13.1–13.10_
  - [x] 17.2 Write unit tests for OnScreenRemote
    - Use `jsdom` to test that pressing digit buttons dispatches `digit` events with correct values
    - Test that Collapse toggle hides the remote body and updates the label
    - Test that Hold and Reveal buttons dispatch the correct events
    - _Requirements: 13.1, 13.4–13.10_

- [x] 18. Implement ScreenReaderView ARIA integration
  - [x] 18.1 Add ARIA live region to `index.html` and wire to `ScreenReaderGenerator` in `main.ts`
    - Add `<div aria-live="polite" id="sr-view">` to `index.html`
    - After every page render, call `ScreenReaderGenerator.generate()` and update the element's `textContent`
    - Bind `Alt+T` keyboard shortcut to move focus to `#sr-view`
    - _Requirements: 12.6, 12.7_

- [x] 19. Wire everything together in `main.ts` and `index.html`
  - [x] 19.1 Create `index.html` with `<canvas id="teletext">`, `#sr-view`, and remote container; include `@font-face` for Bedstead from `public/fonts/bedstead.woff2`; apply 4:3 letterbox CSS
    - _Requirements: 1.2, 1.4, 11.6_
  - [x] 19.2 Create `src/main.ts`
    - Instantiate all engine modules: `GridModel`, `ColourModel`, `MosaicRenderer`, `FlashClock`, `NumberBuffer`, `RevealMode`, `HoldMode`, `SubPageRotator`, `HeaderRow`, `FastextBar`, `ScreenReaderGenerator`, `Navigator`, `MockDataStore`
    - Instantiate `GridRenderer` and call `init()`
    - Instantiate `OnScreenRemote` and wire its custom events to Navigator/engine methods
    - Attach keyboard listeners: digits 0–9 → `Navigator.onDigit`, Backspace → `Navigator.onBackspace`, H → HoldMode toggle, V → RevealMode toggle, R/G/Y/C → `Navigator.navigateTo(fastextLink)`
    - Call `Navigator.navigateTo(100)` to load the default start page
    - _Requirements: 7.7, 8.4–8.8, 9.3, 10.3, 11.6, 13.7–13.10_

- [x] 20. Final checkpoint — full test suite and coverage
  - Run `npx vitest run --coverage` and confirm all tests pass within 10 seconds and coverage is ≥80 % across all engine modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Write README.md and add MIT LICENSE file
  - Create `README.md` in the project root with:
    - A short description of what Page 100 is (browser-based teletext emulator recreating the classic British teletext experience)
    - How to run it: `npm install`, `npm run dev` (development server), `npm test` (unit + property tests), `npm run build` (production build)
    - The page directory listing all five mock pages: 100 (index), 101 (news headlines), 150 (quiz — type 150), 302 (football scores — type 302), 401 (weather map — type 401)
    - Navigation instructions: type 3 digits for direct page access; R/G/Y/C keys for Fastext links; H to hold sub-pages; V to reveal hidden answers
  - Create `LICENSE` in the project root with the MIT licence text, copyright year as the current year, and copyright holder as the repository owner
  - _Requirements: (project documentation — not tied to a specific functional requirement)_

## Notes

- All test tasks are required. Every module with logic must have corresponding unit and/or property tests.
- Each task references specific requirements from `requirements.md` for full traceability
- Property tests require the `cellArbitrary` helper (a `fc.record` matching the `Cell` interface) to be defined once in a shared `tests/property/helpers.ts` and imported by all property test files
- The `src/engine/` modules have zero browser-API dependencies and are importable in Node.js; `GridRenderer` and `OnScreenRemote` live in `src/ui/` and require a DOM
- Bedstead font must be bundled at `public/fonts/bedstead.woff2` before task 15 begins
- Fake timers (`vi.useFakeTimers`) are essential for `FlashClock`, `SubPageRotator`, `HeaderRow`, and `Navigator` tests to remain fast and deterministic

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "3.3", "3.4", "4.2", "4.3", "4.4", "5.2", "5.3", "5.4"] },
    { "id": 3, "tasks": ["7.1", "8.1", "8.2", "10.1", "11.2", "12.1"] },
    { "id": 4, "tasks": ["7.2", "8.3", "9.1", "10.2", "10.3", "10.4", "11.1", "12.2"] },
    { "id": 5, "tasks": ["9.2", "11.3", "13.1"] },
    { "id": 6, "tasks": ["13.2", "15"] },
    { "id": 7, "tasks": ["16.1"] },
    { "id": 8, "tasks": ["16.2", "17.1", "18.1"] },
    { "id": 9, "tasks": ["17.2", "19.1", "19.2", "21"] }
  ]
}
```
