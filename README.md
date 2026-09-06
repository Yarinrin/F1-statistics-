# Apex — Formula One statistics archive

An F1 season-statistics shortcut. Open the app, and the current season's
drivers' standings are one tap away; any season since 1950 is three.

Built with Expo, React Native and TypeScript. No backend, no account, no
onboarding.

```
APEX
FORMULA ONE STATISTICS ARCHIVE
──────────────────────────────
CURRENT SEASON      77TH SEASON

2026
FORMULA ONE WORLD CHAMPIONSHIP ›

▌ DRIVERS
  WORLD CHAMPIONSHIP    2026  ›

  CONSTRUCTORS
  WORLD CHAMPIONSHIP    2026  ›
```

## Running it

```bash
npm install
npx expo start
```

Then press `a` for Android, `i` for iOS, or scan the QR code with Expo Go.
`npm run web` opens the browser build (see *Platform notes* below).

Checks:

```bash
npm run verify     # typecheck + lint + tests
npm run typecheck
npm run lint
npm test
```

## Screens

| Route            | What it is                                                         |
| ---------------- | ------------------------------------------------------------------ |
| `/`              | Home. Current season as the hero, drivers and constructors beneath. |
| `/seasons`       | The archive index — every season from 1950, grouped by decade.      |
| `/season/[year]` | One season: standings, race results, the full article.              |
| `/archive`       | The reader. Opens a Wikipedia section in-app.                       |
| `/settings`      | Appearance, stored data, attribution.                               |

## How the Wikipedia navigation works

The reliability rule the whole feature is built around:

> **The destination page is always the season's own article. The section is
> only ever a scroll position.**

Everything below can fail, and the worst outcome is the top of the correct
season page — never a wrong page, never a dead button.

1. **Address.** Season pages are named predictably, so the URL is generated
   rather than stored: `{year}_Formula_One_World_Championship`. The reader
   loads the mobile site (`en.m.wikipedia.org`); shared and externally opened
   links use the canonical desktop address.

2. **Section anchor.** `resolveSection()` asks the MediaWiki API for the
   article's section index (`action=parse&prop=sections`) and matches headings
   by token: every token of a pattern must appear in the heading, so
   `World Drivers' Championship standings` also matches the older
   `World Drivers' Championship final standings`. Results are cached in memory
   and on device for 30 days, and the current season's two lookups are warmed
   on the home screen. A network failure, a timeout or an unexpected payload
   all degrade to a built-in anchor; only verified results are cached.

3. **In-page scroll.** Once the page loads, a small injected script finds the
   heading — by anchor first, then by text — expands the collapsed mobile
   section it lives in, and scrolls to it. It never navigates, and it bails out
   entirely unless the page really is the season article, so following a link
   inside Wikipedia does not yank the reader back to a standings table.

4. **Reporting.** The script says whether it found the section, and the strip
   under the reader's header shows the truth: the heading it landed on, or
   *"Section not found — showing the full season page."*

The riskiest part of this — the injected script — is covered by tests that run
it against a stand-in for Wikipedia's mobile DOM: modern layouts, the older
"final standings" naming, a 1950s season with no constructors' table, and a
page the reader has navigated away from. See `tests/sectionScript.test.mjs`.

## Edge cases that are handled

- **No connection / Wikipedia unreachable** — the reader shows *Connection
  lost* with **Try again** (a full remount) and **Open in browser**.
- **HTTP errors and web-view crashes** — separate, honest states rather than a
  blank rectangle; a 12-second ceiling means the loading placeholder can never
  stick.
- **Constructors before 1958** — the World Constructors' Championship did not
  exist until 1958, so those cards are disabled and say why. Reaching that
  screen by deep link explains it and offers the drivers' table instead.
- **Invalid seasons** — `/season/1949`, `/season/abcd` and future years show an
  archive state, not a crash.
- **Unknown sections** — anything that is not a known section falls back to the
  full season article.
- **Deep links / cold start** — Back falls through to the home screen when
  there is no history.
- **Android hardware back** — inside the reader it walks back through Wikipedia
  first, then closes the reader.
- **Storage failures** — every read returns a default and every write is
  best-effort, so a corrupt or unavailable store degrades to a first run.

## Design system

Direction: a motorsport press archive. Near-black or warm paper, one signal red
used as a positional marker, hairline rules, oversized numerals, monospaced
technical metadata.

- **Type** — Archivo for everything read, JetBrains Mono for metadata only.
  Both are bundled, so loading needs no network; if it fails anyway the app
  renders in the platform's own faces rather than crashing on a missing family.
- **Colour** — `src/theme/tokens.ts`. Two palettes designed separately, not
  inverted: dark is a night pit lane, light is a printed archive.
- **Motion** — one personality throughout: premium, decisive, no overshoot.
  Three durations (130 / 260 / 380ms), one signature curve, a single entrance
  pattern (rise 14px + fade, staggered 45ms, total budget under 400ms). Presses
  answer within a frame and settle a little more slowly than they sink. Theme
  changes cross-dissolve through the previous background, so text never sits on
  the wrong ground mid-transition. All of it is skipped when the system asks for
  reduced motion.

## Architecture

```
src/
  app/            expo-router routes
  components/     Screen, AppHeader, ActionCard, SeasonRow, StateView, reader…
  domain/         seasons.ts, wikipedia.ts, recents.ts   (pure, no React)
  state/          ArchiveProvider, useSectionAnchor
  storage/        AsyncStorage wrappers
  theme/          tokens, typography, motion, ThemeProvider
tests/            node:test suites over the domain and the injected script
```

`src/domain` holds the model — seasons, sections, addresses — with no React and
no storage imports, which is why it is directly testable and why native
standings can later replace Wikipedia as the source without the screens
changing shape.

## Platform notes

The embedded reader uses `react-native-webview`, which is iOS and Android only.
The web build (used here for automated UI testing) substitutes a panel that
opens the same URL, at the same section, in a new tab.

## Attribution

Season data comes from Wikipedia and is available under
[CC BY-SA](https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License).
Apex is not affiliated with Formula 1 or the FIA.
