# Sealed Signals — master prompt v2 (team of 3)

> **v2, Fri 6 Nov evening — what changed after the ACAPS mentor interview.** If your agent already started on v1, read
> section 0a first, then re-read sections 4, 5 and 6: contracts and routes gained fields and endpoints; nothing was removed.
> 1. We build **the Risk Radar platform ACAPS does not have**, on their live API (CSV fallback), and put the expert loop on top.
> 2. Experts are vetted professionals (analysts, journalists, researchers) with **geographic + thematic tags**; pulses route
>    to the best-matched 8, not a fixed country list. Sign-up → ACAPS committee approval → credential.
> 3. New **bias and integrity layer** (section 6a): blind-first round, accuracy prompt, calibration/overconfidence, herding,
>    collusion, recency, coverage gaps, rumour propagation and corroboration. Flags are moderator-only.
> 4. New **public honesty box** on every ledger entry: what fed into this, confidence, gaps, hit rate, misses included.
> 5. The app is **one validation layer among others**: nothing changes an ACAPS product automatically (unchanged, now explicit).
> 6. Email magic link is the primary channel; WhatsApp second.

Hackathon for Good #8 · ACAPS "Ground Truth" challenge · The Hague, 6–8 Nov 2026
**Submission: Sunday 8 Nov, 12:00 CET.** Track pitches 13:00, final 15:10.

Paste this file as the first message to your coding agent (Claude Code / Cursor) inside this repo, followed by one line:
`I am on Lane A` (backend), `Lane B` (frontend) or `Lane C` (research & pitch). Everything the agent needs is here.
These branches hold only our scaffold plus the ACAPS data; the organisers' original files live on `main` of this fork.

---

## 0. The idea in one paragraph (keep this text identical in README, slides and UI)

Sealed Signals is the Risk Radar platform ACAPS does not have: the live Risk List from the ACAPS API, with an expert loop,
a bias and integrity layer and a public audit trail built on top. It lets ACAPS ask a small, trusted panel of vetted experts
(5–10, matched by geographic and thematic tags) to challenge and forecast its risk analyses in one minute, behind a mask
each expert chooses. A daily "doorbell" watches open indicators mapped to the
risk's own triggers and fires a pulse when something shifts (or when an analyst, or two experts, ask). Answers are sealed,
opened together, aggregated with the surprisingly-popular method and reliability weights, turned into a cited draft update
the analyst accepts or rejects, and published as a group view on a public ledger. When the risk resolves, every forecast is
Brier-scored, weights update, and experts get a private calibration report. Nothing identifying ever leaves the expert's
device; nothing publishes itself.

Tagline: **The machine rings the doorbell, the panel answers, the analyst decides, the ledger remembers.**
Demo risk: **R1043**, escalating cross-border insecurity in eastern Chad (Sudan war). Numbers from the data: 139 risks,
57 countries, 104 resolved; High risks materialised 84 %, Medium only 47 %.

## 0a. What the ACAPS mentor told us (Fri 6 Nov) — design facts, quote them in the pitch

- Experts are **not sources on the ground**; they are well-informed professionals who already track crises: think-tank
  analysts, journalists, researchers, early-warning practitioners. Expertise is geographic **and thematic** (an earthquake
  expert outside Venezuela is still the right person for a Venezuela quake). Experts tag themselves at sign-up.
- **Gateway**: experts apply, ACAPS approves on credentials and track of work; "a trust system that builds over time";
  a committee of several ACAPS admins (global team; the Risk Radar manager sits in France).
- **His open question, which we answer**: a panel could lean one way or be packed to steer funding. The app must be one
  validation layer among others; products never change automatically; ACAPS must minimise bias and state limitations and
  what fed into each product. "We will get things wrong, like a prediction market; the point is honesty about it."
- **No platform exists**: the old app died with the US funding cuts; Risk Radar is a dataset on the website plus an API that
  most heavy users pull into their own systems. He said the Risk Radar "should have a platform" and that we may build one
  on the API to showcase the loop. API docs are in the shared pack (token auth, free account).
- **Today's process**: 32 analysts track their countries' parameters daily, score risks manually with simple thresholds,
  update weekly. "Not very automated, lots of space to improve."

