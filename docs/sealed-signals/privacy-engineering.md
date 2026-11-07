# Privacy engineering (repo page; not in the 3-minute pitch)

Updated for master prompt v3.2. Sections 1 and 2 are the pilot design and have not changed. Section 3 is the
hardening stack of MASTER_PROMPT 6c as **built**, with the test that backs each claim. Section 4 is section 6d.
Section 5 is the part that is honestly not finished.

Wording rule for all of it: every mechanism is described with the guarantee / does-not pair from
`trust-design.md`. Those sentences live in one place in the code, `engine/engine/hardening/flags.py`, and the API
and the UI render them from there rather than keeping a second copy. `GET /api/trust/status` returns all six.

1. **Who can learn what**: see MASTER_PROMPT.md section 1a.
2. **Pilot design**: restricted identity registry with logged access; stable internal ids; pseudonyms to peers;
   unattributed answers stored without an identity link, not claimable, and without personalised feedback
   (the product says pseudonymised, never anonymous); aggregates only to the public with n >= 5.

## 3. The hardening stack, as built

| # | Mechanism | Flag | Where the code is | Test evidence |
| --- | --- | --- | --- | --- |
| 1 | ML-KEM-768 + X25519 hybrid key establishment wrapping the AES-256-GCM key over the identity map (AES-256-GCM at rest) | `FF_PQ`, on | `hardening/registry.py` | `test_crypto.py::test_registry_round_trip_under_the_hybrid_kem`, `::test_registry_ciphertext_is_not_decryptable_without_the_committee_key`, `::test_registry_falls_back_and_says_so_when_the_flag_is_off` |
| 2 | ML-DSA-65 signature over each resolved outcome record | `FF_PQ`, on | `hardening/attest.py` | `::test_attestation_verifies_and_fails_on_a_flipped_byte`, `::test_attestation_fails_when_the_record_is_edited`, `::test_attestation_public_key_is_stable_across_instances` |
| 3 | RSA blind signatures, RFC 9474 RSABSSA-SHA384-PSS-Deterministic | `FF_BLIND`, on | `hardening/credentials.py` | `::test_blind_signature_verifies_as_standard_rsa_pss`, `::test_a_credential_cannot_be_spent_twice`, `::test_the_issuer_cannot_match_a_spent_token_to_an_approval` |
| 4 | Semaphore-shaped group membership | `FF_ZK`, **off** | `hardening/zk.py` | `::test_nullifier_rejects_a_second_answer`, `::test_the_verdict_never_claims_the_proof_was_checked` — see section 5 |
| 5 | OpenTimestamps anchoring of the daily commitment root | `FF_ANCHOR`, on | `hardening/anchors.py` | `::test_anchor_goes_pending_then_anchored`, `::test_an_unreachable_calendar_does_not_invent_an_anchor`, `::test_a_receipt_is_only_returned_for_a_commitment_in_that_root` |
| 6 | Registry access log | always on | `hardening/registry.py` | `::test_a_registry_read_appears_in_the_log`, `::test_an_unattributed_read_is_refused`, `::test_counting_identities_is_not_a_read` |

Notes that matter more than the table:

* **The blind signature is a real one.** The committee signs a value it cannot read, and the unblinded result passes
  an ordinary `cryptography` RSA-PSS verify — the test checks it that way on purpose, against a library that knows
  nothing about this codebase. The zero-length salt is what makes the deterministic variant deterministic; the PSS
  encoding is written out in `credentials.py` because the blinding has to happen on the encoded integer and no
  library exposes that step.
* **There are two issuance paths and they do not make the same claim.** `POST /api/credentials/issue` with
  `blinded` is the real one: the card blinds, the server signs, the card unblinds, and nothing the server stored
  names the token it later accepts. With `count` the server runs the client side itself for the demo, so it held
  the token id for an instant. That batch is marked `unlinkable: false`, and the committee view says which mix it
  is looking at rather than printing the unlinkability sentence over tokens that have not earned it.
* **An anchor is pending until a calendar says otherwise.** A submission receipt is not a proof. The status reads
  `anchored` only after `GET /timestamp/<digest>` returns an upgraded proof, which needs the next Bitcoin block.
  Submission was tested against the live `a.pool.opentimestamps.org` calendar and the receipt is stored; the
  pending-to-anchored transition is tested with an injected calendar, because waiting for a block in a test suite
  is not a test.
* **The fallbacks are real code, not a skipped branch.** `FF_PQ` off encrypts with a data key stored beside the
  ciphertext and signs with an HMAC; `FF_BLIND` off issues a single-use HMAC token. Each says in its own payload
  which path ran. The flag-off fallbacks have their own tests.
* **Key material.** ML-KEM and ML-DSA keys are derived from `COMMITTEE_KEY` under separate labels, so the published
  key ids survive a restart. RSA has no seeded keygen in `cryptography`, so the credential issuer is generated per
  process and `GET /api/credentials/issuer` says so: a restart retires every token signed by the old issuer.

## 4. Response-pattern reports (section 6d)

`hardening/patterns.py`, surfaced at `GET /api/committee/patterns/{pseudonym}` and, opt-in,
`GET /api/me/{token}/patterns?opt_in=true`. Computed only from numbers the expert chose knowingly: never from the
free-text line, never below three pulses, and never for an anonymous answer, which carries no identity to attach a
pattern to. Pseudonyms in, pseudonyms out — a committee-side report that printed an internal id would leak the
registry key.

The thresholds are in one dict at the top of the module. A benign expert produces no sentences at all, which is the
design: the report exists to surface something worth a conversation, and most of the time nothing is.

One honest weakness: the overconfidence figure compares a 1-to-5 self-rating with realised accuracy, which is a
rough comparison rather than a principled one. The payload says so in `calibration.scale_note`, only a large
positive gap is ever reported as a sentence, and a negative gap is never called underconfidence.

Test evidence: `tests/hardening/test_patterns.py` — the seeded anchoring-prone, extreme, well-calibrated,
overconfident, abstaining and hearsay-tagging profiles each produce their expected sentence; the ordinary one
produces none; nothing opens below the floor; no report names an expert.

## 5. What is not built, and why the flag is off

**The zero-knowledge proof verifier.** The group tree, its published root and the per-pulse nullifier are built and
enforced: a second answer under the same nullifier is refused, server-side, and that is tested. The Groth16 check
that proves a nullifier belongs to the tree without naming the leaf is **not** implemented. It needs the circuit's
verification key and a BN254 pairing check, and the proof has to be generated in the browser; neither exists in
this build. So `verify` returns `cryptographic_verification: false`, names what it did and did not check, `FF_ZK`
ships off, and with the flag off no proof is accepted at all.

Without that verifier the mechanism cannot tell a real proof from a well-formed fake, so it guarantees
double-answer prevention and nothing else. The Trust page says this in those words. On stage it belongs in "what we
did not do and why", beside no public scores, no auto-decisions and no blockchain logic — not in the list of
things that work.

**Threat model still to write** for the credential path: issuance timing correlation, network metadata, revocation
of a credential, and scoring without linkage. Items 1 to 3 of the does-not column already name the first two as
out of scope; a paragraph each is owed.
