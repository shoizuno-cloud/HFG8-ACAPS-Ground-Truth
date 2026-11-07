"""The section 5 routes added in v3.2, on the product surface.

/credentials, /registry, /committee, /ledger/{id}/attestation, /anchors, /me/{token}/patterns --
plus the two changes to existing routes: an answer may carry a credential or a proof, and a resolve
signs an outcome attestation.
"""
from __future__ import annotations
import base64

from engine.hardening import credentials as credentials_mod


def test_trust_status_carries_all_six_mechanisms_with_their_wording(seeded):
    client, _ = seeded
    body = client.get("/api/trust/status").json()
    assert len(body["mechanisms"]) == 6
    for mechanism in body["mechanisms"]:
        assert mechanism["guarantees"] and mechanism["does_not"]
    assert body["flags"]["FF_ZK"] is False
    assert body["zk"]["proof_verifier"] == "not implemented in this build"


def test_registry_status_shows_the_lock_line(seeded):
    client, _ = seeded
    body = client.get("/api/registry/status").json()
    assert body["encryption"].startswith("ML-KEM-768")
    assert body["key_id"]
    assert "key held by the committee" in body["lock_line"]
    assert body["does_not"]


def test_an_identity_goes_in_encrypted_and_only_comes_out_through_the_log(seeded):
    client, _ = seeded
    applied = client.post("/api/experts/apply", json={
        "geo_tags": ["TCD"], "theme_tags": ["access"],
        "identity": {"name": "Applicant (synthetic)", "email": "a@example.invalid"},
    }).json()
    expert_id = applied["expert_id"]
    assert applied["identity_stored"] is True
    # The application response must not echo the identity back.
    assert "a@example.invalid" not in client.get("/api/panels/match").text

    before = client.get("/api/committee/access-log").json()["n_reads"]
    refused = client.post("/api/committee/registry/read", json={"expert_id": expert_id})
    assert refused.status_code == 422
    assert client.get("/api/committee/access-log").json()["n_reads"] == before

    opened = client.post("/api/committee/registry/read", json={
        "expert_id": expert_id, "who": "committee-admin", "why": "duplicate application check",
    })
    assert opened.status_code == 200
    assert opened.json()["identity"]["email"] == "a@example.invalid"
    log = client.get("/api/committee/access-log").json()
    assert log["n_reads"] == before + 1
    assert log["entries"][0]["who"] == "committee-admin"


def test_approval_issues_a_credential_batch(seeded):
    client, _ = seeded
    expert_id = client.post("/api/experts/apply", json={"geo_tags": ["TCD"]}).json()["expert_id"]
    client.post(f"/api/experts/{expert_id}/approve", json={"admin": "admin-a"})
    approved = client.post(f"/api/experts/{expert_id}/approve", json={"admin": "admin-b"}).json()
    assert approved["status"] == "approved"
    assert approved["credential_batch"]["n_issued"] == 3
    assert approved["credential_batch"]["scheme"] == "rsa-blind-rfc9474"

    summary = client.get("/api/credentials/status").json()
    assert summary["n_issued"] >= 3
    assert summary["linked"] is False


def test_credentials_issue_signs_blinded_values_and_never_sees_the_token(seeded):
    client, _ = seeded
    expert_id = client.post("/api/experts/apply", json={"geo_tags": ["TCD"]}).json()["expert_id"]
    for admin in ("admin-a", "admin-b"):
        client.post(f"/api/experts/{expert_id}/approve", json={"admin": admin})

    issuer = client.get("/api/credentials/issuer").json()
    modulus, exponent = int(issuer["n"], 16), issuer["e"]
    token_id = "a1" * 16
    blinded, inverse = credentials_mod.blind(
        credentials_mod.message_for(token_id), modulus, exponent
    )
    issued = client.post("/api/credentials/issue", json={
        "expert_id": expert_id, "panel_id": "PAN-TCD", "blinded": [hex(blinded)],
    })
    assert issued.status_code == 201
    body = issued.json()
    assert body["unlinkable"] is True
    assert token_id not in issued.text

    signature = base64.b64encode(
        credentials_mod.unblind(int(body["blind_signatures"][0], 16), inverse, modulus)
    ).decode()

    # Spend it on a real answer, then try to spend it again.
    link = next(row for row in client.get("/api/demo/links").json()["links"]
                if not row["answered"])
    answered = client.post(f"/api/e/{link['token']}/answer", json={
        "mask": "anonymous", "probability": 0.6, "confidence": 3, "source_tag": "read",
        "missing": "Spent a blind credential.", "round": 1,
        "credential": {"token_id": token_id, "signature": signature},
    })
    assert answered.status_code == 201
    assert answered.json()["credential"] == {
        "spent": True, "unlinkable": True, "scheme": "rsa-blind-rfc9474",
        "line": answered.json()["credential"]["line"],
    }

    second = client.post(f"/api/e/{link['token']}/answer", json={
        "mask": "anonymous", "probability": 0.6, "round": 1,
        "credential": {"token_id": token_id, "signature": signature},
    })
    assert second.status_code == 409
    assert "already spent" in second.json()["detail"]


def test_credentials_are_refused_before_approval(seeded):
    client, _ = seeded
    expert_id = client.post("/api/experts/apply", json={"geo_tags": ["TCD"]}).json()["expert_id"]
    refused = client.post("/api/credentials/issue", json={"expert_id": expert_id, "count": 2})
    assert refused.status_code == 409
    assert "approval" in refused.json()["detail"]


