# Pitch

Lane C. Three minutes, eight slides. Timing and stage actions are in `demo-script.md`. This file holds the slide text, the speaker notes and the submission paragraph. Slides are built from `slides/index.html`.

Style: white background, one accent colour (deep teal), large type, one idea per slide, no emoji, no stock photos, no gradients.

## Slide text

1. **Problem.** Headline: "47 %". Line: "of Medium-rated ACAPS risks materialised. A coin flip." Small: "27 of 58 resolved Medium risks. High-rated: 32 of 38 (84 %). Source: ACAPS Risk Radar export."
2. **What ACAPS told us.** Four short lines, quoted or paraphrased as recorded: "Experts are informed professionals, not sources on the ground." "Experts apply; a committee approves." "There is no platform. Risk Radar is a dataset and an API." "We will get things wrong, like a prediction market; the point is honesty about it."
3. **The loop.** Eight stages in one row: doorbell, matched panel, sealed answers, integrity checks, verified draft, analyst decision, ledger with honesty box, scoring. Caption: "The machine rings the doorbell, the panel answers, the analyst decides, the ledger remembers."
4. **Demo.** QR code and the text "Scan. You are the Chad panel. 60 seconds." Small: "Risk R1043, eastern Chad. Synthetic experts are labelled."
5. **Proof.** The proof chart. Caption: "Method test on 104 resolved risks with synthetic experts. Not a claim about real experts." (Numbers from `reports/proof.json`.)
6. **Bias and honesty.** Four lines: "Blind first round (anchoring)." "Reliability weights from Brier scores (calibration)." "Surprisingly-popular highlight (Prelec 2017)." "Moderator-only flags; public honesty box." Footer: "One validation layer among others. Nothing changes without an analyst."
7. **Impact and stakeholders.** Five names: analysts, experts, readers, committee, affected people. Line per group, one phrase each. Footer: "Better probability, earlier decision, anticipatory funds, pre-positioned aid. Evidence strongest for floods and drought; conflict is the open test."
8. **December pilot and team.** Pilot: "Two months. One committee, eight experts, one country. Measures: panel Brier vs ACAPS rating, minutes saved per update, experts still answering in week 8." Team: names to be filled in.

## Speaker notes

- Slide 1 (0:00): Say the numbers, then the point. "A donor cannot act on a coin flip."
- Slide 2: skip when time is short. The quotes go on the slide; read at most the last one.
- Slide 3: do not read the eight stages. Point at the row; name only the ones the demo shows.
- Slide 4 (0:25): the QR. The live minute starts here.
- Slide 5 (2:10): read the real number from the chart. Say "synthetic" in the same breath.
- Slide 6: bring in only if asked about bias. Backup slide.
- Slide 7: backup for Q and A.
- Slide 8 (2:55): the close. Mentor quote first, then the tagline.

The 3-minute pitch uses slides 1, 4, 5 and 8 on screen, and the live product in between. Slides 2, 3, 6 and 7 are for the written submission, Q and A and the committee, and for a longer slot if the schedule changes.

## Submission description (one paragraph, for the repo form)

Sealed Signals is the Risk Radar platform ACAPS does not have: the live Risk List from the ACAPS API, with an expert loop, a bias and integrity layer and a public audit trail built on top. It lets ACAPS ask a small, trusted panel of vetted experts (5 to 10, matched by geographic and thematic tags) to challenge and forecast its risk analyses in one minute, behind a mask each expert chooses. A daily doorbell watches open indicators mapped to the risk's own triggers and fires a pulse when something shifts. Answers are sealed, opened together, aggregated with the surprisingly-popular method and reliability weights, turned into a cited draft update the analyst accepts or rejects, and published as a group view on a public ledger. When the risk resolves, every forecast is Brier-scored, weights update, and experts get a private calibration report. Nothing identifying leaves the expert's device; nothing publishes itself. The demo uses synthetic experts and the real ACAPS Risk Radar export. It is a prototype for the December pilot.

## Lines to avoid

- "Revolutionary", "AI-powered", "game-changing". Say what it does.
- "Accurate experts". We have no real expert data.
- "Saves lives". We claim a better probability. See `impact.md` part 3.
- Any claim that a feature runs when its flag is off.
