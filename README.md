# Sealed Signals

Sealed Signals lets ACAPS ask a small, trusted panel of humanitarian experts (5–10 per country) to challenge and forecast
its risk analyses in one minute, behind a mask each expert chooses. A daily doorbell watches open indicators mapped to the
risk's own triggers and fires a pulse when something shifts. Answers are sealed, opened together, aggregated with the
surprisingly-popular method and reliability weights, turned into a cited draft update the analyst accepts or rejects, and
published as a group view on a public ledger. When the risk resolves, every forecast is scored, weights update, and experts
get a private calibration report. Nothing identifying ever leaves the expert's device; nothing publishes itself.

> **One correction to that paragraph, and we would rather say it here than be caught on it.** "Nothing identifying ever
> leaves the expert's device" is not what this build does. Sealing proves *timing and consistency* and blocks *peer*
> anchoring; the server holds the plaintext. See [Who can learn what](#who-can-learn-what).

## Run

```bash
pip install -r engine/requirements.txt
make install                 # python deps and UI deps, from a clean clone
make demo                    # the whole loop on R1043, offline, in about 1.5 s
make dev                     # API on :18000, and the built UI at /app
make check                   # pytest, UI build, fixture validation
```

`make dev` then serves:

| Path | What it is |
|------|------------|
| `/app/desk` | analyst desk: envelope tray, reveal, distribution, draft, integrity notes, doorbell |
| `/app/ledger` | public ledger with the honesty box and a working Verify button |
| `/app/e/<token>` | the expert card; `/demo/links` lists the seeded links |
| `/docs` | the API, generated from the code |

The engine refuses to start without `COMMITMENT_SALT` and `PSEUDONYM_KEY`. That is deliberate: a sealing salt that
silently defaults is worse than one that is missing. `make dev` loads `engine/.env.example` for you; in production the
platform generates both and sets them before the first start.

## Architecture

```
ACAPS Risk Radar export (data/, 139 risks)
        |
        v
  doorbell  --------> pulse (the risk's own triggers + ACAPS completion rates)
                           |
                           v
                    expert card  /app/e/<token>      blind: no ACAPS band shown
                           |
                      seal: sha256(canonical_json(answer) + salt)
                           |
                     [ k_min = 5 ]  nothing is aggregated below five answers
                           v
                   reveal -> RoundResult     equal-weight mean is PRIMARY
                           |                 weighted mean is secondary, capped
                           |                 surprisingly-popular is labelled experimental
                           v
              deterministic draft + Skeptic + Judge     every claim cites its evidence
                           |
                    analyst decides  (accept / edit / reject, with a rationale)
                           v
                  public ledger + honesty box + verify_hash
                           |
                     resolve -> Brier scores -> weights -> private calibration
```

One FastAPI process serves the API at the root and the built single-page UI under `/app`. The API keeps the root
namespace because `/ledger` and `/e/{token}` are API routes in the contract, so they cannot also be HTML pages.

## Who can learn what

This replaces every "nothing leaves the device" claim.

| | Sees the answer before the reveal | Sees who wrote it |
|---|---|---|
| Other panel members | no | pseudonym only, and distinctive wording is still recognisable |
| The analyst | no | aggregates only, never an individual answer |
| Whoever operates this server | **yes** | yes, except for `anonymous` answers |
| The public ledger | aggregate only, and only at n ≥ 5 | never |

The commitment is `sha256(canonical_json(answer) + salt)` stored with `committed_at`. It proves when an answer was given
and that it has not changed since. It is not confidentiality from the operator. `anonymous` answers are stored with no
identity link at all, so they cannot be claimed or scored later — and the link's "used" flag records only *that* someone
answered, never which answer was theirs. Blind-signed credentials are the phase-2 path if anonymity from ACAPS itself is
required.

`n ≥ 5` is a disclosure rule, not an anonymity guarantee.

## What is real and what is not

**Real.** The 139 risks, their titles, probabilities, impacts, statuses and triggers all come from the committed ACAPS
Risk Radar export. So do the trigger completion rates the doorbell fires on — those are ACAPS's own published judgement,
not a signal we invented. The commitments, the aggregation, the Skeptic checks, the Judge scores, the verify hash and the
Brier scoring are all computed, not staged.

**Synthetic.** The eight experts and their answers come from `engine/seeding.py`. They are labelled synthetic in the API,
on every screen footer and in the ledger's own caveat. Their answers are not evidence about Chad or anywhere else.

**Assumed.** Probability is a five-band text field in the export. Scoring needs a number, so `data.PROBABILITY_BANDS`
maps each band to its midpoint. ACAPS publishes the bands, not these midpoints, and the mapping appears in the rationale
of every draft so nobody can mistake it for an ACAPS figure. Scoring is against Probability, never Risk Level — Risk
Level is derived from Probability × Impact, so scoring it would score our own arithmetic.

**Not built.** No live ACAPS API (no credential; `/radar/status` reports `source: csv` and the desk shows that badge).
No external timestamp anchor — Verify recomputes the hash from the round's commitments and says exactly that. The agent
loop behind `FF_AGENTS` is not wired: the draft generator is the deterministic template, which is the default the spec
asks for. The store is in process and rebuilt on restart; it is not a system of record.

## Limits worth saying out loud

- One round with a synthetic panel is a **sensitivity test, not proof** that the method works.
- There is no structured rating history in the export, so no "we moved earlier than ACAPS" claim is possible, and none
  is made.
- Integrity notes are **descriptions, not diagnoses**. Nothing in them penalises an expert or changes a weight; the
  analyst reads them and decides.
- Reliability weights start equal, shrink toward a prior and are capped. One round never makes a super-estimator, and
  the board stays empty until an expert has five resolved risks.
- A question contract must be frozen before a risk can be resolved, otherwise the score settles a question nobody agreed
  to. `/risks/{id}/resolve` returns 409 until it exists.

## Repository

```
engine/        FastAPI app, store, aggregation, deterministic draft, scripts, tests
  engine/      api.py  store.py  draft.py  data.py  seeding.py  settings.py  logging_conf.py
  scripts/     seed.py  demo_replay.py
  tests/       37 tests covering the disclosure floor, blinding, integrity, ledger and scoring
ui/            Vite + React + TypeScript: expert card, analyst desk, public ledger
data/          ACAPS Risk Radar export and its data dictionary
fixtures/      example payloads for every route, validated by make check
docs/          master prompt, contracts, question contract, privacy engineering
app.yaml       deployment contract
Dockerfile     node build of the UI, then one python process serving both on 8080
```

## Team

Zain Ul Haq (backend) · *name* (frontend) · *name* (research and pitch).
Challenge: ACAPS Ground Truth, Hackathon for Good #8.
Synthetic experts only. ACAPS Risk Radar data under ACAPS terms of use.