## 1. Hard rules (from the ACAPS brief; a jury will check)

1. **No real expert data.** Synthetic experts and answers only (`data/synthetic/`).
2. **Expert-controlled anonymity** per answer: `known` (to ACAPS) · `pseudonym` (to peers) · `anonymous`. Public output is
   aggregate only; never return an aggregate with fewer than **5** contributions.
3. **One minute, one card, no login** (magic link). Minutes, not sessions.
4. **No chatbot feel, no engagement metrics.** AI is analyst-side only. We show calibration and outcomes, never time-in-app.
5. **Nothing publishes itself.** Rating updates reach the ledger only through the analyst's accept / edit / reject.
6. **Use the Risk Radar data** (`data/risk-radar-export.csv`) for scoring, the proof simulation and the demo.
7. Deliverables: working prototype, 3-minute pitch, repo link + short description (README).
8. **One validation layer among others.** The platform proposes; an ACAPS analyst decides; the committee administers.
   Bias flags are moderator-only. Public pages show aggregates, caveats and track record, never flags about a person.

## 2. Branches and merging

- `main` = always runnable. Nobody commits to `main` directly.
- Lanes: `lane/backend`, `lane/frontend`, `lane/research`. Rebase on `main` before every push.
- **Merge checkpoints** (whoever is free merges, the others review in 5 minutes): Sat 13:00 · Sat 20:00 · Sun 10:30 (freeze).
- A merge must keep `make check` green (section 9). Unfinished work stays behind a flag or a stub, never breaks `main`.
- Contracts (section 4) and routes (section 5) change only by announcing in the team chat and editing this file in the same commit.
- Commits: plain messages, the human's own git identity, no AI co-author lines.

## 3. Repository layout

```
README.md                         what we built, how it works, why (Lane C writes narrative, Lane A the run instructions)
docs/sealed-signals/
  MASTER_PROMPT.md                this file
  contracts.md                    section 4 + 5 in detail, kept in sync
  demo-script.md                  3-minute script (Lane C)
  impact.md                       stakeholders, before/after, impact chain (Lane C)
  judging-checklist.md            every jury dimension → where we show it (Lane C)
fixtures/                         JSON examples of every API response — Lane B builds against these first
engine/                           Python 3.12 · FastAPI · SQLite (Lane A)
  engine/{settings,models,db,anonymity,seal,aggregate,scoring,analyst,api}.py
  engine/agents/{investigator,skeptic,judge,loop}.py   analyst-side verification loop (section 6), model-optional
  engine/doorbell/{connectors.py,trigger_map.py,detect.py,run_daily.py}
  engine/radar.py                 ACAPS API client (live Risk List, token from env) with CSV fallback; same Risk model either way
  engine/experts.py               sign-up, tags, committee approval, credential issue, panel matching by tags
  engine/integrity/{anchoring,calibration,herding,collusion,recency,coverage,rumour}.py   section 6a, moderator-only
  engine/sim/simulate_panels.py   backtest on the 104 resolved risks → reports/proof.json + proof.png
  tests/                          pytest, offline, < 5 s
ui/                               Lane B: Vite + React (or Lovable export committed here); .env: VITE_API_URL=http://127.0.0.1:18000
scripts/seed.py                   synthetic experts/panels/answers into the DB
scripts/demo_replay.py            replays stored indicator history for eastern Chad, fires the R1043 pulse
data/synthetic/                   experts.json, panels.json, answers.json, indicators_chad.csv (aggregated counts only)
reports/                          proof.png, proof.json
Makefile                          make dev / make check / make seed / make demo
```

## 4. Contracts (engine/models.py — everyone codes against these)

