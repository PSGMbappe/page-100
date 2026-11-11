# Requirements Document

## Introduction

Page 100 is a browser-based teletext emulator that faithfully recreates the classic British teletext
experience. The teletext engine renders 40-column × 25-row character grids at a 4:3 aspect ratio,
supports all eight classic teletext colours, mosaic block graphics, double-height and flashing text,
page navigation by digit entry and Fastext coloured links, sub-page rotation, a Reveal feature for
hidden text, and a live ticking clock in the header. The system uses mock page content (no live data)
and ships with five demonstration pages: 100 (index), 101 (news), 302 (sport), 401 (weather), and
150 (quiz).

## Glossary

- **Engine**: The teletext rendering and navigation runtime.
- **Grid**: A 40-column × 25-row array of character cells that forms one teletext page view.
- **Cell**: A single character position in the Grid, carrying a character code, foreground colour,
  background colour, and display attributes (double-height, flash, concealed, mosaic).
- **Page**: A named teletext document identified by a three-digit number (100–899), stored as one or
  more Sub-pages.
- **Sub-page**: A numbered variant of a Page (e.g. 1/3) that the Engine cycles through automatically.
- **Header_Row**: Row 0 of every rendered Page, containing the input buffer, current page number,
  service name, date, and clock.
- **Fastext_Bar**: Row 24 of every rendered Page, containing four coloured navigation links
  (red, green, yellow, cyan).
- **Colour**: One of the eight teletext colours: black, red, green, yellow, blue, magenta, cyan, white.
- **Mosaic**: A character cell rendered as a 2×3 block-graphics "sixel" pattern using the teletext
  mosaic character set.
- **Number_Buffer**: A transient one-to-three digit string accumulating keystrokes for page navigation.
- **Navigator**: The subsystem that accepts digit input, resolves Page lookups, and transitions
  between navigation states.
- **Reveal_Mode**: A display-only mode in which concealed Cells (e.g. quiz answers) are rendered visible without altering cell data.
- **Hold_Mode**: A mode that pauses automatic Sub-page rotation on the current Sub-page.
- **Screen_Reader_View**: A plain-text alternative representation of a Page for assistive technology.

---

## Requirements

### Requirement 1: Character Grid Rendering

**User Story:** As a viewer, I want the teletext page to fill my screen at the correct aspect ratio
so that the display looks authentic and legible at any window size.

#### Acceptance Criteria

1. THE Engine SHALL render every Page as a Grid of exactly 40 columns and 25 rows of character Cells.
2. THE Engine SHALL maintain a display aspect ratio between 1.30 and 1.40 (width ÷ height) at all viewport sizes with a minimum width of 320 pixels and minimum height of 240 pixels, preserving the classic 4:3 teletext look.
3. WHEN the viewport is resized, THE Engine SHALL scale the Grid to the largest size that fits within the available screen area while maintaining the aspect ratio constraint from criterion 2, without cropping any Cell.
4. IF the viewport aspect ratio falls outside the 1.30–1.40 range, THEN THE Engine SHALL letterbox the Grid (adding empty space on the shorter axis) so that the Grid itself remains within the 1.30–1.40 aspect ratio and no Cell is cropped.
5. THE Engine SHALL render each Cell at the same pixel dimensions as every other Cell on the same rendered frame, with Cell width and height each being a whole number of pixels.
6. THE Engine SHALL expose a Grid model in which every Cell can be read and written independently by row index (0–24) and column index (0–39).

---

### Requirement 2: Colour Model

**User Story:** As a viewer, I want all eight classic teletext colours applied faithfully per cell so
that pages look exactly as they did on a real teletext service.

#### Acceptance Criteria

1. THE Engine SHALL support exactly eight named Colours: black, red, green, yellow, blue, magenta,
   cyan, and white.
2. THE Engine SHALL assign an independent foreground Colour and background Colour to every Cell.
3. WHEN a Cell's foreground and background Colour are identical, THE Engine SHALL still render the
   Cell (the character will be invisible but the Cell must occupy its correct space).
4. THE Engine SHALL map each named Colour to a fixed RGB value as follows: black → #000000,
   red → #FF0000, green → #00FF00, yellow → #FFFF00, blue → #0000FF, magenta → #FF00FF,
   cyan → #00FFFF, white → #FFFFFF.
