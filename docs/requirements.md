# Requirements

This document lists the requirements for **The Daily News**. It contains:

- **Sections 1–3:** the requirements from the brief, the innoscripta _Frontend Developer_ case study.
- **Section 4:** requirements added while planning, to make the brief concrete.
- **Section 5:** what was decided to leave out.
- **Section 6:** a table linking each requirement to the code and tests that cover it.

## Goal

Build the user interface for a **news aggregator website** that pulls articles from several sources and displays them in a clean, easy-to-read format.

## 1. Functional requirements

### FR-1 Article search and filtering

> Users should be able to search for articles by keyword and filter the results by date, category, and source.

Acceptance criteria:

- A keyword search queries every selected source at the same time and shows the combined results.
- Results can be limited to a **date range**, using quick presets or exact from/to dates.
- Results can be limited to a **category**.
- Results can be limited to one or more **sources**.
- Keyword and filters can be combined, and each filter can be removed on its own or all at once.
- Search and filters are reflected in the URL, so a results page can be reloaded, bookmarked or shared, and the back button works.

### FR-2 Personalized news feed

> Users should be able to customize their news feed by selecting their preferred sources, categories, and authors.

Acceptance criteria:

- Users can choose their **preferred sources** and **preferred categories** (topics). The home feed shows only matching stories.
- Users can **follow authors**, either by name on the preferences page or directly from an article's byline.
- Stories by followed authors are given priority in the feed, and the feed can be narrowed to followed authors only.
- Preferences are saved automatically and survive a reload. They can be reset.

### FR-3 Mobile-responsive design

> The website should be optimized for viewing on mobile devices.

Acceptance criteria:

- Every page is usable from phone width (about 360px) up to large desktop screens, without horizontal scrolling.
- The layout adapts: one column on phones, more columns on wider screens.
- Filters stay reachable on small screens without crowding the results.
- Text stays readable and controls are comfortable to tap.

## 2. Data sources

The brief requires using **at least three** of the following sources.

| #   | Source listed in the brief | Assessment                                                   | Used |
| --- | -------------------------- | ------------------------------------------------------------ | ---- |
| 1   | NewsAPI                    | Same service as #7 (newsapi.org)                             | Yes  |
| 2   | OpenNews                   | Not an article API                                           | No   |
| 3   | NewsCred                   | Shut down, no public API                                     | No   |
| 4   | The Guardian               | Open Platform Content API, free developer key                | Yes  |
| 5   | New York Times             | Article Search API, free developer key                       | Yes  |
| 6   | BBC News                   | No public news API; BBC stories still appear through NewsAPI | No   |
| 7   | News API Org               | Free developer key, many publishers                          | Yes  |

**Selected sources:** The Guardian, The New York Times and News API Org.

## 3. Technical guidelines

| ID   | Guideline from the brief                                                                                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TG-1 | The deliverable is a front-end project built with **React.js and TypeScript**.                                                                                                      |
| TG-2 | Fetch articles from **at least three** of the listed data sources.                                                                                                                  |
| TG-3 | The application is **containerized with Docker**, with clear documentation on running it in a container.                                                                            |
| TG-4 | Follow software development best practices: **DRY**, **KISS** and **SOLID** (single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion). |

## 4. Requirements added during planning

These are not in the brief. They were added to make the brief concrete and to meet the quality bar it implies.

| ID    | Requirement                                                                                                                                                          | Reason                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-1 | **API keys never reach the browser.** Requests go through a same-origin proxy that adds the keys.                                                                    | Keys in a JavaScript bundle can be read by anyone. NewsAPI's free plan also rejects browser requests from any origin except localhost. |
| NFR-2 | **One failing source must not break the page.** The other sources still show, and the failure is reported to the user.                                               | Three independent, rate-limited APIs fail independently.                                                                               |
| NFR-3 | **Respect rate limits.** Cache responses, debounce typing and avoid duplicate requests.                                                                              | NYT allows 5 requests per minute; NewsAPI's free plan allows 100 per day.                                                              |
| NFR-4 | **Accessibility.** Semantic HTML, full keyboard use, labelled controls, announced result counts, and respect for the reduced-motion setting.                         | Part of "optimized" and "easy to read".                                                                                                |
| NFR-5 | **Automated tests** for the data layer and the main user flows.                                                                                                      | Makes the best-practice guideline (TG-4) checkable.                                                                                    |
| NFR-6 | **Clean, readable presentation** in a newspaper style: serif typography, ruled columns, a plain white background and full-colour photos with a subtle zoom on hover. | The brief asks for a "clean, easy-to-read format"                                                                                      |

## 5. Out of scope

| Item                                        | Decision                                                                                                                                                              |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reading complete articles inside the app    | Not built. Only The Guardian returns full article text; NYT returns a summary and NewsAPI a short snippet. Headlines open the original story on the publisher's site. |
| Dark mode                                   | Not needed later.                                                                                                                                                     |
| User accounts and syncing across devices    | Not built. Preferences are stored in the browser.                                                                                                                     |
| Copying full text from publishers' websites | Rejected: paywalls, publishers' terms of use, and it would need a backend service.                                                                                    |

## 6. Traceability

| Requirement | Implemented in                                                                            | Verified by                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| FR-1        | `src/features/search/*`, `src/services/news/providers/*`                                  | `SearchPage.test.tsx`, `searchFilters.test.ts`, the provider tests, and manual checks M-03 to M-09 in [test.md](test.md) |
| FR-2        | `src/features/feed/*`, `src/features/preferences/*`, `src/components/articles/Byline.tsx` | `FeedPage.test.tsx`, `preferencesStore.test.ts`, `followedAuthors.test.ts`, `ArticleCard.test.tsx`, M-10 to M-13         |
| FR-3        | Responsive layout in every component, `Drawer.tsx`, `FilterPanel.tsx`                     | M-14 to M-16                                                                                                             |
| TG-1        | The whole codebase (strict TypeScript)                                                    | `npm run typecheck`                                                                                                      |
| TG-2        | `src/services/news/providers/{guardian,nyt,newsapi}.ts`                                   | The provider tests                                                                                                       |
| TG-3        | `Dockerfile`, `docker-compose.yml`, `docker/*`, `README.md`                               | Container checks D-01 to D-05                                                                                            |
| TG-4        | See [plan.md § Design principles](plan.md#10-design-principles)                           | Code review, `npm run lint`                                                                                              |
| NFR-1       | `vite.config.ts`, `docker/nginx.conf.template`                                            | D-04 and D-05                                                                                                            |
| NFR-2       | `src/services/news/aggregator.ts`, `SourceNotice.tsx`                                     | `aggregator.test.ts`, `SearchPage.test.tsx`, M-17                                                                        |
| NFR-3       | `src/app/queryClient.ts`, `SearchBox.tsx`, `src/hooks/useArticles.ts`                     | M-04, M-18                                                                                                               |
| NFR-4       | Every component                                                                           | Component tests (they find elements by role and label), M-19                                                             |
| NFR-5       | `src/**/*.test.ts(x)`                                                                     | `npm test`                                                                                                               |
| NFR-6       | `src/index.css`, `src/components/*`                                                       | M-01, M-20                                                                                                               |
