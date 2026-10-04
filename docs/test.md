# Test Plan

How The Daily News is tested. Requirement IDs refer to [requirements.md](requirements.md); implementation details are in [plan.md](plan.md).

## 1. Goals

- Show that every requirement in the brief (FR-1 to FR-3, TG-1 to TG-4) and every added requirement (NFR-1 to NFR-6) works.
- Catch regressions in the data layer early. It turns three different APIs into one shape, so it is where most bugs would hide.
- Test the app the way users use it: through roles, labels and visible text, not implementation details.
- Never call the real APIs in automated tests. They need keys, have tight rate limits and return different news every day.

## 2. Test levels

| Level                   | What it covers                                                                           | Tools                                      | When                          |
| ----------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------- |
| Static checks           | Types, lint rules, React Hooks rules                                                     | `tsc -b` (strict), ESLint                  | Every change, and every build |
| Unit                    | Adapters, aggregator, text helpers, URL filter state, preferences store, selection logic | Vitest                                     | Every change                  |
| Component / integration | Pages and components rendered with routing, a query cache and a fake `NewsService`       | Vitest, jsdom, Testing Library, user-event | Every change                  |
| Manual browser checks   | Real APIs, layout, responsiveness, accessibility, failure handling                       | Chrome DevTools (or Playwright)            | Before each release           |
| Container checks        | Image build, nginx routing and caching, API proxies, keys kept out of the bundle         | Docker, `curl`                             | Before each release           |

## 3. Tools and setup

- **Runner:** Vitest 5 with the `jsdom` environment, configured in `vite.config.ts` (`test` section). CSS is not processed in tests.
- **Setup (`src/test/setup.ts`):** adds the jest-dom matchers, and after every test unmounts rendered components and clears `localStorage`, so tests stay independent.
- **Fixtures (`src/test/fixtures.ts`):**
  - `makeArticle(overrides)` builds a valid `Article`.
  - `fakeFetchJson(respond)` stands in for the HTTP helper: it records every requested URL and answers from a function. Adapters accept this helper as a parameter, so they're tested without touching the global `fetch`.
- **Render helper (`src/test/render.tsx`):** `renderWithProviders(element, { route, service })` renders inside:
  - an in-memory router at the given URL (its `router.state` lets tests check the URL),
  - a fresh query cache with retries turned off,
  - a fake `NewsService` from `fakeNewsService(page)`, whose `fetchPage` is a `vi.fn()` spy.

## 4. Running the checks

```sh
npm test              # all unit and component tests, once
npm run test:watch    # re-run on change
npm run typecheck     # TypeScript (strict)
npm run lint          # ESLint
npm run build         # type-check + production build
```

## 5. Automated tests

There are **48 tests in 12 files**, all passing.

### 5.1 Data layer

| File                                       | Tests                                                                                                                                                                                                                                                                                                  | Requirements |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| `services/news/providers/guardian.test.ts` | Turns the shared query into Guardian parameters (keyword, dates, categories joined with `\|`, page, order); leaves out unset filters; maps results correctly (contributors as authors, trail text without HTML, 1000px image).                                                                         | FR-1, TG-2   |
| `services/news/providers/nyt.test.ts`      | Turns the shared query into Article Search parameters (`fq` section filter, `YYYYMMDD` dates, page starting at 0); maps documents and splits "By A and B" bylines; stops paging after the last hit; handles an empty (`null`) result list.                                                             | FR-1, TG-2   |
| `services/news/providers/newsapi.test.ts`  | Uses `/everything` for keyword-only searches; sends one `/top-headlines` request per category and labels each story with it; applies the date range itself on `/top-headlines`; trims " - Publisher" from titles (including name variations) and drops removed stories; stops at the 100-result limit. | FR-1, TG-2   |
| `services/news/aggregator.test.ts`         | Merges and sorts results and keeps one copy of a duplicate; only calls the requested sources; reports a failing source while still returning the others; rejects with every source's error when all fail.                                                                                              | FR-1, NFR-2  |
| `services/news/normalize.test.ts`          | Splits bylines (drops URLs, empty and duplicate names); matches author names ignoring case and accents; strips HTML; treats both ends of a date range as inclusive; dedupes different forms of the same URL; sorts newest first across timestamp formats.                                              | FR-1, FR-2   |

