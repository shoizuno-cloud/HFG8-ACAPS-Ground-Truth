"""Section 6d: per-expert response-pattern reports.

Descriptive sentences computed from data the store already holds. Read the rules once:

* never a score, never public, never a reason to approve or remove anyone in the pilot;
* never derived from free text -- only from numbers the expert chose knowingly;
* nothing at all until the expert has answered at least three pulses;
* anonymous answers are not in any report, because they carry no identity to attach one to.

A benign expert gets no sentences. That is the design, not a gap: the report exists to surface a
pattern worth a conversation, and "nothing stands out" is the honest output most of the time.
"""
from __future__ import annotations
import statistics
from datetime import datetime
from typing import Callable

MIN_PULSES = 3
EXTREME_LOW, EXTREME_HIGH = 0.1, 0.9
AGREEMENT_BAND = 0.15

THRESHOLDS = {
    "anchoring_pulses": 3,
    "anchoring_share": 0.6,
    "extremity": 0.4,
    "overconfidence": 0.2,
    "well_calibrated_brier": 0.1,
    "well_calibrated_gap": 0.1,
    "abstention": 0.3,
    "heard_share": 0.5,
    "co_movement_pulses": 3,
    "co_movement_share": 0.8,
}

NEVER = ("Never a score. Never public. Never a reason to approve or remove anyone in the pilot. "
         "Never computed from free text.")


def _seconds_between(start: str | None, end: str | None) -> float | None:
    if not start or not end:
        return None
    try:
        return (datetime.fromisoformat(end) - datetime.fromisoformat(start)).total_seconds()
    except ValueError:
        return None


def _bucket(probability: float) -> int:
    return min(int(probability * 5), 4)


