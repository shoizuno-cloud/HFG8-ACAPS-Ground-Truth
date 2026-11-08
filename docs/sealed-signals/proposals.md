# Proposals and open items (Lane C to the team)

Lane C does not edit `engine/`, `ui/` or `fixtures/`. Anything research finds that the product or the deck should change is here. Revised for master prompt v3.4 (8 Nov). Each item says what, why, who, and the evidence checked. Priority: **M** before the Sunday 10:30 freeze, **L** after.

## Open

### P28. Slide 9 lists two crises that the engine did not find (M) - deck owner
- `pitch/sealed-signals-slides.html`, the alert screen, rows 2 and 3 read "SDN001 Sudan conflict 7.4 to 7.9, +0.5" and "HTI002 Haiti gang violence 6.6 to 7.1, +0.5". The cached editions have SDN001 ("Complex crisis in Sudan") at 9.6 in both March and April, and no HTI002. The engine's replay (`fixtures/POST_alerts_replay_response.json`) gives index events for TCD005 (+0.8), TZA003 "Drought and floods in Tanzania" (4.9 to 5.5, +0.6) and PAK007 "Displacement from Afghanistan to Pakistan" (7.3 to 6.4, -0.9, improvement), nine events in all. The header "3 moved 0.5 or more" is right. Replace the two rows with TZA003 and PAK007 as the engine reports them.

### P29. Example risks on the scoring and ledger slides do not match the export (M) - deck owner
- Slide 18 lists "R1018 Niger", "R1022 Mali", "R1031 Haiti" with panel values, ACAPS bands, outcomes and Brier scores, and slides 20 and 23 reuse R1018 as "panel view rejected". In the Risk Radar export R1018 is Haiti (High, Materialised), R1022 is Uganda (Not materialised), and R1031 does not exist. No real panel ever answered these, so the panel values are invented. A jury member who knows ACAPS's list may notice. Options: label the table "Illustrative, synthetic panel" and use IDs that cannot collide (for example S-01 to S-03), or use real export risks with their real titles and band and label the panel values synthetic. Either way the word "illustrative" or "synthetic" has to be on the slide.

### P30. Pilot length (M) - team
- README, slide 15 and the pilot paragraph say three months. The organisers' brief says the pilot runs "around two months" and "can start right after the hackathon or in early December". State three months only if ACAPS agreed it. Otherwise say "about two months".

### P31. "Measured, not claimed" before it is measured (M) - Lane B + deck owner
- Slide 13 says card time and taps were measured on two real phones and the payload is under 50 KB. `docs/evidence/phones.md` and `docs/evidence/screens/` do not exist yet; they are written at the freeze. Do not show the slide with those words unless the files are committed.

### P32. Peer-prediction citation in the product (M) - Lane A
- `engine/engine/store.py` sets `SP_METHOD = "Prelec 2017 / Palley & Soll peer-prediction weighting"`, and the string is returned by the API. The peer-prediction weighted average is Palley and Satopaa 2023 (*Management Science* 69(9): 5128-5146); Palley and Soll 2019 (*Management Science* 65(5): 2291-2309) is the "pivoting" paper. Say which method the code implements and cite that one (`bias-and-honesty.md` 3.5). The same wording is in `MASTER_PROMPT.md` and `trust-design.md`.

### P33. Master prompt Lane C item 3 still says "over a million Sudanese refugees in eastern Chad" (L) - file owner
- UNHCR registers 1,425,743 Sudanese refugees in Chad (data date 2 Nov 2026), a national total that includes pre-2023 arrivals. `impact.md` uses "about 1.4 million registered in Chad".

### P34. Cached ACAPS API data in a public repository (M) - team, ask ACAPS
- `data/acaps-api/` holds about 1 MB of ACAPS API responses ("ACAPS terms of use apply"). Forks and the submission repository are public. Ask whether publishing the cache is allowed, or ship only the slice the replay needs. No API token is in the repository (searched).

### P35. Consent text needs ACAPS's review (L) - team, ask ACAPS
- The first-contact message carries a one-line charter, and the calibration programme has a disclosure. A pseudonym is an HMAC the committee can resolve, so records about an expert are personal data. Ask whether ACAPS legal must approve the charter and the disclosure before real experts are contacted.

### P36. Two question contracts for R1043 (M) - analyst
- See the Lane C review in `question-contract.md`: the template draft (incursions) and the seeded contract (more than 50,000 arrivals by 31 March 2027) differ, and the arrivals threshold sits below a straight-line extrapolation of the late-September rate (151 days at 400 a day is 60,400). Freeze one, and say on the ledger that arrivals are a proxy for the insecurity risk.

### P37. Card in French (L) - Lane B
- Replies in French are parsed; the card is English only (`ui/src/locales/en`). The brief names French as a working language.

## Closed since the last version

Demo needs five answers (the seeded panel is eight and the jury's answers are additional); alert rank wording (the engine reports `rank_this_month` 1 and `rank_by_abs_delta` 2); no alert in October to November (the engine returns no events); per-expert pattern reports (replaced by panel-level sentences); latency and co-movement per person (removed); herding fallback (the analyst decides and records why); anchor and key wording (the privacy page states pending anchors, demo keys and per-process issuer); the "six-step method" (it is in the organisers' pack, `docs/risk-methodology.md`); refugee figure (updated); deck limit (the deck is the team's six-slide file; my earlier `slides/` folder is deleted).