```
Mask = "known" | "pseudonym" | "anonymous"

Expert        id, pseudonym, geo_tags[] (ISO codes), theme_tags[] (conflict|displacement|flood|earthquake|epidemic|food|
              access|political|economic), affiliation_tag (org type, used only for composition caps), languages[],
              channel ("email"|"whatsapp"|"sms"), status ("applied"|"approved"|"paused"), approved_by[], synthetic=true
Panel         id, risk_id, expert_ids[] (best 8 by tag match), k_min=5, composition{max_per_affiliation:3, geo_spread, theme_cover}
Risk          risk_id, title, country_iso, country, probability_acaps (text: Very Low..Very High), impact_acaps (1-5),
              level ("Low"|"Medium"|"High"), status, triggers[{id,title,description}], horizon_months=6, sources[]
Pulse         id, risk_id, panel_id, fired_at, reason ("doorbell"|"analyst"|"experts"|"heartbeat"), round (1|2),
              evidence[{source, indicator, value, baseline, z, url}], question, expires_at, n_answers
Answer        id, pulse_id, mask, pseudonym|null, agree (bool|null in round 1: blind-first, ACAPS rating hidden),
              probability (0..1), confidence (1..5), panel_guess (0..1), missing (≤240 chars),
              source_tag ("saw"|"read"|"heard"|null), changed_mind (bool, round 2 only), sealed_at, revealed_at|null
Seal          answer_id, commitment (sha256), sealed_at, anchor|null
RoundResult   pulse_id, n, plain_mean, weighted_probability, surprisingly_popular ("yes"|"no"), dissent_index (0..1),
              distribution[{bucket, count}], agreement_by_region[{region, n, mean}], missing_themes[{theme, count, origin ("many"|"single"),
              corroboration ("corroborated"|"single-source"|"uncorroborated"|"not checked")}], revealed_at,
              integrity{anchoring_shift, herding ("none"|"suspected"), collusion_pairs (int), recency ("none"|"suspected"),
              coverage_gaps[], used_round (1|2)}                       # moderator-only; stripped from public responses
DraftUpdate   id, risk_id, pulse_id, proposed_probability (text scale), proposed_level, rationale_md,
              claims[{claim_id, text, evidence_kind ("panel"|"indicator"|"source"), evidence_ref, numbers[]}],
              skeptic[{claim_id, verdict ("supported"|"not_supported"), checks[]}], missing_checks[{theme, status}],
              judge{coverage, numbers_match, overall, flagged_claim_ids[]}, repair_rounds,
              status ("draft"|"accepted"|"edited"|"rejected"), decided_by, decided_at, note
LedgerEntry   risk_id, pulse_id, sealed_at, group_probability, acaps_probability, acaps_level,
              outcome (null|"materialised"|"not_materialised"), resolved_at|null, verify_hash,
              honesty{n, agreement (0..1), confidence_band [lo, hi], coverage_gaps[], claims_corroborated (int),
              claims_total (int), panel_hit_rate (0..1|null), caveat (str)}        # public, on every entry
Score         pseudonym, risk_id, brier, resolved_at, weight_after
Calibration   pseudonym, n_resolved, mean_brier, reliability_weight, moved_before_acaps (int), overconfidence (−1..1),
              note   (private to the expert)
```

Every response carries `served_from: "live"` and `generated_at`. Every aggregate carries `n`; `n < 5` is never returned.

## 5. API (port 18000; CORS for http://localhost:5173)

```
GET  /health
GET  /radar/status                {source: "acaps-api"|"csv", fetched_at, n_risks}
GET  /risks                       active risks (live ACAPS API, CSV fallback) · GET /risks/{risk_id}
POST /experts/apply               {geo_tags, theme_tags, affiliation_tag, languages, channel} → {expert_id, status:"applied"}
POST /experts/{id}/approve        committee approval (needs 2 admins) → status approved, credential issued
GET  /panels/match?risk_id=       the 8 best-matched approved experts + composition check
GET  /integrity/{pulse_id}        moderator-only: the integrity block + per-check evidence
POST /pulses                      {risk_id, reason:"analyst", question?} → Pulse
POST /pulses/doorbell/run         run the detector once → {shifts[], pulses_fired[]}
GET  /pulses/{id}                 Pulse
GET  /e/{token}                   expert card payload: {pulse, risk, round, group_view_if_round2}
POST /e/{token}/answer            Answer → {sealed_at, commitment}
POST /pulses/{id}/reveal          → RoundResult (opens round 1, starts round 2)
GET  /pulses/{id}/result          RoundResult
POST /pulses/{id}/draft           → DraftUpdate
POST /drafts/{id}/decision        {action: accept|edit|reject, edited_probability?, note} → DraftUpdate (+ LedgerEntry on accept/edit)
GET  /ledger · GET /ledger/{risk_id} · POST /ledger/verify {verify_hash} → {valid, sealed_at, anchor}
POST /risks/{risk_id}/resolve     {outcome, resolved_at} → {scores_written, weights_updated}
GET  /me/{token}/calibration      Calibration (private)
GET  /analyst/board               {super_estimators[{pseudonym, n, mean_brier, weight}], divergence[{risk_id, panel, acaps}]}
GET  /sim/proof                   contents of reports/proof.json
GET  /events                      SSE: pulse_fired · answer_sealed · round_revealed · draft_decided · risk_resolved
```

