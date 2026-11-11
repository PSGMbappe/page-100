/**
 * Mock teletext pages: 100 index, 101 news, 150 quiz, 302 football, 401 weather.
 * All stories, teams and figures are fictional.
 */

import type { PageData } from '../engine/types';
import { bigText, createPageBuilder } from './pageBuilder';

const INDEX = { page: 100, label: 'Index' };
const NEWS = { page: 101, label: 'News' };
const QUIZ = { page: 150, label: 'Quiz' };
const SPORT = { page: 302, label: 'Football' };
const WEATHER = { page: 401, label: 'Weather' };

/** Dotted index line: "NEWS HEADLINES ........... 101" */
function indexLine(label: string, page: number): string {
  const dots = '.'.repeat(Math.max(2, 30 - label.length));
  return `${label} ${dots} ${page}`;
}

function page100(): PageData {
  const b = createPageBuilder();
  b.band(1, 5, 'blue');
  b.pixels(2, 8, bigText('PAGE 100'), 'yellow', 'blue');
  b.text(7, 2, 'Teletext, resurrected.', { fg: 'cyan' });
  const entries: [string, number, 'white' | 'yellow'][] = [
    ['NEWS HEADLINES', 101, 'white'],
    ['FOOTBALL', 302, 'white'],
    ['WEATHER MAP', 401, 'white'],
    ['QUIZ', 150, 'white'],
  ];
  entries.forEach(([label, page], i) => {
    const line = indexLine(label, page);
    b.text(9 + i * 2, 2, line.slice(0, -3), { fg: 'white' });
    b.text(9 + i * 2, 2 + line.length - 3, String(page), { fg: 'yellow' });
  });
  b.text(18, 2, 'Type a page number to go there,', { fg: 'green' });
  b.text(19, 2, 'or use the coloured keys below.', { fg: 'green' });
  b.text(21, 2, 'Welcome back to 1985.', { fg: 'magenta', doubleHeight: true });
  return {
    number: 100,
    subPages: [{ index: 1, total: 1, cells: b.build() }],
    fastextLinks: { red: NEWS, green: SPORT, yellow: WEATHER, cyan: QUIZ },
  };
}

function newsSub(index: number, headline: [string, string], body: string[], more: string[]) {
  const b = createPageBuilder();
  b.band(1, 3, 'red');
  b.text(2, 2, 'NEWS', { fg: 'white', bg: 'red', doubleHeight: true });
  b.text(2, 30, '101', { fg: 'yellow', bg: 'red' });
  b.text(5, 1, headline[0], { fg: 'yellow', doubleHeight: true });
  b.text(7, 1, headline[1], { fg: 'yellow', doubleHeight: true });
  body.forEach((line, i) => b.text(10 + i, 1, line, { fg: 'white' }));
  b.text(15, 1, 'ALSO TODAY', { fg: 'cyan' });
  more.forEach((line, i) => b.text(17 + i, 1, line, { fg: 'cyan' }));
  return { index, total: 2, cells: b.build() };
}

function page101(): PageData {
  return {
    number: 101,
    subPages: [
      newsSub(
        1,
        ['Teletext makes surprise', 'comeback in web browsers'],
        [
          'A screen technology first shown in the',
          '1970s is back, rebuilt for the web.',
          'Fans say the blocky pages load faster',
          'than most modern news sites.',
        ],
        ['Seaside town votes for longer piers', 'Library lends out 10,000th umbrella'],
      ),
      newsSub(
        2,
        ['Village fete record as', 'giant marrow stuns crowd'],
        [
          'Judges needed a wheelbarrow to move',
          'the winning vegetable, which weighed',
          'more than the judging table itself.',
          'The grower credits "lots of rain".',
        ],
        ['Cats preferred to dogs, says one cat', 'Bus arrives exactly on time, twice'],
      ),
    ],
    fastextLinks: { red: INDEX, green: SPORT, yellow: WEATHER, cyan: QUIZ },
  };
}

function page150(): PageData {
  const b = createPageBuilder();
  b.band(1, 3, 'magenta');
  b.text(2, 2, 'QUIZ TIME', { fg: 'white', bg: 'magenta', doubleHeight: true });
  b.text(2, 30, '150', { fg: 'yellow', bg: 'magenta' });
  const qs: [string, string, string][] = [
    ['Q1 What year did teletext first', '   go on air in the UK?', '   1974'],
    ['Q2 How many colours could a', '   teletext page show?', '   Eight'],
    ['Q3 Which page number was', '   traditionally the index?', '   100'],
  ];
  qs.forEach(([q1, q2, answer], i) => {
    const row = 5 + i * 5;
    b.text(row, 1, q1, { fg: 'cyan' });
    b.text(row + 1, 1, q2, { fg: 'cyan' });
    b.text(row + 2, 1, 'A:', { fg: 'white' });
    b.text(row + 2, 4, answer.trim(), { fg: 'yellow', concealed: true });
  });
  b.text(21, 1, 'Press V or tap REVEAL for the answers', { fg: 'green' });
  return {
    number: 150,
    subPages: [{ index: 1, total: 1, cells: b.build() }],
    fastextLinks: { red: INDEX, green: NEWS, yellow: SPORT, cyan: WEATHER },
  };
}

