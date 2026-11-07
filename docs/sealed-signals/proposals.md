# Proposals and open decisions (Lane C to the team)

Lane C does not edit `engine/`, `ui/` or `fixtures/`. Anything research suggests the product should change is here. Revised for master prompt v3; items v3 already fixed are listed at the bottom.

Priority: **M** = before the Sat 20:00 merge, **S** = before the Sun 10:30 freeze, **L** = after.

## Decisions for the humans

- **D1. Scoreboard.** The brief's Could row asks to "recognise consistently accurate experts". v3 says score forecasts, not people; committee-side only; never gate approval; calibration private and opt-in after 5 resolutions. Choose: (a) committee-only pseudonymous view, and say in Q&A that recognition is a pilot decision; (b) a pseudonymous panel-visible board after 5 resolutions. We recommend (a) for December.
- **D2. Proof slide.** v3 takes the synthetic results off the 3-minute headline (a sensitivity test, repo page and Q&A). Slide 5 in the deck is now a backup slide. The demo script spends that time on the ledger instead.
- **D3. Live minute in the pitch.** The jury exercise adds a countdown; the product has none. Decide whether the live step runs 60 seconds or is cut when 5 answers arrive.

## Proposals

### P1. Retention path (S) - Lane A + B
- Gap: "come back" and "sustained engagement". v3 added the outcome report. Still missing: a "lapsed" status on the committee view for an approved expert with no answer in 28 days, with a one-click re-invite. No streaks, no counts.

### P2. Question contract for R1043 (M) - the analyst, Lane A
- See "Lane C review" in `question-contract.md`. Four points: the event must say "new" incidents after the pulse date (the risk text says attacks already happened in 2026, so the question could resolve trivially); "significant deterioration" needs the export's own wording; resolution source is ACAPS itself (circular, disclose); partial materialisation rule.

### P3. Low-bandwidth budget and SMS stub (S) - Lane B, Lane A
- Page budget for the card (suggest under 100 kB, measured in `make check`). The `sms` channel has no route; flag it as a stub.

### P4. French card strings (S) - Lane B
- About 15 strings for the card and magic-link email. Arabic stays on the future list.

### P5. Merged regions note (S) - Lane B
- "Regions with fewer than 3 answers are combined."

### P6. Flags footer (M) - Lane A + B
- Footer on `/desk` and `/ledger`: "Draft: template. Agents: off. Anchor: off. Doorbell: phase 2 (replay)." We never claim a path that is off.

### P7. Demo panel must reach n of 5 or more (M) - Lane A
- If fewer than 5 jury answers are committed, the aggregate rule hides the result. Demo mode tops up with labelled synthetic answers. The desk shows live and synthetic answers apart.

### P8. Sensitivity test wording (M) - Lane A
- Label the output `sensitivity`, not `proof` (v3 section 7 already says so; the existing route is `/sim/proof` and the file `reports/proof.png`, which still say proof). Rename or caption it. Report the bootstrap as "resampling spread, not statistical confidence".

### P9. Hit rate for a new panel (S) - Lane A
- `panel_hit_rate` null shows "no resolved questions yet", not 0.

### P10. One "what fed into this" sentence (S) - Lane A + B
- Generated at the top of the honesty box from existing fields: "Based on 7 committed answers from a panel of 8, 2 of 3 claims corroborated, 1 in the verification queue."

