# Tech

- TypeScript + Vite, no heavy UI framework. Plain DOM rendering into a character grid.
- Vitest for unit tests. Every module with logic has tests; run them before marking a task done.
- Static site, deployable to GitHub Pages (Vite `base: './'`). No server.
- Live data comes from public APIs that allow browser (CORS) access, behind one data-adapter layer with caching and bundled offline sample data, so the app always works even if an API is down.
- Keyboard first, also works with mouse and touch (on-screen remote).
- Accessible: a screen-reader text version of every page.
- Small and fast: no large dependencies, no tracking, no API keys committed to the repo.
