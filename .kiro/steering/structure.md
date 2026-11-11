# Structure

- src/engine/   teletext grid model, colours, mosaic block graphics, rendering
- src/pages/    one file per page or page group (100 index, 101+ news, 300s sport, 400s weather)
- src/data/     API adapters, caching, bundled sample data
- src/ui/       remote control, number entry, Fastext bar
- tests/        Vitest tests mirroring src/

Rules:
- Keep files small and focused.
- Pages are pure functions: data in → teletext page out. No fetching inside page files.
- The engine knows nothing about specific pages or APIs.