### P11. Refugee figure (M) - team (resolved 7 Nov)
- Resolved. UNHCR registers 1,425,743 Sudanese refugees in Chad (data date 2026-11-02, https://data.unhcr.org/en/country/tcd). This is the national total and includes pre-2023 arrivals, so say "about 1.4 million Sudanese refugees registered in Chad (UNHCR, 2 Nov 2026)", not "in eastern Chad since 2023". `impact.md` 3.4 and `MASTER_PROMPT.md` (Lane C item 3) now use this figure. Not yet sourced: arrivals since April 2023 for Chad alone (UNHCR CORE document).

### P12. Six-step method (L) - team
- No numbered ACAPS list found. Ask Alex for the official steps. impact.md labels its six-step grouping as ours.

### P13. Contradictions inside master prompt v3 (M) - whoever owns the file
1. Section 6a still says suspected herding means "the aggregate then uses round 1 (`used_round`)". The v3 changelog says no automatic fallback. Which holds?
2. Section 4 says "Palley & Soll" for peer-prediction weighting. The records show Palley and Soll 2019 is "pivoting"; peer-prediction weighting is Palley and Satopaa 2023. See `bias-and-honesty.md` 3.5.
3. Section 8b still lists "sealing", "reliability weights (super-estimator board)", "surprisingly-popular highlighted" and a "calibration report" as wired features. Under v3 the weights are secondary, SP is a labelled experiment, and calibration is opt-in after 5 resolutions.
4. Lane C item 6 lists "the proof chart" among slides; section 7 says the test is off the headline.
5. Section 8b still names the flags `FF_ZK` and `FF_ANCHOR`. The privacy page treats zero-knowledge membership and timestamp anchoring as research directions that are not in the build. Remove them from 8b or mark them off.

### P14. Demo trigger (M) - Lane B
- The analyst sends the pulse from a button on `/desk` (v3). The demo script uses it. The phone then receives the magic link. Confirm the button works end to end and that the email link opens the card on the phone.

## Done by v3 (kept for the record)

Question contract (now exists); group outcome report route; no extremizing; stance options on the card; no countdown in the product; scoring committee-side; honesty box fields for decision use and rejected panel view; privacy-engineering page created.

## Added for v3.1 (Risk Alert Engine, trust-design.md)

### P15. Demo opens with Replay, not a live run on the current month (M) - Lane A + B
- We diffed the cached editions ourselves. Under our reading of the rules, March to April 2026 fires 9 of 123 crises (TCD005 first), and October to November 2026 fires 0 of 122. The master prompt says the demo "opens with the engine diffing the current month live". That would show an empty Alerts page. Use Replay April 2026 for the opening. Keep "Run engine" for Q&A: "in a quiet month it says nothing".

### P16. Wording of the headline fact (M) - everyone who speaks
- TCD005 index 6.1 to 6.9 is the largest **rise** of 123 crises. By absolute change it is second (PAK007 fell 0.9). The master prompt says "largest move" and "Rank by |delta|" in 6b, which would make TCD005 rank 2. Say "largest rise", and confirm Lane A ranks by signed rise or fixes the test ("TCD005 must be rank 1").

### P17. The alert is on TCD005, not on R1043 (M) - Lane A + B
- TCD005 is the displacement crisis; R1043 is cross-border insecurity. The link is a keyword match confirmed by the analyst. Add one line to the pulse evidence: "Alert measures: INFORM Severity for Displacement from Sudan to Chad. Linked to R1043 by analyst."

### P18. Component rule sign (S) - Lane A
- "A component delta of 1.0 or more": is that absolute or only rises? Under absolute, PAK007 (a fall) fires. A fall is not a risk alert. Decide and test.

### P19. Cached ACAPS data in a public repo (M) - team, ask ACAPS
- `data/acaps-api/` holds about 1 MB of ACAPS API responses ("ACAPS terms of use apply"). Forks of this repo are public. Ask Alex whether publishing the cache is allowed, or keep it out of the public submission and ship only the TCD005 slice needed for the replay. No API token is in the repo (checked with a text search).

### P20. Master prompt inconsistencies, second batch (M) - file owner
1. Section 0, which must stay identical in README, slides and UI, still says "or, in phase 2, an indicator doorbell". Under 6b the alert engine on ACAPS monthly editions is primary and external feeds are a later note. Update section 0 and the README together.
2. `trust-design.md` and section 6 still say "Palley & Soll (peer prediction)". See `bias-and-honesty.md` 3.5: Palley and Satopaa 2023 is the peer-prediction paper.
3. `trust-design.md` section 5 says answers are "sealed"; section 1a says commitments do not hide answers from the operator. Pick "committed" throughout.
4. `trust-design.md` says "Lane C verifies every citation above before it goes on a slide". Done in `bias-and-honesty.md`; the table row on the loud majority cites the wrong paper until fixed.
5. The v3.1 changelog calls the 6.1 to 6.9 jump "the largest move". See P16.