function footballSub(index: number, title: string, rows: [string, string, string][], live: boolean) {
  const b = createPageBuilder();
  b.band(1, 3, 'green');
  b.text(2, 2, 'FOOTBALL', { fg: 'black', bg: 'green', doubleHeight: true });
  b.text(2, 30, '302', { fg: 'black', bg: 'green' });
  b.text(5, 1, title, { fg: 'yellow' });
  if (live) b.text(5, 34, 'LIVE', { fg: 'red', flash: true });
  rows.forEach(([home, score, away], i) => {
    const row = 7 + i * 2;
    b.text(row, 1, home.padEnd(15, ' '), { fg: 'white' });
    // A '*' marks a match still in play: its score flashes.
    b.text(row, 17, score.replace('*', ' '), { fg: 'yellow', flash: live && score.includes('*') });
    b.text(row, 23, away, { fg: 'white' });
  });
  return { index, total: 2, cells: b.build() };
}

function page302(): PageData {
  return {
    number: 302,
    subPages: [
      footballSub(
        1,
        'LATEST SCORES',
        [
          ['Northtown', ' 2-1', 'Southville'],
          ['Harbour City', ' 0-0', 'Hilltop Utd'],
          ['Riverside', '*3-2', 'Old Mill'],
          ['Castle Rovers', ' 1-4', 'Kingsbridge'],
          ['Eastfield', '*1-1', 'Westport'],
        ],
        true,
      ),
      footballSub(
        2,
        'FINAL SCORES',
        [
          ['Lakeside', ' 2-0', 'Stonehaven'],
          ['Marsh Athletic', ' 1-3', 'Pinewood'],
          ['Bridgeford', ' 0-1', 'Ashby Town'],
          ['Greenvale', ' 4-4', 'Redcliffe'],
        ],
        false,
      ),
    ],
    fastextLinks: { red: INDEX, green: NEWS, yellow: WEATHER, cyan: QUIZ },
  };
}

/** Rough UK & Ireland map; each character is one 2×3-pixel cell. */
const MAP_CELLS = [
  '........v##v......',
  '.......>####......',
  '......>#####<.....',
  '.......####<......',
  '........###v......',
  '........>####.....',
  '..v#v....>####....',
  '.>###<....####....',
  '.#####....>####...',
  '.>####.....####<..',
  '..^##^....>#####..',
  '...........######.',
  '.........>#######<',
  '........<########.',
  '.......>########<.',
  '.........#########',
  '......>##########<',
  '.....>#########^..',
  '....^^^^^^........',
];

// Edge shapes: left/right halves, top/bottom two-thirds.
const MAP_MASKS: Record<string, number> = {
  '#': 63,
  '.': 0,
  '<': 1 | 4 | 16,
  '>': 2 | 8 | 32,
  '^': 1 | 2 | 4 | 8,
  v: 4 | 8 | 16 | 32,
};

function page401(): PageData {
  const b = createPageBuilder();
  b.band(1, 3, 'blue');
  b.text(2, 2, 'WEATHER', { fg: 'yellow', bg: 'blue', doubleHeight: true });
  b.text(2, 30, '401', { fg: 'white', bg: 'blue' });
  MAP_CELLS.forEach((line, r) => {
    [...line].forEach((ch, c) => b.block(4 + r, 1 + c, MAP_MASKS[ch] ?? 0, 'green', 'blue'));
  });
  // Temperatures over the land
  const temps: [number, number, string][] = [
    [6, 10, ' 8'],
    [12, 13, '11'],
    [11, 3, '10'],
    [18, 11, '13'],
    [19, 16, '14'],
  ];
  temps.forEach(([row, col, t]) => b.text(row, col, t, { fg: 'black', bg: 'green' }));
  b.text(5, 22, 'TODAY', { fg: 'white', doubleHeight: true });
  const outlook = [
    ['NORTH', 'Rain, gusty', 'cyan'],
    ['MIDLANDS', 'Grey, dry', 'white'],
    ['WEST', 'Showers', 'cyan'],
    ['SOUTH', 'Bright spells', 'yellow'],
  ] as const;
  outlook.forEach(([region, sky, colour], i) => {
    b.text(8 + i * 3, 22, region, { fg: colour });
    b.text(9 + i * 3, 22, sky, { fg: 'white' });
  });
  b.text(21, 22, 'Temps in C', { fg: 'green' });
  return {
    number: 401,
    subPages: [{ index: 1, total: 1, cells: b.build() }],
    fastextLinks: { red: INDEX, green: NEWS, yellow: SPORT, cyan: QUIZ },
  };
}

export function buildMockPages(): PageData[] {
  return [page100(), page101(), page150(), page302(), page401()];
}