Example payloads for every route are in `fixtures/` (Lane B starts from these; Lane A keeps them true).

## 6. Algorithms (Lane A)

- **Seal**: `commitment = sha256(canonical_json(answer) + salt)`, stored with `sealed_at` before anything else; plaintext
  encrypted at rest; values appear only in aggregates after reveal. `verify_hash` of a ledger entry = sha256 of the round's
  sorted commitments. Optional daily anchor (OpenTimestamps) behind `FF_ANCHOR`.
- **Masks**: `pseudonym = HMAC(server_key, expert_id)`. Anonymous answers carry no pseudonym and count in aggregates only.
  Membership proof: `FF_ZK=true` uses a Semaphore group per panel (JS SDK in the card); default `FF_ZK=false` uses an HMAC
  credential so the demo never blocks on circuits. Say on the slide which one is running.
- **Surprisingly popular**: compare the actual share of "yes" (will materialise within 6 months) with the mean of
  `panel_guess`; the answer whose actual share exceeds its predicted share is the SP answer.
- **Weighted aggregate**: `w = 1 / (0.1 + mean_brier)` (new expert = median weight); aggregate in log-odds; extremize ×1.3;
  back to probability. Map to ACAPS's scale: <0.2 Very Low · <0.4 Low · <0.6 Medium · <0.8 High · else Very High.
- **Scoring**: Brier = (p − outcome)². Calibration per pseudonym. `moved_before_acaps` = expert on the correct side of 0.5
  while ACAPS's rating was not.
- **k-anonymity**: any aggregate needs n ≥ 5; regional breakdowns need n ≥ 3 per region or are merged.
- **Doorbell**: parse the `Triggers` column; map each trigger to indicators by keyword table (conflict/attack/raid → acled;
  refugee/displace/influx → unhcr; escalation/tension/political → gdelt); shift if 7-day count ≥ 3× the 90-day baseline
  or z ≥ 2; max one pulse per expert per 7 days; heartbeat every 28 days. Connectors ship with cached fixtures so offline works.
- **Analyst-side verification loop** (`engine/agents/`, flag `FF_AGENTS`, default on with a deterministic fallback so it
  never blocks the demo). Same pattern as our FloodSense engine, model-optional, never expert-facing:
  1. **Investigator** drafts the rating update as claims. Each claim cites one of three evidence kinds: a panel aggregate
     (`n`, weighted probability, SP answer, a missing-theme count), a doorbell indicator (source, value, baseline, URL), or
     a source already in the risk's `Source` / `Rationale` fields. No other knowledge is allowed in a claim.
  2. **Skeptic** tries to break each claim with at most three checks: does the cited aggregate exist and have n >= 5; does
     the number in the claim equal the cited value (tolerance 2 %); is the cited URL present in the risk's sources or the
     pulse evidence. For each `missing` theme the panel raised, the Skeptic looks for corroboration in the ACAPS API /
     ReliefWeb (cached fixtures offline) and labels it `corroborated` / `uncorroborated` / `not checked`. Claims that fail are
     marked, never deleted.
  3. **Judge** scores the draft: citation coverage, numbers match, grounding (supported / partial / unsupported per claim),
     and an overall score; the draft carries the scores and the flagged claim ids.
  4. **Analyst (HITL)** sees the draft with its verdicts and decides accept / edit / reject. One repair round if the Judge
     flags a claim: the Investigator rewrites only the flagged claims to what their evidence shows.
  The expert never sees any of this; the ledger stores the Judge scores next to the decision so the audit trail is complete.
  Deterministic fallback when no model is configured: the Investigator composes claims from templates over the aggregates
  and evidence, the Skeptic and Judge run their checks exactly as above.

