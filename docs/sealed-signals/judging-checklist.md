# Judging checklist

Lane C. Every jury dimension and every MoSCoW row from the organisers' `evaluation-criteria.md` (on `main`), mapped to the exact place we show it. "Where" names a screen from master prompt section 8, a file, or a sentence for the pitch. Status: **covered**, **partial** (works but a gap is named), **gap** (task in `proposals.md`).

Checked against: master prompt v2 and the fixtures in this branch. Lane A and B have not built yet, so "where" describes the design. Re-run this check at the Sat 20:00 merge.

## 1. Jury dimensions

| Dimension | What the jury looks for | Where we show it | Status |
|---|---|---|---|
| Problem understanding | Does the team grasp ACAPS's challenge? | Slide 1: "Medium-rated risks materialised 47 % of the time [data: 27 of 58]." Slide 2: the mentor's words (no platform, 32 analysts update weekly by hand, "we will get things wrong ... the point is honesty about it"). Pitch line: "the problem is not one more survey, it is that nobody can see who was right." | covered |
| Expert experience | Would a busy expert use it? | `/e/:token`: one card, 60 s countdown, no login, mask picker, Seal button. Closing line on the card: "Sealed. You'll hear how it resolves." Private calibration report at `/me/{token}/calibration`. | partial: retention beyond the private report is thin (P1) |
| Anonymity and trust | Is the model thoughtful and robust? | Mask per answer (known / pseudonym / anonymous) echoed on the card. Aggregates need n >= 5 (regions n >= 3). Sealed commitments and Verify on `/ledger`. Committee gateway with two-admin approval. Bias flags moderator-only. HMAC credential by default; Semaphore group only if `FF_ZK` is on. | covered; say which path ran (P6) |
| Feasibility | Could it be piloted with real experts? | Email magic link (no app). Runs on ACAPS API with CSV fallback. `make demo` offline in under 60 s. Slide 8: December pilot plan with named measures (impact.md 3.6). | partial: resolution criterion for a forecast question is vague (P2) |
| Data use | Does it use the Risk Radar data? | Proof chart on 104 resolved risks. 84 % / 47 % rates [data]. R1043 is the demo risk. Trigger text parsed into the doorbell. Live Risk List through the ACAPS API on `/desk` Radar view. | covered once Lane A's proof lands (Sat 20:00) |
| Innovation | Something new in consultation or forecasting? | Sealed answers opened together; surprisingly-popular highlight on the distribution chart; blind-first round; honesty box on every public entry. One-line claim: "A Delphi round with a receipt." | covered |
| Presentation | Is the 3-minute pitch clear? | `demo-script.md` (timed), `pitch.md`, `slides/` (8 slides). Rehearsal Sat 16:00. | covered once rehearsed |

## 2. MoSCoW rows

### Must have

| Row | Where we show it | Status |
|---|---|---|
| Easy to use; a community experts want to come back to | `/e/:token` card (phone first, 375 px, one minute, no login). Return reasons: private calibration report; "how it resolved" message; group view in round 2; track record. | partial: "community" is thin (P1) |
| Expert-controlled anonymity | Mask picker on the card: badge (known), nickname (pseudonym), ghost (anonymous). The chosen mask is echoed back after sealing. Contract: `Answer.mask`. | covered |
| Public anonymity | `/ledger` shows group probability and honesty box only. No names, no flags. `n < 5` is never returned. Pseudonyms appear only on the desk board. | covered |

### Should have

| Row | Where we show it | Status |
|---|---|---|
| Sustained engagement while respecting time | At most one pulse per expert per 7 days; heartbeat every 28 days; pulses expire; calibration report after each resolution. Pilot measure: share of approved experts still answering in week 8 (impact.md 3.6). | partial: no re-engagement path for a lapsed expert (P1) |
| Short, focused contributions | Single card, 60-second countdown, one text line of 240 characters. | covered |
| Small trusted groups (5 to 10) | Panel = best 8 matched by tags, k_min 5, caps of 3 per affiliation. Committee approval is the gate. | covered |

### Should not

| Row | Where we show it | Status |
|---|---|---|
| Engagement metrics as the goal | We store and show none: no time-in-app, no streaks, no counts of visits. Sentence for the pitch: "We show calibration and outcomes, never time in the app." Scoreboard ranks accuracy, not activity. | covered |
| AI chatbot feel | No chat anywhere. AI runs analyst-side only (investigator, skeptic, judge). The expert sees a card from a colleague. | covered |

### Could have

| Row | Where we show it | Status |
|---|---|---|
| Super estimator scoreboard | `/desk` super-estimator board from `GET /analyst/board`: pseudonym, n, mean Brier, weight. Uses pseudonyms only. | covered |
| Agreement and disagreement, including by geography | `/desk` distribution chart with ACAPS reference line and panel dots; Chad map with agreement by region. Regions with n < 3 are merged. | covered; check the map shows merged regions (P5) |
| Mobile and low-bandwidth | Card is phone first. Channel field includes sms in the contract. | partial: no payload budget stated; no SMS route (P3) |
| Multilingual (French and others) | French strings isolated in a locale file; English ships. | gap: French card text not built (P4) |

### Can have

| Row | Where we show it | Status |
|---|---|---|
| AI behind the scenes | Investigator, skeptic, judge on `/desk` draft card; verdicts and judge scores stored in the ledger; deterministic fallback with no model. | covered |

## 3. Brief checks outside MoSCoW

| Item | Where | Status |
|---|---|---|
| No real expert data | Footer line on every screen: "Synthetic experts." README table of synthetic vs live. | covered |
| Loop with outcomes shared publicly | `/ledger`: outcome, Verify, honesty box; "six months later" step in demo | covered |
| Turn risks into resolvable forecast questions | `Pulse.question`, horizon 6 months | partial (P2) |
| Show where experts agree and disagree | dissent index, distribution chart | covered |
| Pilot readiness in December | Slide 8; pilot measures in impact.md | covered |
| Four personas (Jose, Emily, Pierre, Aisha) | impact.md part 1; Slide 7 names each in one line | covered |
| SDGs 1, 2, 3, 10, 16, 17 | README, one line | partial: not yet written (README task) |

## 4. Sentences to say on stage (one per dimension)

1. Problem: "Medium-rated ACAPS risks happened 47 % of the time. A donor cannot act on a coin flip."
2. Expert: "A minute, a phone, no login, and you choose how much ACAPS knows about you."
3. Trust: "Answers are sealed, opened together, and anyone can verify the seal. No aggregate under five voices."
4. Feasibility: "It runs on the ACAPS API today. The December pilot needs a committee and eight experts."
5. Data: "We tested the method on all 104 resolved risks."
6. Innovation: "A Delphi round with a receipt."
7. Honesty: "Every ledger entry says what fed into it, and our misses stay on the page."
