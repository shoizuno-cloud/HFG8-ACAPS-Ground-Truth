"""MASTER_PROMPT section 6d tests.

The spec names the cases: a seeded anchoring-prone, extreme and well-calibrated expert must each
produce the expected sentence, and a benign expert must produce none. The seeded profiles in
engine/seeding_hardening.py exist for exactly this, so these tests read them rather than inventing
a second set of synthetic people.
"""
from __future__ import annotations

import pytest

from engine.hardening import patterns
from engine.seeding import seed_demo
from engine.seeding_hardening import PROFILES, seed_pattern_history


@pytest.fixture()
def history():
    """The seeded panel plus five resolved pulses of synthetic history, per expert profile."""
    from engine.api import SETTINGS, STORE

    seed_demo(STORE, SETTINGS)
    seed_pattern_history(STORE, SETTINGS)

    def report_for(expert_id: str) -> dict:
        from engine.data import get_risk
        from engine.store import pseudonym_for

        return patterns.report(
            STORE, expert_id, pseudonym_for(expert_id, SETTINGS.pseudonym_key),
            acaps_probability=lambda risk_id: (get_risk(risk_id) or {}).get(
                "probability_assumed_number"
            ),
            pseudonym_of=lambda other: pseudonym_for(other, SETTINGS.pseudonym_key),
        )

    return report_for


def _expert_with(profile: str) -> str:
    for expert_id, name in PROFILES.items():
        if name == profile:
            return expert_id
    raise AssertionError(f"no seeded expert has the {profile} profile")


def test_the_anchoring_prone_expert_is_described_as_moving_toward_acaps(history):
    report = history(_expert_with("anchors"))
    assert report["available"] is True
    assert report["round2_pulses"] >= 3
    assert report["round2_toward_acaps"] == report["round2_pulses"]
    assert any("Moves toward the ACAPS band in round 2" in s for s in report["sentences"])


def test_the_extreme_expert_is_described_by_where_the_answers_land(history):
    report = history(_expert_with("extreme"))
    assert report["extremity"] >= 0.8
    assert any("0.1 or below, or 0.9 or above" in s for s in report["sentences"])


def test_the_well_calibrated_expert_gets_the_calibration_sentence(history):
    report = history(_expert_with("calibrated"))
    assert report["calibration"]["mean_brier"] <= patterns.THRESHOLDS["well_calibrated_brier"]
    assert any("Mean Brier score" in s for s in report["sentences"])


def test_a_benign_expert_produces_no_sentences(history):
    report = history(_expert_with("ordinary"))
    assert report["available"] is True
    assert report["sentences"] == []
    assert report["note"] == "Nothing here stands out."


def test_the_overconfident_expert_is_described_without_being_scored(history):
    report = history(_expert_with("overconfident"))
    assert report["overconfidence"] >= patterns.THRESHOLDS["overconfidence"]
    assert any("more confidence than the answers earned" in s for s in report["sentences"])
    assert "Never a score" in report["never"]


def test_the_abstainer_and_the_hearsay_tagger_are_described(history):
    abstainer = history(_expert_with("abstains"))
    assert any("Abstains on" in s for s in abstainer["sentences"])
    hearsay = history(_expert_with("hearsay"))
    assert any("'heard' rather than seen or read" in s for s in hearsay["sentences"])


def test_nothing_opens_below_the_floor(history):
    """Three pulses is the floor, and below it the report is a refusal with a count, not a shrug."""
    from engine.api import SETTINGS, STORE
    from engine.store import Expert, pseudonym_for

    STORE.add_expert(Expert(id="X-new-01", status="approved"))
    report = history("X-new-01")
    assert report["available"] is False
    assert report["n_pulses"] == 0
    assert report["sentences"] == []
    assert str(patterns.MIN_PULSES) in report["note"]
    assert report["pseudonym"] == pseudonym_for("X-new-01", SETTINGS.pseudonym_key)


def test_an_anonymous_answer_is_in_no_report(history):
    """The whole point of the anonymous mask: there is no identity to attach a pattern to."""
    from engine.api import SETTINGS, STORE

    anonymous = [a for answers in STORE.answers.values() for a in answers if a.mask == "anonymous"]
    assert anonymous, "the seeded round includes an anonymous answer"
    assert all(a.expert_id == "" for a in anonymous)

    counted = sum(
        report["n_pulses"] for report in (
            patterns.report(STORE, expert_id, "x") for expert_id in STORE.experts
        )
    )
    total_attributable = sum(
        1 for answers in STORE.answers.values() for a in answers
        if a.expert_id and a.round == 1
    )
    assert counted == total_attributable


def test_a_report_names_only_pseudonyms(history):
    """Committee-side or not, a report that printed an internal id would leak the registry key."""
    report = history(_expert_with("extreme"))
    rendered = repr(report)
    assert "X-syn-" not in rendered
    for partner in report["co_movement"]:
        assert not partner["pseudonym"].startswith("X-")


def test_co_movement_needs_more_than_a_coincidence(history):
    report = history(_expert_with("ordinary"))
    for partner in report["co_movement"]:
        assert partner["shared"] >= patterns.THRESHOLDS["co_movement_pulses"]
        assert partner["together"] / partner["shared"] >= patterns.THRESHOLDS["co_movement_share"]