5. THE Engine SHALL apply foreground Colour to the drawn ink pixels of the glyph and background
   Colour to the entire bounding rectangle of the Cell, including all pixels not occupied by glyph
   ink.
6. IF a colour value that is not one of the eight named Colours is assigned to a Cell, THEN THE
   Engine SHALL reject the assignment and preserve the Cell's existing foreground and background
   Colour values unchanged.

---

### Requirement 3: Mosaic Block Graphics

**User Story:** As a content author, I want mosaic block-graphic characters so that I can compose
logos, maps, and decorative borders using the classic 2×3 sixel pattern.

#### Acceptance Criteria

1. THE Engine SHALL render Mosaic Cells using a 2-column × 3-row sixel grid within the Cell bounds,
   where each Cell is subdivided into six equal sub-blocks (each sub-block occupying one-half the
   Cell width and one-third the Cell height), and each sub-block is independently active or inactive.
2. THE Engine SHALL map mosaic character codes 0x20–0x3F and 0x60–0x7F (contiguous mosaic set) to
   a sixel bitmask where bits 0–5 correspond to sub-block positions in row-major order
   (top-left, top-right, middle-left, middle-right, bottom-left, bottom-right), per the teletext
   Level 1 specification.
3. WHEN a Cell is flagged as Mosaic, THE Engine SHALL fill each active sub-block with the Cell's
   foreground Colour and each inactive sub-block with the Cell's background Colour.
4. THE Engine SHALL render non-Mosaic Cells using the standard teletext character set glyphs.
5. THE Engine SHALL ensure that for every valid mosaic character code (0x20–0x3F and 0x60–0x7F),
   the six rendered sub-block states exactly reproduce the sixel bitmask derived from that
   character code with no bit transposition or sub-block omission.