### 5.2 State and logic

| File                                            | Tests                                                                                                                                                                                                                                                          | Requirements |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `features/search/searchFilters.test.ts`         | Writes every filter to the URL and reads it back unchanged; ignores invalid hand-edited values; treats all three sources as "no source filter"; writes nothing when no filters are set; turns the single category into a category list; counts active filters. | FR-1         |
| `features/preferences/preferencesStore.test.ts` | Follows an author once, ignoring case and whitespace, and unfollows them; toggles categories freely; never lets the last source be unticked; saves to `localStorage` under `daily-news:preferences`.                                                           | FR-2         |
| `features/feed/followedAuthors.test.ts`         | Spots a followed author among co-authors, ignoring case and accents; moves their stories to the top while keeping each group's order.                                                                                                                          | FR-2         |
| `utils/selection.test.ts`                       | Unticking one item from "all" leaves the rest selected; ticking everything goes back to "all"; the last item can't be unticked; an empty selection means "all".                                                                                                | FR-1, FR-2   |

### 5.3 Components and pages

| File                                       | Tests                                                                                                                                                                                                                                                                                             | Requirements       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `components/articles/ArticleCard.test.tsx` | The headline links to the original story in a new tab (`rel="noopener noreferrer"`) and shows the publisher; following and unfollowing from the byline updates `aria-pressed` and the store.                                                                                                      | FR-2, NFR-4        |
| `features/search/SearchPage.test.tsx`      | Searches every source for the keyword in the URL; choosing a category updates the URL and the request, and shows a removable chip; unticking a source narrows the request; a partial failure shows the warning alongside the stories; a total failure shows the error and a **Try again** button. | FR-1, NFR-2, NFR-4 |
| `features/feed/FeedPage.test.tsx`          | Requests stories using the saved sources and categories, and describes them in the summary line; stories by followed authors lead the page; "Only authors I follow" hides the rest.                                                                                                               | FR-2               |

Component tests find elements by role and accessible name, as a screen reader would. This also checks the accessibility wiring (NFR-4).

## 6. Manual browser checks

Run `npm run dev` with valid keys in `.env`. Check at **1440px** (desktop), **768px** (tablet) and **390px** (phone).