def test_an_anonymous_answer_without_a_credential_says_which_path_ran(seeded):
    client, _ = seeded
    link = next(row for row in client.get("/api/demo/links").json()["links"]
                if not row["answered"])
    body = client.post(f"/api/e/{link['token']}/answer", json={
        "mask": "anonymous", "probability": 0.5, "confidence": 3, "round": 1,
        "missing": "No credential presented.",
    }).json()
    assert body["credential"]["spent"] is True
    assert body["credential"]["unlinkable"] is False
    assert "did not bring its own" in body["credential"]["line"]


def test_a_membership_proof_is_refused_while_the_flag_is_off(seeded):
    client, _ = seeded
    link = next(row for row in client.get("/api/demo/links").json()["links"]
                if not row["answered"])
    refused = client.post(f"/api/e/{link['token']}/answer", json={
        "mask": "pseudonym", "probability": 0.5, "round": 1,
        "zk_proof": {"panel_id": "PAN-TCD", "group_root": "00" * 32,
                     "nullifier": "11" * 32, "points": list(range(8))},
    })
    assert refused.status_code == 409
    assert "FF_ZK is off" in refused.json()["detail"]


def test_anchors_lists_a_root_for_the_sealed_day(seeded):
    client, _ = seeded
    body = client.get("/api/anchors").json()
    assert body["roots"], "the seeded round sealed commitments, so a root exists"
    root = body["roots"][0]
    assert len(root["merkle_root"]) == 64
    assert root["status"] in ("pending", "anchored")
    assert root["does_not"]
    assert client.post("/api/anchors/2026-01-01/submit").status_code == 404


def test_resolving_signs_an_outcome_attestation(seeded):
    client, pulse_id = seeded
    client.post(f"/api/pulses/{pulse_id}/reveal")
    draft = client.post(f"/api/pulses/{pulse_id}/draft").json()
    client.post(f"/api/drafts/{draft['id']}/decision", json={
        "action": "accept", "note": "Accepted for the attestation test.",
        "decision_use": {"what_decision": "brief the team", "for_whom": "field office",
                         "by_when": "2026-12-01"},
    })
    client.post("/api/risks/R1043/contract", json={
        "event": "Arrivals exceed the planned site capacity in Ouaddai.",
        "location": "Ouaddai, Chad", "horizon_deadline": "2026-12-31",
        "resolution_source": "ACAPS Risk Radar", "adjudication_rule": "ACAPS published status",
    })
    resolved = client.post("/api/risks/R1043/resolve", json={"outcome": "materialised"}).json()
    assert resolved["attestation"]["scheme"] == "ML-DSA-65"

    attestation = client.get("/api/ledger/R1043/attestation").json()
    assert attestation["verification"]["valid"] is True
    assert attestation["public_key"]["public_key"], "the verification key must be published"
    assert "Truth of the outcome" in attestation["attestation"]["does_not"]


def test_an_unresolved_risk_has_no_attestation(seeded):
    client, _ = seeded
    missing = client.get("/api/ledger/R1043/attestation")
    assert missing.status_code == 404
    assert "not resolved" in missing.json()["detail"]


def test_ledger_verify_reports_three_separate_checks(seeded):
    client, pulse_id = seeded
    client.post(f"/api/pulses/{pulse_id}/reveal")
    draft = client.post(f"/api/pulses/{pulse_id}/draft").json()
    client.post(f"/api/drafts/{draft['id']}/decision", json={
        "action": "accept", "note": "Accepted so the ledger has an entry.",
        "decision_use": {"what_decision": "brief the team", "for_whom": "field office",
                         "by_when": "2026-12-01"},
    })
    entry = client.get("/api/ledger").json()["entries"][0]
    body = client.post("/api/ledger/verify", json={"verify_hash": entry["verify_hash"]}).json()
    assert body["valid"] is True
    assert body["checked_means"]
    assert body["attestation"] is None
    assert "not resolved" in body["attestation_means"]
    assert body["anchor"] is None, "a pending root offers no link"
    assert body["anchor_root"]["merkle_root"]
    assert "proves nothing" in body["anchor_means"]


def test_committee_patterns_are_pseudonymous_and_gated(seeded):
    client, _ = seeded
    from engine.api import HARD, SETTINGS, STORE
    from engine.seeding_hardening import seed_all
    from engine.store import pseudonym_for

    seed_all(HARD, STORE, SETTINGS)
    listed = client.get("/api/committee/patterns").json()
    assert listed["reports"], "the seeded history opens several reports"
    assert "X-syn-" not in client.get("/api/committee/patterns").text

    pseudonym = listed["reports"][0]["pseudonym"]
    one = client.get(f"/api/committee/patterns/{pseudonym}").json()
    assert one["pseudonym"] == pseudonym
    assert "Never a score" in one["never"]
    assert client.get("/api/committee/patterns/nobody-here").status_code == 404

    # The pseudonym has to resolve back to a real panel member, or the route is answering about
    # nobody; it must never be the internal id that resolution goes through.
    expert_id = next(e for e in STORE.experts if
                     pseudonym_for(e, SETTINGS.pseudonym_key) == pseudonym)
    assert expert_id in STORE.experts and expert_id != pseudonym


def test_my_own_pattern_report_is_opt_in(seeded):
    client, _ = seeded
    from engine.api import HARD, SETTINGS, STORE
    from engine.seeding_hardening import seed_all

    seed_all(HARD, STORE, SETTINGS)
    token = next(iter(STORE.tokens))
    refused = client.get(f"/api/me/{token}/patterns")
    assert refused.status_code == 409
    assert "opt-in" in refused.json()["detail"]

    mine = client.get(f"/api/me/{token}/patterns?opt_in=true")
    assert mine.status_code == 200
    assert mine.json()["private"] is True
    assert client.get("/api/me/not-a-token/patterns?opt_in=true").status_code == 404