## 6a. Bias and integrity layer (Lane A builds, Lane B shows on the desk only, Lane C explains)

Expert-facing, the only two changes to the card:
- **Blind-first round.** Round 1 hides ACAPS's rating; the expert gives their own number first. Round 2 shows ACAPS and
  the anonymised group. The round-1 → round-2 shift is logged as `anchoring_shift` (Tversky & Kahneman, anchoring; Delphi
  practice of independent first rounds).
- **Accuracy prompt + source tag.** Above the "what are we missing" line: "Is this something you saw, read, or heard?"
  with a three-way tag (Pennycook & Rand: a single accuracy nudge measurably reduces the spread of false claims).

Moderator-facing detectors (desk only; never public, never shown to experts):
- **Calibration / overconfidence** per pseudonym: calibration curve, overconfidence index (Tetlock, Good Judgment
  Project). Feeds the weight and the expert's private report.
- **Herding**: round-2 answers converge toward the mean with no new reasons → `herding: suspected`; the aggregate then uses
  round 1 (`used_round`).
- **Collusion / independence**: pairwise agreement across pulses beyond what shared evidence explains → `collusion_pairs`;
  composition caps at panel build time (≤ 3 of 8 from one affiliation tag; geographic spread; theme cover).
- **Recency / availability**: panel probability moves with news volume (GDELT) while hard indicators (ACLED, UNHCR) are
  flat → `recency: suspected`.
- **Coverage gap**: panel tags vs the risk's triggers (a conflict risk with no conflict expert) → `coverage_gaps[]`; also
  goes public as a caveat in the honesty box.

Rumour pipeline for the free-text claims:
- **Propagation**: near-identical wording across experts or rounds counts once and is marked `origin: single`.
- **Corroboration** (the Skeptic, section 6): each claim checked against the ACAPS API, ReliefWeb and ACLED (cached fixtures
  offline) → `corroborated / single-source / uncorroborated`. Uncorroborated claims never enter the draft; they reach the
  analyst as "to verify" with the source tag.

Public honesty box on every ledger entry: n, agreement, confidence band, coverage gaps, claims corroborated / total, the
panel's past hit rate including misses, and a one-line caveat. This is the mentor's "state what fed into this".

Deterministic first, all of it; no model is needed for any detector. Tests: a seeded herded round, a seeded colluding
pair, a copied claim, a panel with a coverage gap each produce the expected flag.

## 7. Proof simulation (Lane A builds, Lane C uses on the slide)

On the 104 resolved risks: 8 synthetic experts per risk (3 good, 3 average, 2 noisy; signal = outcome + noise). Compare
Brier of plain mean · weighted+extremized · ACAPS rating mapped to probability (Very Low .1 · Low .3 · Medium .5 · High .7 ·
Very High .9), with bootstrap CIs, plus "share of risks where the weighted panel was on the right side earlier than ACAPS".
Output `reports/proof.json` and one bar chart `reports/proof.png`. The slide states the assumptions: a method test, not a
claim about real experts.

## 8. UI (Lane B) — three screens

1. **Expert card** `/e/:token` — phone first, looks like a message from a colleague: evidence line, risk title,
   "Still High?" toggle, probability slider with words, "What will the panel say?" slider, one text line (≤240), mask picker
   (badge / nickname / ghost), big **Seal** button, 60-s countdown, "Sealed. You'll hear how it resolves." Round 1 is
   blind: no ACAPS rating on the card. The "what are we missing" line carries the accuracy prompt and the saw/read/heard tag.
   Round 2 shows ACAPS's rating, the anonymised distribution and a "changed my mind" toggle. Primary channel: email magic
   link; the card also renders inside a WhatsApp link preview.
2. **Analyst desk** `/desk` — projector-friendly: live envelope tray (SSE), Reveal button, distribution chart (ACAPS line,
   panel dots, SP highlight), Chad map with agreement by region, digest with cited reasons, draft card with
   Accept / Edit / Reject, super-estimator board (pseudonyms), doorbell log with evidence, and an **integrity panel** per
   round: anchoring shift, herding, collusion pairs, recency, coverage gaps, each with its evidence (section 6a). Plus a
   **Radar** view: the live Risk List from the ACAPS API as a table and map with a "source: ACAPS API / CSV" badge, and a
   committee view for expert applications (approve needs two admins).