| ID   | Check                      | Steps                                                                                                      | Expected result                                                                                                                                                 |
| ---- | -------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-01 | Front page                 | Open `/`                                                                                                   | Masthead, nav between double rules, a lead story beside two secondary stories, then the ruled column grid. White background.                                    |
| M-02 | Opening a story            | Click any card                                                                                             | The original article opens on the publisher's site in a new tab.                                                                                                |
| M-03 | Search from another page   | On `/`, type a keyword in the header and press Enter                                                       | Goes to `/search?q=<keyword>` with results from all sources.                                                                                                    |
| M-04 | Search as you type         | On `/search`, type a word quickly; watch the Network tab                                                   | Results update about 500ms after you stop typing, with one request per source rather than one per keystroke.                                                    |
| M-05 | Date filter                | Try each preset, then pick custom From/To dates                                                            | URL gets `from` and `to`; results fall within the range; you can't pick an end date before the start date.                                                      |
| M-06 | Category filter            | Choose "Science"                                                                                           | URL has `category=science`; requests use `tag=science/science`, `section.name:("Science")` and `category=science`.                                              |
| M-07 | Source filter              | Untick NewsAPI, then try to untick the remaining two                                                       | URL has `sources=guardian,nyt`; NewsAPI isn't called; the last ticked box is disabled.                                                                          |
| M-08 | Active filter chips        | Remove one chip, then use "Clear all"                                                                      | Only that filter is removed; then every filter except the keyword is removed.                                                                                   |
| M-09 | Shareable URLs             | Apply filters, reload, copy the URL to a new tab, use back and forward                                     | The same search and filters come back each time, and the search box matches the URL.                                                                            |
| M-10 | Preferences shape feed     | In Preferences pick Technology and two sources, then open For You                                          | The summary reads "Technology from …", and stories match.                                                                                                       |
| M-11 | Follow from byline         | Click **+** next to an author's name                                                                       | It changes to **✓**; the author appears in Preferences; their stories lead For You.                                                                             |
| M-12 | Followed authors only      | Tick "Only authors I follow"                                                                               | Only their stories show, or the "Nothing from your authors yet" message.                                                                                        |
| M-13 | Preferences saved          | Reload; then use "Reset all"                                                                               | Choices survive the reload; reset clears sources, topics and authors.                                                                                           |
| M-14 | Phone layout               | 390px wide                                                                                                 | One column, no horizontal scrolling, date below the masthead, full-width search.                                                                                |
| M-15 | Filter drawer              | Under 1024px, tap "Filters (n)"                                                                            | Drawer slides in; Escape, ×, a click outside and "Show results" all close it; filters apply immediately.                                                        |
| M-16 | Tablet and desktop         | 768px, then 1024px or wider                                                                                | Two columns, then three with the sticky filter sidebar.                                                                                                         |
| M-17 | Failure handling           | In DevTools, block requests to `/api/nyt/*`; then block all `/api/*`; then unblock and click **Try again** | The "Wire trouble" notice names NYT and the other stories show; with all blocked, "Stop the presses!" appears; Try again recovers.                              |
| M-18 | Paging and caching         | Click **More stories** until the end; then revisit an earlier search within 5 minutes                      | Only sources with more results are asked for the next page; the `-30-` mark appears at the end; the earlier search shows instantly with no new requests.        |
| M-19 | Keyboard and screen reader | Tab through a page; use the skip link; open the drawer; follow an author with VoiceOver on                 | Logical tab order with a visible focus outline; focus stays inside the drawer; the follow button is announced as a toggle with its state.                       |
| M-20 | Images                     | Hover a card with a mouse; switch on "Reduce motion"; find a story whose image is broken                   | Photos are in full colour and zoom slightly on hover, inside their frame; no zoom with reduced motion; broken images are hidden and the card still looks right. |
| M-21 | Unknown route              | Open `/does-not-exist`                                                                                     | The "page not found" message with a link back to the front page.                                                                                                |

## 7. Container checks

Run after `docker compose up --build -d`:

| ID   | Check                    | Expected result                                                                               |
| ---- | ------------------------ | --------------------------------------------------------------------------------------------- |
| D-01 | Build and start          | The image builds (with type-checking) and `docker compose ps` shows the container as healthy. |
| D-02 | Page routes              | `/`, `/search`, `/preferences` and unknown paths all return `200` with the app.               |
| D-03 | Caching headers          | Files under `/assets/` return `Cache-Control: public, max-age=31536000, immutable`.           |
| D-04 | API proxies              | `/api/guardian/…`, `/api/nyt/…` and `/api/newsapi/…` return data through the container.       |
| D-05 | Keys stay out of the app | None of the key values in `.env` appear in the JavaScript bundle.                             |

```sh
for p in / /search /preferences /nope; do curl -s -o /dev/null -w "$p %{http_code}\n" http://localhost:8080$p; done
asset=$(curl -s http://localhost:8080/ | grep -o '/assets/index-[^"]*\.js' | head -1)
curl -sI "http://localhost:8080$asset" | grep -i cache-control
curl -s "http://localhost:8080/api/guardian/search?q=climate&page-size=1" | head -c 120; echo
curl -s "http://localhost:8080/api/nyt/articlesearch.json?q=climate"     | head -c 120; echo
curl -s "http://localhost:8080/api/newsapi/top-headlines?country=us&pageSize=1" | head -c 120; echo
curl -s "http://localhost:8080$asset" | grep -c -F -f <(sed -n 's/^[A-Z_]*=//p' .env | grep .) # expect 0
```

## 8. Release checklist

A release is ready when:

1. `npm run typecheck`, `npm run lint` and `npm test` all pass.
2. `npm run build` succeeds.
3. Manual checks M-01 to M-21 pass on desktop and phone widths.
4. Container checks D-01 to D-05 pass.