def report(store, expert_id: str, pseudonym: str,
           acaps_probability: Callable[[str], float | None] | None = None,
           pseudonym_of: Callable[[str], str] | None = None) -> dict:
    """One PatternReport. `acaps_probability` maps a risk id to the published band as a number;
    `pseudonym_of` maps an internal expert id to its pseudonym, so no report names an expert even
    on the committee side."""
    acaps_probability = acaps_probability or (lambda _risk_id: None)
    pseudonym_of = pseudonym_of or (lambda expert: expert)

    # -- gather this expert's answers, pulse by pulse --------------------------
    mine: dict[str, dict[int, object]] = {}
    for pulse_id, answers in store.answers.items():
        for answer in answers:
            if answer.expert_id and answer.expert_id == expert_id:
                mine.setdefault(pulse_id, {})[answer.round] = answer
    n_pulses = len(mine)

    if n_pulses < MIN_PULSES:
        return {
            "pseudonym": pseudonym, "available": False, "n_pulses": n_pulses,
            "min_pulses": MIN_PULSES,
            "note": f"A pattern report opens after {MIN_PULSES} pulses; this expert has "
                    f"{n_pulses}.",
            "never": NEVER, "sentences": [],
        }

    first_rounds = [rounds[min(rounds)] for rounds in mine.values()]
    estimates = [a for a in first_rounds if a.stance == "estimate" and a.probability is not None]

    # -- the numbers -----------------------------------------------------------
    briers = [s["brier"] for s in store.scores if s["expert_internal_id"] == expert_id]
    mean_brier = round(statistics.fmean(briers), 4) if briers else None

    confidences = [a.confidence for a in estimates if a.confidence is not None]
    mean_confidence = round(statistics.fmean(confidences), 2) if confidences else None
    overconfidence = None
    if mean_confidence is not None and mean_brier is not None:
        # Stated confidence on a 1-5 scale against realised accuracy (1 - Brier). Positive means
        # more confidence than the answers earned.
        overconfidence = round(((mean_confidence - 1) / 4) - (1 - mean_brier), 4)

    extremity = round(
        sum(1 for a in estimates if a.probability <= EXTREME_LOW or a.probability >= EXTREME_HIGH)
        / len(estimates), 4
    ) if estimates else None

    agreed, comparable = 0, 0
    for pulse_id, rounds in mine.items():
        pulse = store.pulses.get(pulse_id) or {}
        published = acaps_probability(pulse.get("risk_id", ""))
        answer = rounds[max(rounds)]
        if published is None or answer.probability is None:
            continue
        comparable += 1
        if abs(answer.probability - published) <= AGREEMENT_BAND:
            agreed += 1
    agreement = round(agreed / comparable, 4) if comparable else None

    shifts, toward, with_two_rounds = [], 0, 0
    for pulse_id, rounds in mine.items():
        if 1 not in rounds or 2 not in rounds:
            continue
        first, second = rounds[1], rounds[2]
        if first.probability is None or second.probability is None:
            continue
        with_two_rounds += 1
        shifts.append(abs(second.probability - first.probability))
        published = acaps_probability((store.pulses.get(pulse_id) or {}).get("risk_id", ""))
        if published is not None and abs(second.probability - published) < abs(
                first.probability - published):
            toward += 1
    round2_shift = round(statistics.fmean(shifts), 4) if shifts else None

    source_mix = {tag: sum(1 for a in first_rounds if a.source_tag == tag)
                  for tag in ("saw", "read", "heard")}
    abstentions = sum(1 for a in first_rounds if a.stance != "estimate")
    abstention_rate = round(abstentions / len(first_rounds), 4)

    latencies = [
        value for value in (
            _seconds_between(
                (store.pulses.get(pulse_id) or {}).get("created_at")
                or (store.pulses.get(pulse_id) or {}).get("fired_at"),
                rounds[min(rounds)].committed_at)
            for pulse_id, rounds in mine.items()
        ) if value is not None and value >= 0
    ]
    latency = round(statistics.fmean(latencies), 1) if latencies else None

    partners = _co_movement(store, expert_id, mine, pseudonym_of)

    # -- the sentences ---------------------------------------------------------
    sentences: list[str] = []
    if (with_two_rounds >= THRESHOLDS["anchoring_pulses"]
            and toward / with_two_rounds >= THRESHOLDS["anchoring_share"]):
        sentences.append(
            f"Moves toward the ACAPS band in round 2 on {toward} of {with_two_rounds} pulses, "
            f"by {round2_shift} on average."
        )
    if extremity is not None and extremity >= THRESHOLDS["extremity"]:
        count = round(extremity * len(estimates))
        sentences.append(
            f"Puts {count} of {len(estimates)} answers at {EXTREME_LOW} or below, or "
            f"{EXTREME_HIGH} or above."
        )
    if overconfidence is not None and overconfidence >= THRESHOLDS["overconfidence"]:
        sentences.append(
            f"States more confidence than the answers earned: mean confidence "
            f"{mean_confidence} of 5 against a mean Brier score of {mean_brier}."
        )
    if (mean_brier is not None and overconfidence is not None
            and mean_brier <= THRESHOLDS["well_calibrated_brier"]
            and abs(overconfidence) <= THRESHOLDS["well_calibrated_gap"]):
        sentences.append(
            f"Mean Brier score of {mean_brier} over {len(briers)} resolved risks, with stated "
            f"confidence close to that accuracy."
        )
    if abstention_rate >= THRESHOLDS["abstention"]:
        sentences.append(
            f"Abstains on {abstentions} of {len(first_rounds)} pulses, choosing "
            f"'outside my expertise' or 'not enough evidence'."
        )
    tagged = sum(source_mix.values())
    if tagged and source_mix["heard"] / tagged >= THRESHOLDS["heard_share"]:
        sentences.append(
            f"Tags {source_mix['heard']} of {tagged} answers 'heard' rather than seen or read."
        )
    for partner in partners:
        sentences.append(
            f"Lands in the same probability bucket as {partner['pseudonym']} on "
            f"{partner['together']} of {partner['shared']} shared pulses."
        )

    return {
        "pseudonym": pseudonym,
        "available": True,
        "n_pulses": n_pulses,
        "calibration": {
            "mean_brier": mean_brier, "n_resolved": len(briers),
            "mean_confidence_1_5": mean_confidence,
            "scale_note": "Confidence is a 1-5 self-rating, not a probability of being right, so "
                          "the gap below is a rough comparison. Only a large positive gap is "
                          "reported as a sentence, and a negative one is never called "
                          "underconfidence.",
        },
        "overconfidence": overconfidence,
        "extremity": extremity,
        "agreement_with_acaps": agreement,
        "agreement_comparable_pulses": comparable,
        "round2_shift": round2_shift,
        "round2_pulses": with_two_rounds,
        "round2_toward_acaps": toward,
        "source_mix": source_mix,
        "abstention_rate": abstention_rate,
        "answer_latency_seconds": latency,
        "co_movement": partners,
        "sentences": sentences,
        "never": NEVER,
        "note": "Nothing here stands out." if not sentences else
                "Descriptive only. Each sentence is a prompt for a conversation, not a verdict.",
    }


def _co_movement(store, expert_id: str, mine: dict,
                 pseudonym_of: Callable[[str], str]) -> list[dict]:
    """Who this expert keeps landing beside. Pseudonyms only, and only above a floor of shared
    pulses -- two people agreeing twice is a coincidence, not a pattern."""
    shared: dict[str, dict] = {}
    for pulse_id, rounds in mine.items():
        answer = rounds[min(rounds)]
        if answer.probability is None:
            continue
        for other in store.answers.get(pulse_id, []):
            if not other.expert_id or other.expert_id == expert_id:
                continue
            if other.probability is None or other.round != answer.round:
                continue
            record = shared.setdefault(other.expert_id,
                                       {"shared": 0, "together": 0,
                                        "pseudonym": pseudonym_of(other.expert_id)})
            record["shared"] += 1
            if _bucket(other.probability) == _bucket(answer.probability):
                record["together"] += 1
    out = []
    for record in shared.values():
        if (record["shared"] >= THRESHOLDS["co_movement_pulses"]
                and record["together"] / record["shared"] >= THRESHOLDS["co_movement_share"]):
            out.append(record)
    return sorted(out, key=lambda r: (-r["together"], r["pseudonym"]))
