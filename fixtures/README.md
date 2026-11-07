# Fixtures

One JSON per route, named `METHOD_path.json` (request and response where both matter). Lane B builds against these with `VITE_MOCK=1`.

## Regenerating

```
python scripts/regenerate_fixtures.py
```

The script drives the whole loop in-process against a freshly seeded store — alert → pulse → card → answer → reveal → draft → decision → ledger → resolve → attestation — and writes what the API actually returned. Several responses only exist after the step before them, so it walks the loop in order rather than hitting routes in isolation. Request fixtures are written from the bodies actually sent, so a request and its response always belong to each other. A route that refuses is reported and its old fixture is left alone, never replaced with an error body.

Run `python scripts/validate_fixtures.py` afterwards: every response fixture must carry `served_from` and `generated_at`, and none may expose an aggregate with n < 5.

## What is a choice and what is not

The content is unedited API output. Two things are choices, and both are here rather than hidden in the files:

* **Volume.** `GET_risks.json` keeps four of the 28 active risks and `GET_alerts.json` five of the month's events. The UI imports these at build time, so a full dump would put 120 KB of ACAPS data in the mock bundle for no gain. The rows kept are real; only how many is a decision.
* **Which round.** `GET_pulses_demo.json` is the seeded demo round, which the desk opens on. `POST_pulses_response.json` is the genuine response of `POST /pulses` and describes whichever pulse that call created. They are different pulses on purpose.

The demo round has eight answers and an equal-weight mean of 0.6583 — six estimates and two abstentions. Tests that quote the mean read it from the fixture rather than hard-coding a percentage, because the last set of hard-coded ones said 69% long after the engine had stopped producing it.

## Hardening stack (MASTER_PROMPT 6c, 6d)

`GET_trust_status.json` carries all six mechanisms with the guarantee / does-not wording the product must use. The rest cover the registry and its access log, credential issuance and counts, the daily anchor roots, the outcome attestation, the ZK status (including the verifier this build does not have) and the pattern reports.

`POST_credentials_issue_request.json` holds a genuinely blinded value and its response a genuine blind signature, so the unlinkable path is visible in the fixtures and not only in the tests.
