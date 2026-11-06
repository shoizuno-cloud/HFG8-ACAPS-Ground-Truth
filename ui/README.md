# Sealed Signals UI · Lane B

This checkout implements the v2 frontend against the contracts at `docs/sealed-signals/MASTER_PROMPT.md`, upstream commit `0b30156`. All implementation changes stay in `ui/`. The previous checkout is preserved beside this one.

## Run

From this directory:

```powershell
npm ci
npm run dev:mock
```

Open http://localhost:5173/ for the fixture demo. Nothing in mock mode publishes remotely, seals cryptographically or issues real credentials.

For the backend connection, run `npm run dev:live` and open http://localhost:5175/. This mode never falls back to client fixtures. The default `/api` path is proxied by Vite to `http://127.0.0.1:18000`, including SSE. You may override `VITE_API_URL` for a different engine; direct browser connections require matching backend CORS. Production hosting must forward `/api` to the engine, or set the API base when building. ACAPS API tokens stay on the backend.

`npm run build` always builds API mode, overriding local mock settings. `npm run build:demo` produces an explicitly mocked offline UI build. The bundled Inter fonts and country geometry require no external map or font service. The Radar/map and QR screen load separately from the expert card.

## Routes and review flow

- `/` or `/radar`: risk table, country map, search and filters, ACAPS API/CSV provenance.
- `/e/demo`: blind-first expert fixture. `/e/round2` shows ACAPS and the group. `/e/empty` shows a recoverable invitation error. API mode requires a backend-issued token.
- `/desk`: panel matching, envelope tray, reveal, distribution, sourced themes, moderator-only integrity evidence, cited draft checks and accept/edit/reject. Mock mode uses a manual eight-answer replay. API mode sends real requests and listens to SSE.
- `/ledger`: public aggregate views with honesty boxes, confirmed contribution counts, resolved history, hashes and verification. No pseudonyms or person-level integrity flags.
- `/apply`: synthetic expert tags and preferred invitation channel. Email magic links are primary; WhatsApp and SMS are options in the contract.
- `/committee`: open an application ID and record committee approval. Mock mode uses two distinct synthetic admin choices; API mode never assumes approval counts or invents credentials.
- `/stage`: QR invitation with LAN/HTTPS URL validation, enlarged display and copy control. Each live expert needs their own backend-issued invitation. No credential is minted by this page.
- `/me/:token/calibration`: private Brier score and reliability report, with overconfidence when supplied. The fixture is historical and explicitly not linked to your new mock answer.

Mock demo: load synthetic answers → reveal → prepare draft → enter decision note → accept/edit → ledger. Reset demo clears the tab's saved decision. Rejection adds nothing to the current round's ledger; eligible resolved history remains visible.

## Checks

```powershell
npx playwright install chromium
npm test
npm run test:live
npm run test:scaffold
npm run build
```

Mock UI tests run on port 5174. API-mode contract tests run on 5176 and intercept HTTP/SSE responses; they are not a complete live-backend integration test. Both cover 375px phone, 1440px desktop and 1920px projector widths. Accessibility checks use axe. Screenshots are written to `test-results/` and `test-results-live/`.

The optional scaffold smoke suite requires the existing team API running on port 18000. It starts a frontend on 5177 and uses the real `/api` proxy, with no intercepted responses. It checks Radar, panel matching, the blind card, synthetic submission, private calibration, ledger honesty and clear errors for unimplemented pulse lookup and approval. Screenshots go to `test-results-scaffold/`. The backend remains a fixture scaffold; these checks do not establish a working production seal, scoring engine or admin gateway.

The optional private contribution story was removed at the user's request. The sealed-answer receipt now links directly to private calibration; there is no contribution route, animation bundle or public impact counter.

The expert timer is a gentle guide and never discards the answer. Failed requests retain in-memory form values; invitation tokens and expert answers are not written to browser storage. Only mock analyst decisions use session storage. Public views require five contributions; regional means require three. Round one hides ratings and rating-bearing questions even if an older API supplies them.

## Handoff

The ACAPS-connected discovery extension adds `/countries`, `/countries/:ISO`, `/analysis`, `/topics` and `/search?q=…`. Shared navigation keeps Radar as the entry point and groups analyst/committee/jury actions under Workspace. Country pages join loaded risks to the analyst desk; analysis supports keyword, country, theme, publication-date and sort filters. Global search covers country profiles, connected risks, selected reports and resources.

Official country/report/topic links were checked on 6 November 2026. The seven-profile, four-report catalogue is a dated editorial snapshot, not a complete archive or live feed. Additional countries come from the connected risk service. Full country coverage, current publications, datasets, downloads, API access and newsletter subscriptions open ACAPS's official services. No publications endpoint, API credentials, severity scores or subscription backend were invented. Update `src/acaps-catalog.ts` to refresh selected metadata; a live catalogue needs a backend feed agreed with Lane A.

See `V2_HANDOFF.md` for the v1-to-v2 comparison, fixture inconsistencies and backend dependencies. In particular, the skeleton has no expert approval, pulse lookup, SSE or resolution implementation yet. The v2 draft contains an uncorroborated claim; API approval is blocked until the backend removes or corroborates it. The integrity and matching fixtures also disagree about thematic coverage.

Fixture verification is a labelled fixture match, not a blockchain transaction. API verification displays only the engine's verdict and supplied timestamp anchor. Full calibration curves, live detector behavior, cryptographic sealing and scoring belong to Lane A. French copy is isolated as a locale starter; English ships first.

Before the merge: connect the completed engine, run the full R1043 loop and team checks, attach screenshots, test two real phones over venue Wi-Fi, and check the actual projector and jury QR scan distance. No frontend contract test substitutes for those physical checks.