6. IF a Mosaic Cell contains a character code outside the ranges 0x20–0x3F and 0x60–0x7F, THEN
   THE Engine SHALL render that Cell as a fully inactive mosaic (all six sub-blocks filled with
   the Cell's background Colour) and indicate an invalid character code error.

---

### Requirement 4: Double-Height Text

**User Story:** As a content author, I want double-height text so that headlines and titles stand out
prominently on a page.

#### Acceptance Criteria

1. THE Engine SHALL support a double-height attribute on any Cell in rows 0–23.
2. WHEN a Cell has the double-height attribute set, THE Engine SHALL render that Cell's character scaled to twice the standard single-row Cell height, with the top half displayed in the Cell's own row and the bottom half displayed in the row immediately below.
3. WHEN a Cell has the double-height attribute set, THE Engine SHALL render the Cell directly below it as a blank Cell with no character and no attributes, regardless of any content or attributes stored in that Cell.
4. IF a double-height Cell appears on row 24, THEN THE Engine SHALL render it at the standard single-row Cell height to prevent overflow beyond the Grid boundary.
5. WHEN a Cell has both the double-height and Mosaic attributes set, THE Engine SHALL render the Mosaic graphic scaled to twice the standard single-row Cell height, applying the same two-row occupancy rule as double-height text.
6. IF the Cell immediately below a double-height Cell also has the double-height attribute set, THEN THE Engine SHALL ignore the double-height attribute on the lower Cell and render it as a blank Cell per criterion 3.

---

### Requirement 5: Flashing Text

**User Story:** As a content author, I want flashing text so that I can draw attention to important
items such as breaking news alerts.

#### Acceptance Criteria

1. THE Engine SHALL accept a boolean flash attribute (true or false, default false) on any Cell and
   apply it to that Cell's rendering behaviour.
2. WHEN a Cell has the flash attribute set to true, THE Engine SHALL alternate the Cell's foreground
   character between rendered (foreground Colour fully applied) and not rendered at a rate of 1 Hz
   (±0.1 Hz).
3. WHEN a Cell has the flash attribute set to true, THE Engine SHALL keep the Cell's background
   Colour continuously rendered during both phases of the flash cycle.
4. THE Engine SHALL synchronise the flash phase of all Cells whose flash attribute is true on the
   same Page to a single shared Page-level clock that starts when the Page is first displayed, such
   that the visible-to-invisible transition of every flashing Cell on that Page occurs within 20 ms
   of every other flashing Cell on that Page.
5. WHILE Hold_Mode is active, THE Engine SHALL continue to flash Cells on the held Sub-page.
6. WHEN a Cell's flash attribute is set to false, THE Engine SHALL immediately render the Cell's
   foreground character in its defined foreground Colour and maintain that state until the flash
   attribute is set to true again.

---

### Requirement 6: Header Row

**User Story:** As a viewer, I want the header row to always show the current page number, service
name, date, and a live clock so that I know what page I am on and what time it is.

#### Acceptance Criteria

1. THE Engine SHALL dedicate row 0 of every rendered Page to the Header_Row, spanning columns 0–39.
2. THE Header_Row SHALL display the Number_Buffer content in columns 0–2, left-justified, showing typed digits as they are entered.
3. IF the Number_Buffer is empty, THEN THE Header_Row SHALL display the current Page number in columns 0–2, left-justified.
4. THE Header_Row SHALL display the service name "PAGE 100" in columns 4–11 of the Header_Row.
5. THE Header_Row SHALL display the sub-page indicator or Hold marker in columns 13–17: "M/N" when the current Page has more than one Sub-page (per Requirement 9), "HOLD" when Hold_Mode is active, and blank otherwise.
6. THE Header_Row SHALL display the current date in DD MMM format (e.g. "15 NOV") in columns 20–25 of the Header_Row.
7. WHILE the Engine is running, THE Header_Row SHALL display the current local time in HH:MM:SS format in columns 32–39, updated once per second.
8. WHEN the Number_Buffer contains one or two digits, THE Header_Row SHALL display those digits followed by a blinking cursor character in columns 0–2, where the cursor toggles visibility at 1 Hz (500 ms on, 500 ms off).

---

### Requirement 7: Page Navigation — Digit Entry

**User Story:** As a viewer, I want to type a three-digit page number on the keyboard so that I can
jump directly to any page.

#### Acceptance Criteria

1. WHEN the viewer presses a digit key (0–9) and the Number_Buffer contains fewer than three digits, THE Navigator SHALL append the digit to the Number_Buffer and display the current Number_Buffer contents on-screen.
2. IF the Number_Buffer already contains three digits and the viewer presses a digit key (0–9), THEN THE Navigator SHALL ignore the input.
3. IF the Number_Buffer contains three digits, THEN THE Navigator SHALL immediately initiate a page load for the page number represented by those three digits within 50 ms of the third digit being appended.
4. WHEN a page load is initiated, THE Navigator SHALL display a "searching" animation on the Grid for a simulated load duration of 1000 ms (±100 ms).
5. WHEN the simulated load completes, IF the requested Page exists, THE Navigator SHALL render the first Sub-page of that Page and clear the Number_Buffer.
6. WHEN the simulated load completes, IF the requested Page does not exist, THE Navigator SHALL render a "page not found" message and clear the Number_Buffer.
7. THE Navigator SHALL accept digit input from both the physical keyboard and the on-screen remote control.
8. WHILE the Number_Buffer is non-empty, WHEN the viewer presses the Backspace key, THE Navigator SHALL remove the last digit from the Number_Buffer and update the on-screen display of the Number_Buffer.
9. IF the viewer presses the Backspace key while the Number_Buffer is empty, THEN THE Navigator SHALL ignore the input.
10. IF the Number_Buffer is non-empty and no digit or Backspace key is pressed within 5 seconds, THEN THE Navigator SHALL clear the Number_Buffer and remove its on-screen display.

---

### Requirement 8: Fastext Bar

**User Story:** As a viewer, I want coloured Fastext links at the bottom of every page so that I can
quickly jump to related pages with a single key press or click.

#### Acceptance Criteria

1. THE Engine SHALL dedicate row 24 of every rendered Page to the Fastext_Bar, spanning all 40 character columns.
2. THE Fastext_Bar SHALL display exactly four link labels in fixed left-to-right order: red, green, yellow, and cyan, each label occupying exactly 10 characters.
3. WHEN a Page is loaded, THE Engine SHALL populate the Fastext_Bar with the four link destinations
   defined for that Page.
4. WHEN the viewer presses the R key, THE Navigator SHALL navigate to the red Fastext link
   destination.
5. WHEN the viewer presses the G key, THE Navigator SHALL navigate to the green Fastext link
   destination.
6. WHEN the viewer presses the Y key, THE Navigator SHALL navigate to the yellow Fastext link
   destination.
7. WHEN the viewer presses the C key, THE Navigator SHALL navigate to the cyan Fastext link
   destination.
8. WHEN the viewer clicks a Fastext_Bar link, THE Navigator SHALL navigate to that link's destination.
9. IF a Fastext link destination is not defined for a Page, THEN THE Engine SHALL render that link position in the Fastext_Bar with no label text, no foreground colour, and no active interaction.
10. IF the viewer activates a Fastext_Bar link position that has no defined destination, THEN THE Navigator SHALL remain on the current Page.
11. IF a Fastext link destination references a Page that does not exist, THEN THE Navigator SHALL remain on the current Page and display an error message indicating the destination is unavailable.

---

### Requirement 9: Sub-page Rotation

**User Story:** As a viewer, I want sub-pages to rotate automatically so that I can read multi-part
pages without pressing any buttons.

#### Acceptance Criteria

1. WHILE a Page has more than one Sub-page and Hold_Mode is not active, THE Engine SHALL advance to the next Sub-page every 15 seconds, measured from the moment the current Sub-page is first displayed.
2. WHEN the last Sub-page is displayed, THE Engine SHALL wrap around and display the first Sub-page.
3. WHEN the viewer activates Hold_Mode (by pressing the H key or clicking Hold), THE Engine SHALL pause Sub-page rotation on the currently displayed Sub-page.
4. WHEN the viewer deactivates Hold_Mode, THE Engine SHALL resume automatic Sub-page rotation from the held Sub-page.
5. IF a Page has exactly one Sub-page, THEN THE Engine SHALL not display a Sub-page indicator.
6. WHEN the Engine navigates away from a Page, THE Engine SHALL deactivate Hold_Mode and reset the Sub-page rotation timer.

---

### Requirement 10: Reveal Mode

**User Story:** As a viewer, I want a Reveal button to uncover hidden text on quiz pages so that I
can check my answers without seeing them accidentally.

#### Acceptance Criteria

1. THE Engine SHALL accept a boolean concealed attribute (true or false, default false) on any Cell, governing whether that Cell participates in Reveal_Mode rendering.
2. WHILE Reveal_Mode is inactive, THE Engine SHALL render concealed Cells using a space character with the Cell's background Colour applied to both foreground and background, regardless of the Cell's defined foreground Colour.
3. WHEN the viewer activates Reveal_Mode (by pressing the V key or clicking Reveal), THE Engine SHALL render all concealed Cells on the current Page using their stored foreground Colour and character, without modifying the Cell's concealed attribute.
4. WHEN the viewer navigates to a different Page, THE Engine SHALL deactivate Reveal_Mode, causing concealed Cells on the new Page to render in the concealed state defined in criterion 2.
5. WHILE Reveal_Mode is active, WHEN the viewer activates Reveal_Mode (by pressing the V key or clicking Reveal), THE Engine SHALL deactivate Reveal_Mode, causing all concealed Cells on the current Page to render in the concealed state defined in criterion 2, without modifying any Cell's concealed attribute.
6. WHEN a Page is loaded or navigated to, THE Engine SHALL initialise Reveal_Mode to the inactive state.

---

### Requirement 11: Mock Page Content

**User Story:** As a developer, I want a set of mock teletext pages so that the system can be
demonstrated and tested without a live data feed.

#### Acceptance Criteria

1. THE Engine SHALL include a mock data store containing at least five Pages: 100 (index), 101
   (news headlines), 302 (football scores), 401 (weather map), and 150 (quiz).
2. THE mock Page 100 SHALL include a Mosaic logo composed of a grid of at least 4 columns by 2 rows of Mosaic Cells.
3. THE mock Page 150 SHALL include at least three questions, each paired with one or more answer Cells whose concealed attribute is set to true at page load.
4. THE mock Page 150 answer Cells SHALL have their concealed attribute remain true at all times; Reveal_Mode controls their visual rendering only and SHALL NOT modify the concealed attribute.
5. THE mock Page 401 SHALL include a weather map composed of at least 10 Mosaic Cells arranged to represent distinct geographic regions.
6. WHEN the Engine initialises, THE Engine SHALL load Page 100 as the default starting page.
7. THE mock data store SHALL expose the same data-provider interface as any live data adapter, such that substituting one for the other requires no changes to the Navigator or Engine rendering code.

---

### Requirement 12: Screen Reader Accessibility

**User Story:** As a visually impaired viewer, I want a screen-reader-friendly text version of each
page so that I can access teletext content without relying on the visual grid.

#### Acceptance Criteria

1. WHEN a Page completes rendering, THE Engine SHALL generate a Screen_Reader_View by: (a) producing one plain-text string per row of the Grid ordered top-to-bottom and left-to-right; (b) trimming trailing space characters (U+0020) from each row string; and (c) omitting any row whose trimmed string is empty.
2. THE Screen_Reader_View SHALL contain no colour codes, mosaic character codes, or display attributes (flash, double-height, double-width, conceal, box).
3. IF a Cell is a Mosaic Cell, THEN THE Screen_Reader_View SHALL substitute that Cell with the fixed placeholder string "[graphic]".
4. IF Reveal_Mode is inactive, THEN THE Screen_Reader_View SHALL substitute each concealed Cell with a single space character (U+0020).
5. IF Reveal_Mode is active, THEN THE Screen_Reader_View SHALL substitute each concealed Cell with its actual decoded character.
6. WHEN a Page change occurs, THE Engine SHALL update the ARIA live region (aria-live="polite") that contains the Screen_Reader_View, so that screen readers announce the new content after completing any in-progress speech.
7. WHEN the user presses Alt+T, THE Engine SHALL move keyboard focus to the Screen_Reader_View.

---

### Requirement 13: On-Screen Remote Control

**User Story:** As a viewer, I want an on-screen remote control so that I can navigate pages without relying solely on a physical keyboard.

#### Acceptance Criteria

1. THE Engine SHALL render an on-screen remote control containing digit buttons 0–9, a Backspace button, a Hold button, and a Reveal button, visible on all devices.
2. WHEN the viewport width is sufficient to display the Grid and the remote side by side without overlapping, THE Engine SHALL position the remote control beside the Grid.
3. WHEN the viewport width is not sufficient to display the Grid and the remote side by side, THE Engine SHALL position the remote control below the Grid.
4. THE Engine SHALL render a Collapse/Expand toggle button that hides or shows the remote control body while keeping the toggle button itself always visible.
5. WHEN the viewer activates the Collapse toggle, THE Engine SHALL hide the remote control body and update the toggle label to indicate that the remote can be expanded.
6. WHEN the viewer activates the Expand toggle, THE Engine SHALL show the remote control body and update the toggle label to indicate that the remote can be collapsed.
7. WHEN the viewer presses or taps a digit button on the on-screen remote, THE Navigator SHALL process it identically to the corresponding physical keyboard digit key.
8. WHEN the viewer presses or taps the Backspace button on the on-screen remote, THE Navigator SHALL process it identically to the physical Backspace key.
9. WHEN the viewer presses or taps the Hold button on the on-screen remote, THE Engine SHALL toggle Hold_Mode and update the Hold button's visual state to indicate whether Hold_Mode is active or inactive.
10. WHEN the viewer presses or taps the Reveal button on the on-screen remote, THE Engine SHALL toggle Reveal_Mode and update the Reveal button's visual state to indicate whether Reveal_Mode is active or inactive.

---

### Requirement 14: Unit-Testable Core Model

**User Story:** As a developer, I want the grid model, colour system, mosaic graphics, navigation
logic, and number entry to be unit-testable in isolation so that regressions are caught automatically.

#### Acceptance Criteria

1. THE Engine SHALL expose the Grid model, Colour model, Mosaic renderer, Navigator, and Number_Buffer as independently importable modules that can each be imported in a non-browser JavaScript runtime (such as Node.js) without throwing an error or requiring a browser DOM to be present.
2. THE Engine SHALL ship with unit tests covering: Grid Cell read/write, all eight Colour mappings, mosaic bitmask round-trip encoding, Number_Buffer digit accumulation and clearing, and Navigator state transitions (idle → loading → found, idle → loading → not-found).
3. WHEN the full unit test suite is executed in a single continuous run, THE Engine SHALL complete all tests within 10 seconds on a machine with at least 2 CPU cores and 4 GB of available RAM.
4. THE Engine SHALL achieve at least 80% line coverage across the Grid, Colour, Mosaic, Navigator, and Number_Buffer modules as measured by the project's configured coverage tool.
5. WHEN a valid mosaic character code in the range 0x20–0x3F or 0x60–0x7F is encoded and then decoded, THE Engine SHALL produce the original character code unchanged.
6. IF a mosaic character code outside the ranges 0x20–0x3F and 0x60–0x7F is passed to the encoder, THEN THE Engine SHALL reject the input with an error indicating the code is out of the valid range without modifying any internal state.
