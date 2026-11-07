# Sealed Signals

Sealed Signals is the Risk Radar platform ACAPS does not have: the live Risk List from the ACAPS API, with an expert loop,
descriptive integrity notes and a public audit trail on top. An ACAPS analyst (or, in phase 2, an indicator doorbell)
sends a one-minute question to the eight best-matched vetted experts. Experts answer on their phone behind a mask they
choose, with ACAPS's rating hidden until after submission. Answers are committed with a timestamp, opened together,
summarised as an equal-weight mean with spread and minority reasons, annotated with integrity notes the analyst reads,
turned into a cited draft the analyst accepts, edits or rejects, and published as a group view on a ledger with an honesty
box that states what fed into it, its limits and its misses. When the risk resolves, forecasts are scored committee-side
and every panel member gets the group outcome report. Nothing publishes itself.

The gap, stated exactly: ACAPS has a documented methodology and peer review for its scheduled products. The ad-hoc expert
checks between scheduled reviews, by email and conversation, are not structured, time-stamped or auditable. Sealed
Signals adds a reviewable trail to those checks. It does not replace ACAPS's method; it sits inside it (section 0b).
Pitch spine: **easier to contribute to, easier to scrutinise, easier to trace.**

## Run

```
pip install -r engine/requirements.txt
make seed && make dev        # API on :18000
make ui                      # frontend on :5173
make demo                    # full loop on R1043, offline
make check                   # tests, UI build, fixture validation
```

## Start here
Read `docs/sealed-signals/MASTER_PROMPT.md`, pick your lane, create `lane/<name>` from `main`.

Team: Zain Ul Haq (backend) · <name> (frontend) · <name> (research & pitch). Challenge: ACAPS Ground Truth, Hackathon for Good #8.
Synthetic experts only. ACAPS Risk Radar data under ACAPS terms of use.