3. **Public ledger** `/ledger` — per risk: sealed-at, group probability, ACAPS rating, outcome, **Verify** (turns green),
   and the **honesty box** (n, agreement, confidence band, coverage gaps, corroborated claims, hit rate, caveat). No names
   anywhere, no flags about anyone.

White background, one accent colour, big type. Build against `fixtures/` first (a `VITE_MOCK=1` mode serving the fixtures),
switch to the live API at the Saturday 20:00 merge.

## 8a. UI / UX standard (Lane B, enforced at every merge)

Professional, minimal, modern. The jury should think "this already exists in production", not "a hackathon demo".

- **Palette**: white background, near-black text, one muted accent (deep teal or slate blue), one semantic colour each for
  good / warning / critical. No neon, no gradients as decoration, no glow, no blinking or pulsing elements, no animated
  backgrounds. Motion only to explain state (an envelope locking, a chart revealing), 150–250 ms, and off under
  `prefers-reduced-motion`.
- **No emoji anywhere**: not in UI, README, slides, commit messages or the demo. Icons are a single consistent line-icon
  set (Lucide), 1.5 px stroke, used sparingly.
- **Type**: one body face (Inter or IBM Plex Sans), one weight for headings; a fixed type scale; tabular numbers for
  probabilities and scores; running text ≤ 65 characters wide. No all-caps shouting, no decorative fonts.
- **Layout**: 8-px spacing grid, consistent card edges and padding, generous whitespace, left-aligned text; phone-first for
  the expert card (375 px), projector-first for the analyst desk (1920 px, 16:9), both without horizontal scroll.
- **Components**: shadcn/ui or plain Radix primitives; every interactive element looks interactive; visible focus states;
  real empty, loading and error states (never a blank screen); a Copy button where an export would be.
- **Content**: real risk titles, real numbers from the data, synthetic experts labelled as synthetic in a footer line. Short,
  plain labels; no marketing language inside the product.
- **Charts**: one scale, labelled axes, the ACAPS rating as a reference line, the panel as points, confidence shown as
  whiskers; chart text in the page's own type and colours.
- **Adaptable**: theme tokens in one file; the same components serve expert card, desk and ledger; works on phone, laptop
  and projector; French strings isolated in a locale file even if only English ships.
- Before each merge: screenshot the three screens at phone and desktop width and attach them to the PR.

## 8b. Integration standard (Lanes A and B, enforced at every merge)

- Every feature in section 0 is wired end to end and clickable in the demo: doorbell → pulse → card → seal → reveal →
  aggregate → draft → decision → ledger → resolve → calibration. Nothing is "shown in a slide but not in the product".
- No mocked data in the final build: `VITE_MOCK` is off from the Saturday 20:00 merge; fixtures remain only for tests.
- Each technology appears exactly where it does work, and the UI says so in one quiet line where relevant:
  sealing (commitment hash + time on the ledger), masks (the chosen mask echoed on the card), surprisingly-popular
  (highlighted on the distribution chart), reliability weights (super-estimator board), doorbell (evidence line on the
  pulse), verification loop (Skeptic verdicts and Judge scores shown on the draft card, flagged claims marked), HITL (the
  decision log on the draft), scoring (the calibration report). If a technology has no visible effect,
  it is cut, not described.
- Feature flags (`FF_ZK`, `FF_ANCHOR`, `LLM_BASE_URL`) default to the path that works offline; the README states which
  path the demo ran with. Never claim on stage a path that is off.
- `make demo` runs the complete loop on R1043 with the synthetic panel in under 60 seconds, from a clean clone, with no
  network. That is the smoke test before every rehearsal.

## 9. Definition of done (freeze Sunday 10:30)

- `make check` green: pytest offline, UI builds, fixtures validate against the models.
- `make seed && make dev` → full loop on R1043 with synthetic experts: doorbell → pulse → 8 sealed answers → reveal →
  draft → accept → ledger → resolve → scores → calibration.
- `reports/proof.png` on the slide with assumptions.
- README: paragraph from section 0, architecture diagram, run instructions, what is synthetic vs live, limits, team.
- Pitch rehearsed twice with the QR step (jury becomes the panel); fallback `make demo` pre-loads 8 synthetic answers.

