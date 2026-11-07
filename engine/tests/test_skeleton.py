"""Smoke test: the loop runs end to end against the seeded synthetic panel."""
from __future__ import annotations


def test_health_and_risk_routes(seeded):
    client, _ = seeded
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/risks/R1043").json()["risk_id"] == "R1043"
    assert client.get("/radar/status").json()["source"] == "csv"


def test_full_loop(seeded):
    client, pulse_id = seeded

    revealed = client.post(f"/pulses/{pulse_id}/reveal").json()
    assert revealed["n"] >= 5

    drafted = client.post(f"/pulses/{pulse_id}/draft").json()
    assert drafted["status"] == "draft"

    client.post("/risks/R1043/contract", json={
        "event": "Sustained cross-border attacks on eastern Chad border localities",
        "location": "Ouaddai, Chad",
        "horizon_deadline": "2027-05-07",
        "resolution_source": "ACAPS Risk Radar status field",
        "adjudication_rule": "Materialised if ACAPS marks it so by the deadline.",
    })
    decided = client.post(f"/drafts/{drafted['id']}/decision", json={
        "action": "accept",
        "what_decision": "Pre-position shelter and cash in Ouaddai",
        "for_whom": "NGO preparedness lead, eastern Chad",
        "by_when": "2026-11-20",
    }).json()
    assert decided["status"] == "accepted"

    resolved = client.post("/risks/R1043/resolve", json={"outcome": "materialised"}).json()
    assert resolved["scores_written"] > 0


def test_every_response_carries_provenance(seeded):
    client, pulse_id = seeded
    for path in ("/risks", "/risks/R1043", "/radar/status", f"/pulses/{pulse_id}", "/ledger"):
        body = client.get(path).json()
        assert body["served_from"] == "live", path
        assert body["generated_at"], path
