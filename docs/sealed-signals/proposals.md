# Proposals to the product (Lane C to Lanes A and B)

Lane C does not edit `engine/`, `ui/` or `fixtures/`. Anything research suggests the product should change is written here. Each item: what, why, who, how big. Nothing here changes the contracts until announced in the team chat and the master prompt is edited in the same commit.

Priority: **M** = before the Sat 20:00 merge, **S** = before the Sun 10:30 freeze, **L** = after the hackathon (also in `future.md`).

## P1. Retention path and a "how it resolved" message (S) - Lane A + B
- Gap: judging rows "come back" and "sustained engagement". The card says "You'll hear how it resolves" but no route sends that message.
- Add: when `POST /risks/{id}/resolve` runs, send each answering expert one line by their channel: outcome, their own Brier score, group score. Add a "lapsed" status shown on the committee view when an approved expert has answered nothing in 28 days, with a one-click re-invite. No streaks, no counts.
- Why: expert pools lose people after launch [brief]. This answers it without engagement metrics.

## P2. Resolution criterion on every question (M) - Lane A (model), Lane B (card + ledger)
- Gap: the brief asks how to turn risks into resolvable questions; "materialised" is not defined on the card.
- Data point: the R1043 record has a "Completion rate: 40%" and a "Quantitative objective to meet 100%" field inside its trigger. Use this text, shortened, as the resolution criterion: "Resolves yes if [objective], by [date + 6 months]."
- Add: `Pulse.resolution_criterion` (string) shown under the question on the card and kept on the ledger entry. The analyst approves the wording. This also fixes the question for Alex: question 11.

## P3. Low-bandwidth budget and SMS stub (S) - Lane B (budget), Lane A (stub)
- Gap: "mobile and low-bandwidth" is a Could row; the contract lists an `sms` channel but no route.
- Add: a page budget for the expert card (suggest under 100 kB total, no web fonts beyond one, no images) measured in `make check`. For SMS, a plain-text reply format ("R1043 72 3 N") parsed by a stub, flagged off. Tell the jury it is a stub.

## P4. French card strings (S) - Lane B
- Gap: "multilingual" is a Could row; only English ships.
- Add: ship French for the expert card and the magic-link email (about 15 strings). The jury sees a language toggle once. Research check: French is named by the brief; Arabic stays on the future list.

## P5. Regions below n = 3 shown as merged (S) - Lane B
- Gap: the Chad map must show that small regions are merged rather than blank or exact. Add a quiet note: "Regions with fewer than 3 answers are combined."

## P6. Demo honesty line (M) - Lane A + B
- The master prompt already requires saying which path ran. Add a footer on `/desk` and `/ledger` that reads the flags: "Seal: HMAC credential. Anchor: off. Model: none (deterministic)." So we never claim a path that is off.

## P7. Demo panel must reach n >= 5 (M) - Lane A
- Risk: in the live QR step a handful of jurors may scan. If fewer than 5 answers are sealed, the aggregate rule hides the result and the demo stalls.
- Add: a demo mode that tops up to 8 with pre-loaded synthetic answers, labelled "synthetic" in the desk tray, and a button to reveal when 5 or more sealed answers exist (live or synthetic). The jury's answers count and show distinct from the synthetic ones on the desk only. The script in `demo-script.md` depends on this.

## P8. Extremizing factor as a setting; proof with and without (M) - Lane A
- Why: Baron et al. 2014 support extremizing in general, but later work warns it can hurt; 1.3 is our choice. See `bias-and-honesty.md` 3.4. Report both bars in `proof.png`.

## P9. Hit-rate language in the honesty box for a new panel (S) - Lane A
- A panel with no resolved questions has no hit rate. Show "no resolved questions yet" instead of a number or zero. Same for new experts on the board.

## P10. A single "what fed into this" sentence (S) - Lane A + B
- The mentor's wording: "state ... what fed into each product". Add one generated sentence at the top of the honesty box: "Based on 7 sealed answers from a panel of 8, 2 claims corroborated of 3, ACAPS rating hidden in round 1." Deterministic, built from fields we already have.

## P11. Check the "over a million refugees" claim (M) - team
- The master prompt states "over a million Sudanese refugees in eastern Chad since 2023". The UNHCR figures found were about 800,000 to 870,000 registered arrivals by mid-2025. Either source a current figure or change the sentence in the README and slides. Lane C has used the verifiable wording.

## P12. Confirm the "six-step method" with ACAPS (L)
- Master prompt describes ACAPS's process as a "six-step method". We found no numbered list in ACAPS's published methodology material. Ask Alex for the official steps (question for the 6 Nov follow-up). Until then impact.md uses a six-step grouping labelled as ours.