## 10. Lanes

### Lane A — Backend (engine, data, proof)
Build sections 4–7 in `engine/`, `scripts/seed.py`, `scripts/demo_replay.py`, SSE. Order: models + db + seed → radar
(ACAPS API client with CSV fallback) → experts + tags + committee approval + panel matching → pulses + answer/seal (blind
round 1, source tag) → reveal + aggregate → integrity detectors (6a) → verification loop (investigator, skeptic incl.
corroboration, judge) → draft + decision + ledger with honesty box → resolve + scoring + calibration → doorbell with
fixtures → simulation + proof.png. Keep `fixtures/` true to real responses (regenerate them from the running API).
Milestones: API with seeded data Sat 10:00 · full loop Sat 18:00 · proof.png Sat 20:00 · polish Sun.

### Lane B — Frontend (three screens + demo stage)
Build section 8 in `ui/` against `fixtures/` from the first hour (`VITE_MOCK=1`), then the live API. The expert card is the
hero (blind round 1, accuracy prompt, source tag): test it on two real phones over the venue Wi-Fi by Saturday 18:00; QR flow
for the jury. Analyst desk on a projector with the integrity panel and the Radar view; public ledger with the honesty box.
Milestones: expert card mock Sat 12:00 · desk + ledger mock Sat 16:00 · live API Sat 20:00 · stage polish Sun.

### Lane C — Research, impact, pitch (no code; docs + slides)
1. **Stakeholders** (`docs/sealed-signals/impact.md`): ACAPS analysts, field experts (local NGO staff, researchers,
   anticipatory-action practitioners), ACAPS readers (UN agencies, INGOs, donors such as ECHO/FCDO/CERF, insurers), affected
   populations. For each: how the world works today → what changes with Sealed Signals → what they get out of it → how they
   want to give their view (channel, language, time) → what would make them stop. Use the four personas in the brief
   (Jose, Emily, Pierre, Aisha).
2. **Before / after**: how ACAPS produces and updates a risk today (six-step method, analyst judgement, informal expert calls);
   after: doorbell → panel → cited draft → analyst decision → ledger → score. One diagram.
3. **Impact chain**: better probability → earlier decision → anticipatory funds released (IFRC/WFP/CERF frameworks) → aid
   pre-positioned → lower cost and mortality. Cite FAO/WFP anticipatory-action evaluations; mark every number as cited or
   illustrative. Worked example on R1043 (over a million Sudanese refugees in eastern Chad since 2023).
4. **Interview Alex (ACAPS) today**: the question list in `docs/sealed-signals/questions-for-acaps.md`; write his answers
   verbatim into impact.md and quote him in the pitch.
5. **Judging checklist** (`judging-checklist.md`): each dimension (problem understanding, expert experience, anonymity &
   trust, feasibility, data use, innovation, presentation) and the MoSCoW rows → the exact screen, number or sentence
   where we show it. Anything uncovered becomes a task for Lane A/B.
6. **Deck + demo script** (`demo-script.md`): 3 minutes, QR step, fallback; slides: problem (47 %), the loop, the demo,
   the proof chart, impact chain, pilot plan for December, team. Pitch practice Saturday 16:00.
7. **README narrative** (section 0 + why + limits), and the one-paragraph submission description.
8. **More features**: a ranked list of what to add after the hackathon (voice-first on device, machine panel member,
   hardware notary, anticipatory triggers, French/Arabic), each with the stakeholder it serves.
9. **Bias and honesty narrative**: one slide that names each detector in section 6a with its research source (Tversky &
   Kahneman; Tetlock / Good Judgment Project; Prelec 2017; Pennycook & Rand), and the mentor's own words on honesty and
   "one validation layer among others". Verify every citation before it goes on a slide.
10. **Platform framing**: "the Risk Radar platform ACAPS does not have" — one before/after slide: website + API today,
    platform + loop + audit trail tomorrow; what the 32 analysts gain per week.

## 11. If you get stuck
Ask in the team chat with: what you tried, the error, what you need from the other lane. Never silently change a contract.
If a lane is blocked for more than 45 minutes, swap tasks at the next checkpoint.
