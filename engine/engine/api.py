"""Sealed Signals API.

Routes follow MASTER_PROMPT section 5. The three platform routes /health, /ready and /version come from the
deployment contract: /health must not touch any dependency, because a slow check there marks every app on the
node unhealthy at once.

The built UI, when present, is served under /app -- the API keeps the root namespace, because /ledger and
/e/{token} are API routes in section 5 and cannot also be HTML pages.
"""
from __future__ import annotations
import asyncio
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Body, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import acaps, alerts as alert_engine, data, draft as draft_builder, logging_conf, settings as settings_mod
from . import hardening as hardening_mod
from .hardening import anchors as anchor_lib, flags as ff, patterns as pattern_lib
from .store import Expert, Store, TooFew, now, pseudonym_for, round_verify_hash

ROOT = Path(__file__).resolve().parents[2]
FIX = ROOT / "fixtures"
UI_DIST = ROOT / "ui" / "dist"

log = logging.getLogger("sealed_signals")
SETTINGS = settings_mod.load()
STORE = Store(k_min=SETTINGS.k_min)
ALERTS = alert_engine.new_store()
HARD = hardening_mod.new()
_subscribers: set[asyncio.Queue] = set()


def envelope(payload: dict) -> dict:
    """Every response carries served_from and generated_at (section 4)."""
    return {**payload, "served_from": "live", "generated_at": now()}


async def publish(event: str, payload: dict) -> None:
    for queue in list(_subscribers):
        try:
            queue.put_nowait((event, payload))
        except asyncio.QueueFull:
            _subscribers.discard(queue)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging_conf.configure(SETTINGS.log_level)
    logging_conf.log(log, "info", "starting", app_env=SETTINGS.app_env, sha=SETTINGS.git_sha,
                     k_min=SETTINGS.k_min, ui_built=UI_DIST.exists())
    if os.environ.get("SEED_ON_START", "true").lower() == "true":
        from .seeding import seed_alerts, seed_demo
        pulse_id = seed_demo(STORE, SETTINGS)
        replay = seed_alerts(ALERTS)
        logging_conf.log(log, "info", "seeded synthetic panel", pulse_id=pulse_id,
                         n_experts=len(STORE.experts), n_answers=STORE.n_answers(pulse_id),
                         n_alerts=len(replay["events"]), replay=f"{replay['month_from']}->{replay['month_to']}")
        # Sections 6c and 6d: identities in the encrypted registry, one membership group, and five
        # resolved pulses of history so the pattern reports describe something real. Deliberately
        # separate from seed_demo, so the core loop and its tests never depend on it.
        if os.environ.get("SEED_HARDENING", "true").lower() == "true":
            from .seeding_hardening import seed_all
            hardening_seed = seed_all(HARD, STORE, SETTINGS)
            logging_conf.log(log, "info", "seeded hardening stack",
                             identities=hardening_seed["identities"],
                             history_pulses=len(hardening_seed["pulses"]),
                             scores=hardening_seed["scores_written"],
                             group_root=hardening_seed["group"]["root"][:12],
                             flags=ff.flags())
    yield
    logging_conf.log(log, "info", "shutting down")


app = FastAPI(
    title="Sealed Signals",
    version="0.2.0",
    description="A small trusted panel challenges and forecasts ACAPS risk analyses in one minute, "
                "behind a mask each expert chooses.",
    lifespan=lifespan,
)
# Business routes live on this router and are served under /api. The UI owns the root namespace:
# /desk, /ledger and /e/{token} are its pages, so they cannot also be API paths.
api = APIRouter()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https://.*\.zaindroid\.me",
    allow_methods=["*"],
    allow_headers=["*"],
)


def fixture(name: str) -> dict:
    path = FIX / name
    if not path.exists():
        raise HTTPException(501, f"not implemented yet; fixture {name} missing")
    return envelope(json.loads(path.read_text(encoding="utf-8")))


# -- platform contract ---------------------------------------------------------
@app.get("/health", tags=["platform"])
def health():
    """Deliberately dependency-free: no CSV read, no store walk."""
    return {"status": "ok", "service": "sealed-signals"}


@app.get("/ready", tags=["platform"])
def ready():
    try:
        n_risks = len(data.all_risks())
    except Exception as exc:  # noqa: BLE001 -- readiness reports, it does not raise
        logging_conf.log(log, "error", "readiness failed", error=type(exc).__name__)
        return JSONResponse({"status": "not_ready", "reason": "risk export unreadable"}, status_code=503)
    if not n_risks:
        return JSONResponse({"status": "not_ready", "reason": "risk export empty"}, status_code=503)
    return {"status": "ready", "n_risks": n_risks, "ui_built": UI_DIST.exists()}


@app.get("/version", tags=["platform"])
def version():
    return {"sha": SETTINGS.git_sha, "built": SETTINGS.built_at, "app": "sealed-signals",
            "api": app.version, "env": SETTINGS.app_env}


# -- radar and risks -----------------------------------------------------------
@api.get("/radar/status", tags=["risks"])
def radar_status():
    """Where every number on screen came from. The badges on the desk read straight off this."""
    csv_status = data.radar_status()
    api_status = acaps.status()
    return envelope({
        "risk_list": {
            "source": csv_status["source"],
            "fetched_at": csv_status["fetched_at"],
            "n": csv_status["n_risks"],
            "n_active": csv_status["n_active"],
            "api_n": api_status["api_risk_list"]["n"],
            "api_last_update": api_status["api_risk_list"]["last_update"],
            "note": api_status["api_risk_list"]["note"],
        },
        "editions": api_status["editions"],
        "token_present": api_status["token_present"],
        "probability_assumption": csv_status["probability_assumption"],
        # Kept so nothing that reads the flat shape breaks; the nested fields above are the contract.
        "source": csv_status["source"],
        "n_risks": csv_status["n_risks"],
        "n_active": csv_status["n_active"],
        "live_available": api_status["token_present"],
    })


@api.get("/radar/editions", tags=["radar"])
def radar_editions():
    months = acaps.available()
    return envelope({
        "datasets": [
            {
                "dataset": dataset,
                "months": month_list,
                "latest": month_list[-1] if month_list else None,
                "source": "api" if acaps.token_present() else "cache",
            }
            for dataset, month_list in months.items()
        ],
        "token_present": acaps.token_present(),
        "note": "Cached editions ship in data/acaps-api/ so this runs with no network. "
                "Set ACAPS_API_TOKEN to fetch live.",
    })


# -- crises --------------------------------------------------------------------
@api.get("/crises", tags=["radar"])
def crises(iso3: str | None = None, limit: int = 400):
    rows = list(acaps.crises().values())
    if iso3:
        wanted = iso3.strip().upper()
        rows = [c for c in rows if wanted in {code.upper() for code in c["iso3"]}]
    return envelope({"crises": rows[:limit], "n": len(rows)})


@api.get("/crises/{crisis_id}", tags=["radar"])
def crisis(crisis_id: str):
    found = acaps.crisis(crisis_id)
    if not found:
        raise HTTPException(404, f"no crisis {crisis_id} in the ACAPS registry")
    linked = [risk_id for risk_id, link in ALERTS.links.items() if link["crisis_id"] == crisis_id]
    suggested = [s["risk_id"] for s in alert_engine.suggest_links() if s["crisis_id"] == crisis_id]
    return envelope({
        **found,
        "linked_risks": linked,
        "suggested_risks": [r for r in suggested if r not in linked],
        "series": acaps.series(crisis_id),
        "access": acaps.access_by_month(crisis_id),
        "latest": acaps.severity_point(crisis_id, acaps.latest_month() or ""),
    })


# -- the risk alert engine -----------------------------------------------------
@api.post("/alerts/run", tags=["alerts"])
def alerts_run(body: dict = Body(default_factory=dict)):
    """Diff the two most recent cached editions (or those ending at month_to) for every crisis."""
    month_from, month_to = alert_engine.latest_pair(month_to=body.get("month_to"))
    if not month_from or not month_to:
        raise HTTPException(409, "at least two cached editions are needed before anything can be diffed")
    result = alert_engine.run(ALERTS, month_from, month_to)
    logging_conf.log(log, "info", "alert run", month_from=month_from, month_to=month_to,
                     n_events=len(result["events"]))
    return envelope(result)


@api.post("/alerts/replay", tags=["alerts"])
def alerts_replay(body: dict = Body(default_factory=dict)):
    """Reproduce a past month from the cached editions. The demo opens on Mar2026 -> Apr2026."""
    month_from = body.get("month_from") or "Mar2026"
    month_to = body.get("month_to") or "Apr2026"
    available = acaps.available().get(acaps.INFORM, [])
    missing = [m for m in (month_from, month_to) if m not in available]
    if missing:
        raise HTTPException(404, f"no cached edition for {', '.join(missing)}; have {available}")
    return envelope(alert_engine.run(ALERTS, month_from, month_to))


@api.get("/alerts", tags=["alerts"])
def list_alerts(status: str | None = None):
    rows = list(ALERTS.events.values())
    if status:
        rows = [e for e in rows if e["status"] == status]
    rows.sort(key=lambda e: (e["metric"] != "index", e["direction"] != "deterioration",
                             e["rank_this_month"]))
    return envelope({"events": rows, "n": len(rows), "rules": alert_engine.RULES})


@api.get("/alerts/{alert_id}", tags=["alerts"])
def get_alert(alert_id: str):
    found = ALERTS.events.get(alert_id)
    if not found:
        raise HTTPException(404, f"no alert {alert_id}")
    return envelope(found)


@api.post("/alerts/{alert_id}/pulse", status_code=201, tags=["alerts"])
async def alert_to_pulse(alert_id: str, body: dict = Body(default_factory=dict)):
    """The analyst approves an event. Only here does an alert become a question for the panel."""
    event = ALERTS.events.get(alert_id)
    if not event:
        raise HTTPException(404, f"no alert {alert_id}")
    if event["status"] == "dismissed":
        raise HTTPException(409, "this event was dismissed; a dismissed event never pulses")
    if event["status"] == "pulsed":
        raise HTTPException(409, f"already pulsed as {event['pulse_id']}")

    risk_id = body.get("risk_id") or event.get("risk_id")
    if not risk_id:
        raise HTTPException(422, "this event has no linked risk; confirm one with POST /risks/{id}/link")
    risk = data.get_risk(risk_id)
    if not risk:
        raise HTTPException(404, f"no risk {risk_id} in the export")

    pulse = _build_pulse(risk, "doorbell", body.get("question"), _alert_evidence(event))
    pulse["alert_id"] = alert_id
    event["status"] = "pulsed"
    event["pulse_id"] = pulse["id"]
    await publish("pulse_fired", {"pulse_id": pulse["id"], "risk_id": risk_id, "alert_id": alert_id})
    logging_conf.log(log, "info", "alert approved into a pulse", alert_id=alert_id,
                     pulse_id=pulse["id"], risk_id=risk_id)
    # Returned as the event itself: the UI reads status and pulse_id off the top level, and the
    # created pulse rides along under "pulse" for callers that want it.
    return envelope({**event, "pulse": pulse})


@api.post("/alerts/{alert_id}/dismiss", tags=["alerts"])
def dismiss_alert(alert_id: str, body: dict = Body(default_factory=dict)):
    event = ALERTS.events.get(alert_id)
    if not event:
        raise HTTPException(404, f"no alert {alert_id}")
    if event["status"] == "pulsed":
        raise HTTPException(409, "this event already became a pulse and cannot be dismissed")
    note = (body.get("note") or "").strip()
    if not note:
        raise HTTPException(422, "dismissing an event requires a note saying why")
    event["status"] = "dismissed"
    event["note"] = note
    event["dismissed_by"] = body.get("dismissed_by") or "analyst"
    event["dismissed_at"] = now()
    return envelope(event)


def _alert_evidence(event: dict) -> list[dict]:
    """The event's own numbers become the pulse's evidence line, so the expert sees what moved."""
    evidence = [{
        "source": "ACAPS INFORM Severity",
        # The edition fields the UI renders on an evidence line: which dataset, which crisis, which
        # two months, and where the move ranked. Without these it falls back to a bare value pair.
        "dataset": "inform-severity-index",
        "crisis_id": event["crisis_id"],
        "metric": event["metric"],
        "month_from": event["month_from"],
        "month_to": event["month_to"],
        "before": event["before"],
        "after": event["after"],
        "delta": event["delta"],
        "rank_this_month": event["rank_this_month"],
        "n_crises_this_month": event["n_crises_this_month"],
        "indicator": f"{event['metric']}:{event['crisis_id']}",
        "value": event["after"],
        "baseline": event["before"],
        "z": None,
        "url": "https://api.acaps.org/api/v1/inform-severity-index/",
        "note": (
            f"{event['crisis_name']}: {event['metric'].replace('_', ' ')} "
            f"{event['before']} to {event['after']} between {event['month_from']} and "
            f"{event['month_to']} ({event['rule_hit']}; rank {event['rank_this_month']} of "
            f"{event['n_crises_this_month']} crises this month; reliability {event['reliability']})"
        ),
    }]
    for name, pair in (event.get("components") or {}).items():
        if pair[0] is None or pair[1] is None or abs(pair[1] - pair[0]) < 0.3:
            continue
        evidence.append({
            "source": f"ACAPS {name.replace('_', ' ')}",
            "dataset": "inform-severity-index",
            "crisis_id": event["crisis_id"],
            "metric": name,
            "month_from": event["month_from"],
            "month_to": event["month_to"],
            "before": pair[0],
            "after": pair[1],
            "delta": round(pair[1] - pair[0], 2),
            "indicator": f"{name}:{event['crisis_id']}",
            "value": pair[1],
            "baseline": pair[0],
            "z": None,
            "url": "https://api.acaps.org/api/v1/inform-severity-index/",
            "note": f"{name.replace('_', ' ')} {pair[0]} to {pair[1]}",
        })
    return evidence


@api.post("/risks/{risk_id}/link", status_code=201, tags=["alerts"])
def link_risk(risk_id: str, body: dict = Body(default_factory=dict)):
    """The analyst confirms the risk-to-crisis link once. Suggestions are iso3 plus a driver keyword;
    a wrong link would put real ACAPS numbers behind the wrong question."""
    risk = data.get_risk(risk_id)
    if not risk:
        raise HTTPException(404, f"no risk {risk_id} in the export")
    crisis_id = body.get("crisis_id")
    if not crisis_id:
        raise HTTPException(422, "crisis_id is required")
    if not acaps.crisis(crisis_id):
        raise HTTPException(404, f"no crisis {crisis_id} in the ACAPS registry")
    link = alert_engine.confirm_link(ALERTS, risk_id, crisis_id, body.get("confirmed_by") or "analyst")
    return envelope(link)


@api.get("/risks/{risk_id}/link", tags=["alerts"])
def get_link(risk_id: str):
    confirmed = ALERTS.links.get(risk_id)
    suggestions = [s for s in alert_engine.suggest_links() if s["risk_id"] == risk_id]
    return envelope({"risk_id": risk_id, "confirmed": confirmed, "suggested": suggestions})


@api.get("/risks", tags=["risks"])
def risks(status: str = "Active", limit: int = 200):
    rows = data.active_risks() if status.lower() == "active" else data.all_risks()
    return envelope({"risks": rows[:limit], "n": len(rows), "filter": status})


@api.get("/risks/{risk_id}", tags=["risks"])
def risk(risk_id: str):
    found = data.get_risk(risk_id)
    if not found:
        raise HTTPException(404, f"no risk {risk_id} in the export")
    return envelope(found)


@api.post("/risks/{risk_id}/contract", status_code=201, tags=["risks"])
def freeze_contract(risk_id: str, body: dict = Body(default_factory=dict)):
    """A frozen question contract is required before any scoring (section 5)."""
    found = data.get_risk(risk_id)
    if not found:
        raise HTTPException(404, f"no risk {risk_id} in the export")
    required = ("event", "location", "horizon_deadline", "resolution_source", "adjudication_rule")
    missing = [field for field in required if not body.get(field)]
    if missing:
        raise HTTPException(422, f"a question contract needs: {', '.join(missing)}")
    contract = {**{field: body[field] for field in required}, "risk_id": risk_id, "frozen_at": now()}
    STORE.contracts[risk_id] = contract
    return envelope(contract)


# -- experts and panels --------------------------------------------------------
@api.post("/experts/apply", status_code=201, tags=["panel"])
def experts_apply(body: dict = Body(default_factory=dict)):
    expert = STORE.add_expert(Expert(
        id=f"X-{uuid.uuid4().hex[:8]}",
        geo_tags=body.get("geo_tags") or [],
        theme_tags=body.get("theme_tags") or [],
        affiliation_tag=body.get("affiliation_tag") or "ngo",
        languages=body.get("languages") or ["en"],
        channel=body.get("channel") or "email",
        status="applied",
        region=body.get("region") or "",
        synthetic=bool(body.get("synthetic", True)),
    ))
    # Identity details never sit in the expert record. They go into the encrypted registry, and
    # the only way back out is POST /committee/registry/read, which logs the read.
    identity = body.get("identity") or {}
    if identity:
        HARD.registry.put(expert.id, {
            key: str(value)[:200] for key, value in identity.items()
            if key in ("name", "email", "phone", "organisation", "country")
        })
    return envelope({"expert_id": expert.id, "status": expert.status,
                     "approvals_required": 2,
                     "identity_stored": bool(identity),
                     "identity_note": HARD.registry.status()["lock_line"] if identity else
                     "No identity details were sent, so none are held.",
                     "note": "Approval needs two admins before this expert can be matched to a panel."})


@api.post("/experts/{expert_id}/approve", status_code=201, tags=["panel"])
def approve_expert(expert_id: str, body: dict = Body(default_factory=dict)):
    """Committee approval. Two distinct admins are required, so one admin approving twice does not
    make a panel member -- the second call from the same admin is refused rather than counted."""
    expert = STORE.experts.get(expert_id)
    if not expert:
        raise HTTPException(404, f"no expert {expert_id}")
    admin = (body.get("admin") or "").strip()
    if not admin:
        raise HTTPException(422, "admin is required: an approval has to be attributable to someone")

    approvals = STORE.approvals.setdefault(expert_id, [])
    if admin in approvals:
        raise HTTPException(409, f"{admin} has already approved this expert; a second admin is needed")
    approvals.append(admin)

    credential_batch = None
    if len(approvals) >= 2 and expert.status != "approved":
        expert.status = "approved"
        # Section 6c item 3: the credential batch is minted on approval, not on answering, so the
        # committee never sees issuance and spending in the same moment.
        batch = HARD.credentials.issue(expert_id, body.get("panel_id") or "", None,
                                       int(body.get("allowance") or 3))
        credential_batch = {key: batch[key] for key in
                            ("batch_id", "n_issued", "scheme", "unlinkable", "note")}
    return envelope({
        "expert_id": expert_id,
        "status": expert.status,
        "approvals": approvals,
        "approvals_required": 2,
        "credential_issued": expert.status == "approved",
        "credential_batch": credential_batch,
        "note": "Approved experts can be matched to a panel."
        if expert.status == "approved"
        else f"{2 - len(approvals)} more approval(s) needed, from a different admin.",
    })


@api.get("/panels/match", tags=["panel"])
def panels_match(risk_id: str = "R1043"):
    """The best-matched approved experts, plus the composition check. Caps matter more than scores:
    a panel of eight from one organisation is not a panel."""
    found = data.get_risk(risk_id)
    if not found:
        raise HTTPException(404, f"no risk {risk_id} in the export")
    risk_themes = {theme for trigger in found["triggers"]
                   for theme in [_theme(trigger)] if theme}
    iso = {code.strip() for code in found["country_iso"].split(",")}
    approved = [e for e in STORE.experts.values() if e.status == "approved"]

    def score(expert: Expert) -> tuple[int, int]:
        return (len(set(expert.theme_tags) & risk_themes), len(set(expert.geo_tags) & iso))

    ranked = sorted(approved, key=lambda e: (-sum(score(e)), e.id))
    chosen: list[Expert] = []
    per_affiliation: dict[str, int] = {}
    for expert in ranked:
        if per_affiliation.get(expert.affiliation_tag, 0) >= 3:
            continue
        chosen.append(expert)
        per_affiliation[expert.affiliation_tag] = per_affiliation.get(expert.affiliation_tag, 0) + 1
        if len(chosen) == 8:
            break
    covered = {theme for expert in chosen for theme in expert.theme_tags}
    return envelope({
        "risk_id": risk_id,
        "panel_id": f"PAN-{found['country_iso'].split(',')[0].strip()}",
        "k_min": STORE.k_min,
        "experts": [{"expert_id": e.id, "pseudonym": pseudonym_for(e.id, SETTINGS.pseudonym_key),
                     "theme_tags": e.theme_tags, "geo_tags": e.geo_tags,
                     "affiliation_tag": e.affiliation_tag, "region": e.region,
                     # How well this expert fits: themes matched plus country matched, over what
                     # the risk asks for. Shown so a panel can be argued with, not just accepted.
                     "match": round(sum(score(e)) / max(1, len(risk_themes) + 1), 4),
                     "synthetic": e.synthetic} for e in chosen],
        "composition": {
            "max_per_affiliation": 3,
            "per_affiliation": per_affiliation,
            "theme_cover": sorted(covered & risk_themes),
            "themes_wanted": sorted(risk_themes),
            "themes_uncovered": sorted(risk_themes - covered),
            "gaps": sorted(risk_themes - covered),
            "geo_spread": sorted({e.region for e in chosen if e.region}),
            # The panel is only "ok" when it clears k_min, covers every theme the risk names, and
            # no single organisation holds more than three seats.
            "ok": (
                len(chosen) >= STORE.k_min
                and not (risk_themes - covered)
                and all(count <= 3 for count in per_affiliation.values())
            ),
        },
        "n_approved_available": len(approved),
    })


def _theme(trigger: dict) -> str | None:
    from .store import _theme_of_trigger
    return _theme_of_trigger(trigger)


# -- pulses --------------------------------------------------------------------
def _build_pulse(risk: dict, reason: str, question: str | None, evidence: list[dict]) -> dict:
    pulse_id = f"P-{len(STORE.pulses) + 1:04d}"
    # The default question must not name the ACAPS band. The card claims the rating is hidden until
    # submission, and a question that quotes it would anchor the answer it is trying to collect --
    # which is exactly what the blind round exists to prevent.
    blind_question = (
        "Is the level of concern on this risk still right, and what are we missing? "
        "You will see the current ACAPS rating as soon as you submit."
    )
    pulse = {
        "id": pulse_id,
        "risk_id": risk["risk_id"],
        "panel_id": f"PAN-{risk['country_iso'].split(',')[0].strip()}",
        "fired_at": now(),
        "reason": reason,
        "round": 1,
        "evidence": evidence,
        "question": question or blind_question,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(timespec="seconds"),
        "n_answers": 0,
    }
    STORE.pulses[pulse_id] = pulse
    return pulse


@api.post("/pulses", status_code=201, tags=["pulse"])
async def create_pulse(body: dict = Body(default_factory=dict)):
    risk_id = body.get("risk_id") or "R1043"
    found = data.get_risk(risk_id)
    if not found:
        raise HTTPException(404, f"no risk {risk_id} in the export")
    pulse = _build_pulse(found, body.get("reason") or "analyst", body.get("question"),
                         body.get("evidence") or _trigger_evidence(found))
    await publish("pulse_fired", {"pulse_id": pulse["id"], "risk_id": risk_id})
    logging_conf.log(log, "info", "pulse fired", pulse_id=pulse["id"], risk_id=risk_id,
                     reason=pulse["reason"])
    return envelope(pulse)


def _trigger_evidence(risk: dict) -> list[dict]:
    """ACAPS's own trigger completion rate is the honest default signal: a published judgement,
    not a number we invented. z is reported as null because a single reading has no baseline."""
    evidence = []
    for trigger in risk["triggers"]:
        if trigger.get("completion_rate") is None:
            continue
        evidence.append({
            # A completion rate is a single published percentage: it has no baseline and no z-score.
            # Sending baseline 0 made every renderer print "40 versus 0 baseline", which reads as a
            # comparison that was never made. The statement goes in the label instead.
            "source": f"{trigger['title']} - {trigger['completion_rate']}% complete",
            "indicator": f"trigger_completion:{trigger['id']}",
            "value": trigger["completion_rate"],
            "baseline": None,
            "z": None,
            "url": (trigger.get("sources") or [{}])[0].get("url", "https://www.acaps.org/en/countries"),
            "note": trigger["title"],
        })
    return evidence


@api.get("/pulses/{pulse_id}", tags=["pulse"])
def get_pulse(pulse_id: str):
    pulse = STORE.pulses.get(pulse_id)
    if not pulse:
        raise HTTPException(404, f"no pulse {pulse_id}")
    return envelope({**pulse, "n_answers": STORE.n_answers(pulse_id)})


@api.post("/pulses/doorbell/run", tags=["pulse"])
async def doorbell_run(threshold: int = 40, fire: bool = False):
    """One pass of the detector over the open triggers of active risks. It watches the risk's own
    triggers, not a generic news feed, which is the whole point of the doorbell."""
    shifts, fired = [], []
    for risk in data.active_risks():
        for trigger in risk["triggers"]:
            rate = trigger.get("completion_rate")
            if rate is None or rate < threshold:
                continue
            shifts.append({
                "risk_id": risk["risk_id"], "country": risk["country"],
                "trigger_id": trigger["id"], "acaps_trigger_id": trigger.get("acaps_trigger_id"),
                "title": trigger["title"], "completion_rate": rate,
                "acaps_probability": risk.get("probability_acaps"),
            })
    shifts.sort(key=lambda s: s["completion_rate"], reverse=True)
    if fire:
        for shift in shifts[:3]:
            risk = data.get_risk(shift["risk_id"])
            pulse = _build_pulse(risk, "doorbell", None, _trigger_evidence(risk))
            fired.append({"pulse_id": pulse["id"], "risk_id": risk["risk_id"]})
            await publish("pulse_fired", {"pulse_id": pulse["id"], "risk_id": risk["risk_id"]})
    return envelope({"threshold": threshold, "shifts": shifts, "pulses_fired": fired,
                     "n_shifts": len(shifts),
                     "note": "Signal is the ACAPS trigger completion rate. Pass fire=true to open pulses."})


@api.get("/pulses/{pulse_id}/tray", tags=["pulse"])
def tray(pulse_id: str):
    """Sealed envelopes: commitment and time, never a value. This is what the desk may show
    before the reveal."""
    if pulse_id not in STORE.pulses:
        raise HTTPException(404, f"no pulse {pulse_id}")
    envelopes = STORE.tray(pulse_id)
    return envelope({"pulse_id": pulse_id, "n_answers": len(envelopes), "k_min": STORE.k_min,
                     "revealable": len(envelopes) >= STORE.k_min, "envelopes": envelopes})


# -- the expert card -----------------------------------------------------------
@api.get("/e/{token}", tags=["expert"])
def card(token: str):
    resolved = STORE.resolve_token(token)
    if not resolved:
        raise HTTPException(404, "this link is not valid; ask the analyst for a new one")
    pulse_id, expert_id = resolved
    pulse = STORE.pulses.get(pulse_id)
    if not pulse:
        raise HTTPException(404, f"no pulse {pulse_id}")
    risk = data.get_risk(pulse["risk_id"]) or {}
    rnd = 2 if pulse_id in STORE.results else 1
    group_view = None
    if rnd == 2:
        result = STORE.results[pulse_id]
        group_view = {"mean": result["mean"], "distribution": result["distribution"],
                      "spread": result["spread"], "n": result["n"]}
    # The rating is withheld in round 1 so it cannot anchor a first, independent answer. Round 2 is
    # the opposite by design (section 8): it is the informed round, and it shows ACAPS's rating and
    # the group alongside it. Hiding it there would withhold the very evidence round 2 exists to add.
    answered = STORE.answered(pulse_id, expert_id)
    blind = rnd == 1 and not answered
    public_risk = {key: value for key, value in risk.items()
                   if key not in ("probability_acaps", "level", "probability_assumed_number")}
    return envelope({
        "pulse": {**pulse, "n_answers": STORE.n_answers(pulse_id)},
        "risk": public_risk if blind else risk,
        "round": rnd,
        "group_view_if_round2": group_view,
        "already_answered": answered,
        "mask_options": list(("known", "pseudonym", "anonymous")),
        "mask_note": "Distinctive wording can be recognised by peers even under a pseudonym.",
        "stances": ["estimate", "outside_my_expertise", "not_enough_evidence"],
        "source_tags": ["saw", "read", "heard"],
        "accuracy_prompt": "Is this something you saw, read, or heard?",
        "elicitation": "What share of this panel will put the probability above 0.5?",
        "rating_hidden_until_submission": blind,
        "blind": blind,
    })


def _spend_credential(body: dict, pulse_id: str, expert_id: str) -> dict:
    """Section 6c item 3 on the answering side.

    A card that presents a credential spends it, and a second spend of the same token is refused.
    A card that presents none still answers -- the magic link already gates this round -- and when
    the mask is anonymous the server mints and spends one itself so the flow is complete on stage.
    That fallback is linkable by construction, and the response says so rather than borrowing the
    unlinkability claim it has not earned."""
    presented = body.get("credential") or {}
    mask = body.get("mask", "pseudonym")
    if not ff.enabled("FF_BLIND"):
        return {"spent": False, "scheme": "hmac",
                "line": "FF_BLIND is off: no credential was involved in this answer."}
    if presented:
        try:
            record = HARD.credentials.spend(presented.get("token_id") or "",
                                            presented.get("signature") or "", pulse_id)
        except ValueError as exc:
            raise HTTPException(409, str(exc)) from exc
        return {"spent": True, "unlinkable": True, "scheme": record["scheme"],
                "line": "Answered with a one-time vetted credential. The committee can check it "
                        "was issued to an approved expert and cannot tell which one."}
    if mask != "anonymous":
        return {"spent": False,
                "line": "No credential on this answer: the magic link identified the round, and "
                        "this mask does not ask for unlinkability."}
    batch = HARD.credentials.issue(expert_id, "", None, 1)
    token = batch["credentials"][0]
    HARD.credentials.spend(token["token_id"], token["signature"], pulse_id)
    return {"spent": True, "unlinkable": False, "scheme": batch["scheme"],
            "line": "Answered with a one-time vetted credential, minted here because the card did "
                    "not bring its own. Single-use holds; unlinkability does not on this path."}


def _check_zk(body: dict, pulse_id: str) -> dict | None:
    """Section 6c item 4. Off by default, and when it is on the verdict says what went unchecked."""
    proof = body.get("zk_proof")
    if not proof:
        return None
    if not ff.enabled("FF_ZK"):
        raise HTTPException(409, "FF_ZK is off on this build, so no membership proof is accepted. "
                                 "The reason is in GET /api/zk/status: the Groth16 verifier is not "
                                 "implemented here.")
    verdict = HARD.membership.verify(proof, pulse_id)
    if not verdict["accepted"]:
        raise HTTPException(409, {"message": "this membership proof was not accepted", **verdict})
    return verdict


@api.post("/e/{token}/answer", status_code=201, tags=["expert"])
async def answer(token: str, body: dict = Body(default_factory=dict)):
    resolved = STORE.resolve_token(token)
    if not resolved:
        raise HTTPException(404, "this link is not valid; ask the analyst for a new one")
    pulse_id, expert_id = resolved
    if pulse_id in STORE.results and int(body.get("round", 1)) == 1:
        raise HTTPException(409, "round 1 is closed on this pulse; this link now opens round 2")
    credential_result = _spend_credential(body, pulse_id, expert_id)
    zk_result = _check_zk(body, pulse_id)
    try:
        sealed = STORE.seal(pulse_id, expert_id, body, SETTINGS.commitment_salt, SETTINGS.pseudonym_key)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    STORE.mark_used(token)
    _record_day_roots()
    await publish("answer_sealed", {"pulse_id": pulse_id, "n_answers": STORE.n_answers(pulse_id)})
    logging_conf.log(log, "info", "answer sealed", pulse_id=pulse_id, mask=sealed.mask,
                     n_answers=STORE.n_answers(pulse_id))
    risk = data.get_risk(STORE.pulses[pulse_id]["risk_id"]) or {}
    return envelope({
        "committed_at": sealed.committed_at,
        "commitment": sealed.commitment,
        "mask": sealed.mask,
        "pseudonym": sealed.pseudonym,
        "message": "Submitted. You will get the group outcome when this resolves.",
        "sealing_note": "The commitment proves when you answered and that you have not changed it. "
                        "It does not hide your answer from the operator of this service.",
        "acaps_rating_now_visible": {"probability_acaps": risk.get("probability_acaps"),
                                     "level": risk.get("level")},
        "credential": credential_result,
        "zk": zk_result,
        "anchor": HARD.anchors.for_day(sealed.committed_at[:10]),
    })


# -- reveal and aggregate ------------------------------------------------------
@api.post("/pulses/{pulse_id}/reveal", tags=["round"])
async def reveal(pulse_id: str):
    pulse = STORE.pulses.get(pulse_id)
    if not pulse:
        raise HTTPException(404, f"no pulse {pulse_id}")
    risk = data.get_risk(pulse["risk_id"]) or {}
    try:
        result = STORE.reveal(pulse_id, risk)
    except TooFew as exc:
        raise HTTPException(409, str(exc)) from exc
    await publish("round_revealed", {"pulse_id": pulse_id})
    logging_conf.log(log, "info", "round revealed", pulse_id=pulse_id, n=result["n"])
    return envelope(_public_result(result))


@api.get("/pulses/{pulse_id}/result", tags=["round"])
def result(pulse_id: str):
    found = STORE.results.get(pulse_id)
    if not found:
        raise HTTPException(404, f"pulse {pulse_id} has not been revealed")
    return envelope(_public_result(found))


def _public_result(result: dict) -> dict:
    """Integrity notes are moderator-only and are stripped here (section 4)."""
    return {key: value for key, value in result.items() if key != "integrity_notes"}


@api.get("/integrity/{pulse_id}", tags=["round"])
def integrity(pulse_id: str):
    found = STORE.results.get(pulse_id)
    if not found:
        raise HTTPException(404, f"pulse {pulse_id} has not been revealed")
    return envelope({
        "pulse_id": pulse_id,
        "integrity_notes": found.get("integrity_notes", []),
        "moderator_only": True,
        "note": "Descriptions, not diagnoses. Nothing here penalises an expert automatically.",
    })


# -- draft and decision --------------------------------------------------------
@api.post("/pulses/{pulse_id}/draft", tags=["draft"])
def make_draft(pulse_id: str):
    pulse = STORE.pulses.get(pulse_id)
    found = STORE.results.get(pulse_id)
    if not pulse:
        raise HTTPException(404, f"no pulse {pulse_id}")
    if not found:
        raise HTTPException(409, "reveal the round before drafting from it")
    risk = data.get_risk(pulse["risk_id"]) or {}
    built = draft_builder.build(risk, pulse, found)
    STORE.drafts[built["id"]] = built
    return envelope(built)


@api.post("/drafts/{draft_id}/decision", tags=["draft"])
async def decide(draft_id: str, body: dict = Body(default_factory=dict)):
    found = STORE.drafts.get(draft_id)
    if not found:
        raise HTTPException(404, f"no draft {draft_id}")
    action = body.get("action")
    if action not in ("accept", "edit", "reject"):
        raise HTTPException(422, "action must be accept, edit or reject")
    if action == "reject" and not body.get("note"):
        raise HTTPException(422, "rejecting the panel's view requires a rationale; it goes on the public ledger")

    # The UI sends these nested under decision_use; earlier callers send them flat. Accept both.
    use = {**(body.get("decision_use") or {})}
    for field in ("what_decision", "for_whom", "by_when"):
        use.setdefault(field, body.get(field))
    for field in ("what_decision", "for_whom", "by_when"):
        if action in ("accept", "edit") and not use.get(field):
            raise HTTPException(422, f"an accepted update needs {field}: what decision, for whom, by when")
    body = {**body, **use}

    found["status"] = {"accept": "accepted", "edit": "edited", "reject": "rejected"}[action]
    found["decided_by"] = body.get("decided_by") or "analyst"
    found["decided_at"] = now()
    found["note"] = body.get("note")
    if action == "edit" and body.get("edited_probability"):
        found["proposed_probability"] = body["edited_probability"]

    result = STORE.results[found["pulse_id"]]
    answers = STORE.answers.get(found["pulse_id"], [])
    entry = {
        "risk_id": found["risk_id"],
        "pulse_id": found["pulse_id"],
        "sealed_at": min((a.committed_at for a in answers), default=now()),
        "group_probability": result["mean"],
        "acaps_probability": found.get("acaps_probability"),
        "acaps_level": found.get("acaps_level"),
        "proposed_probability": found["proposed_probability"],
        "decision": found["status"],
        "outcome": None,
        "resolved_at": None,
        "verify_hash": round_verify_hash([a.commitment for a in answers]),
        "honesty": draft_builder.honesty_box(result, found, {**body, "action": action}),
    }
    STORE.ledger = [e for e in STORE.ledger if e["pulse_id"] != entry["pulse_id"]] + [entry]
    await publish("draft_decided", {"draft_id": draft_id, "action": action})
    logging_conf.log(log, "info", "draft decided", draft_id=draft_id, action=action)
    return envelope({**found, "ledger_entry": entry})


# -- ledger --------------------------------------------------------------------
@api.get("/ledger", tags=["ledger"])
def ledger():
    return envelope({"entries": list(reversed(STORE.ledger)), "k_min": STORE.k_min,
                     "note": "Group views only. No names, and nothing about any individual."})


@api.get("/ledger/{risk_id}", tags=["ledger"])
def ledger_for(risk_id: str):
    entries = [e for e in STORE.ledger if e["risk_id"].lower() == risk_id.lower()]
    if not entries:
        raise HTTPException(404, f"nothing sealed for {risk_id} yet")
    return envelope({"entries": entries, "k_min": STORE.k_min})


@api.post("/ledger/verify", tags=["ledger"])
def verify(body: dict = Body(default_factory=dict)):
    wanted = (body.get("verify_hash") or "").strip().lower()
    for entry in STORE.ledger:
        if entry["verify_hash"].lower() == wanted:
            answers = STORE.answers.get(entry["pulse_id"], [])
            recomputed = round_verify_hash([a.commitment for a in answers])
            _record_day_roots()
            attestation = HARD.attestations.latest(entry["risk_id"])
            day = answers[0].committed_at[:10] if answers else None
            anchor = HARD.anchors.for_day(day) if day else None
            return envelope({
                "valid": recomputed == entry["verify_hash"],
                "sealed_at": entry["sealed_at"],
                "checked": "sha256 of this round's sorted answer commitments, recomputed now",
                "checked_means": "The sealed set has not changed since it was published.",
                "n_commitments": len(answers),
                "attestation": attestation,
                "attestation_verification": (
                    HARD.attestations.verify(attestation) if attestation else None
                ),
                "attestation_means": (
                    "The outcome record was issued by the committee key and has not been altered."
                    if attestation else
                    "No attestation yet: this risk is not resolved, so there is no outcome to sign."
                ),
                "anchor": anchor,
                "anchor_means": (
                    (anchor or {}).get("means")
                    if anchor else "No daily root recorded for this round."
                ),
                "note": "Three separate checks, three separate meanings. The hash proves the set "
                        "is unchanged. The signature proves who issued the outcome record. The "
                        "anchor proves timing, and only once its status reads anchored.",
            })
    raise HTTPException(404, "no ledger entry carries that hash")


# -- outcome, scoring, calibration ---------------------------------------------
@api.post("/risks/{risk_id}/resolve", tags=["outcome"])
async def resolve(risk_id: str, body: dict = Body(default_factory=dict)):
    outcome = body.get("outcome")
    if outcome not in ("materialised", "not_materialised"):
        raise HTTPException(422, "outcome must be materialised or not_materialised")
    if risk_id not in STORE.contracts:
        raise HTTPException(409, "freeze the question contract before resolving; otherwise the score "
                                 "is settled against a question nobody agreed to")
    entries = [e for e in STORE.ledger if e["risk_id"].lower() == risk_id.lower()]
    if not entries:
        raise HTTPException(404, f"nothing sealed for {risk_id} yet")
    resolved_at = body.get("resolved_at") or now()
    truth = 1.0 if outcome == "materialised" else 0.0
    written = 0
    for entry in entries:
        entry["outcome"] = outcome
        entry["resolved_at"] = resolved_at
        group = entry.get("group_probability")
        if group is not None:
            entry["honesty"]["panel_hit_rate"] = 1.0 if round(group) == truth else 0.0
            entry["honesty"]["misses"] = 0 if round(group) == truth else 1
        for answer in STORE.answers.get(entry["pulse_id"], []):
            if answer.probability is None:
                continue
            brier = round((answer.probability - truth) ** 2, 4)
            STORE.scores.append({
                "expert_internal_id": answer.expert_id or "anonymous",
                "risk_id": risk_id, "brier": brier, "resolved_at": resolved_at,
            })
            expert = STORE.experts.get(answer.expert_id)
            if expert:
                # Weights move slowly and stay capped; one round never makes a super-estimator.
                expert.weight = max(0.5, min(2.0, expert.weight + (0.25 - brier)))
                written += 1
    # Section 6c item 2: sign the record, not the truth. The commitment root ties the signature to
    # the exact set of sealed answers this outcome settles.
    commitment_root = anchor_lib.merkle_root(
        [a.commitment for entry in entries for a in STORE.answers.get(entry["pulse_id"], [])]
    )
    attestation = HARD.attestations.attest(risk_id.upper(), outcome, resolved_at, commitment_root)
    for entry in entries:
        entry["attestation"] = {key: attestation[key] for key in
                                ("scheme", "key_id", "signature", "commitment_root")}
    await publish("risk_resolved", {"risk_id": risk_id, "outcome": outcome})
    return envelope({"scores_written": written, "weights_updated": written,
                     "outcome": outcome, "resolved_at": resolved_at,
                     "attestation": attestation,
                     "attestation_public_key": HARD.attestations.public_key(),
                     "scored_against": "the export's Probability band, never Risk Level"})


@api.get("/pulses/{pulse_id}/outcome-report", tags=["outcome"])
def outcome_report(pulse_id: str):
    found = STORE.results.get(pulse_id)
    if not found:
        raise HTTPException(404, f"pulse {pulse_id} has not been revealed")
    entry = next((e for e in STORE.ledger if e["pulse_id"] == pulse_id), None)
    decided = next((d for d in STORE.drafts.values() if d["pulse_id"] == pulse_id), {})
    return envelope({
        "pulse_id": pulse_id,
        "group_mean": found["mean"],
        "outcome": (entry or {}).get("outcome"),
        "analyst_decision_summary": (
            f"{decided.get('status', 'no decision yet')}"
            + (f": {decided.get('note')}" if decided.get("note") else "")
        ),
        "note": "Sent to everyone who answered, whatever mask they chose.",
    })


@api.get("/me/{token}/calibration", tags=["outcome"])
def calibration(token: str):
    resolved = STORE.resolve_token(token)
    if not resolved:
        raise HTTPException(404, "this link is not valid")
    _, expert_id = resolved
    mine = [s for s in STORE.scores if s["expert_internal_id"] == expert_id]
    if len(mine) < 5:
        raise HTTPException(404, f"a calibration report opens after 5 resolved risks; you have {len(mine)}")
    briers = [s["brier"] for s in mine]
    expert = STORE.experts.get(expert_id)
    return envelope({
        "pseudonym": pseudonym_for(expert_id, SETTINGS.pseudonym_key),
        "n_resolved": len(mine),
        "mean_brier": round(sum(briers) / len(briers), 4),
        "reliability_weight": round(expert.weight, 4) if expert else 1.0,
        "note": "Private and opt-in. Nobody else sees this.",
    })


@api.get("/analyst/board", tags=["desk"])
def board():
    by_expert: dict[str, list[float]] = {}
    for score in STORE.scores:
        by_expert.setdefault(score["expert_internal_id"], []).append(score["brier"])
    supers = []
    for expert_id, briers in by_expert.items():
        if len(briers) < 5:
            continue   # no track record, no board entry
        expert = STORE.experts.get(expert_id)
        supers.append({
            "pseudonym": pseudonym_for(expert_id, SETTINGS.pseudonym_key),
            "n": len(briers),
            "mean_brier": round(sum(briers) / len(briers), 4),
            "weight": round(expert.weight, 4) if expert else 1.0,
        })
    supers.sort(key=lambda row: row["mean_brier"])
    divergence = []
    for entry in STORE.ledger:
        acaps = data.band_to_number(entry.get("acaps_probability"))
        if entry.get("group_probability") is not None and acaps is not None:
            divergence.append({"risk_id": entry["risk_id"], "panel": entry["group_probability"],
                               "acaps": acaps})
    return envelope({"super_estimators": supers, "divergence": divergence,
                     "note": "A board entry needs 5 resolved risks. Empty is the honest state early on."})


@api.get("/sim/proof", tags=["desk"])
def proof():
    path = ROOT / "reports" / "proof.json"
    if not path.exists():
        raise HTTPException(404, "run `make demo` to write reports/proof.json first")
    return envelope(json.loads(path.read_text(encoding="utf-8")))


# -- events --------------------------------------------------------------------
@api.get("/events", tags=["desk"])
async def events(request: Request):
    queue: asyncio.Queue = asyncio.Queue(maxsize=64)
    _subscribers.add(queue)

    async def stream():
        try:
            yield "event: hello\ndata: {}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event, payload = await asyncio.wait_for(queue.get(), timeout=15)
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
                    continue
                yield f"event: {event}\ndata: {json.dumps(payload, separators=(',', ':'))}\n\n"
        finally:
            _subscribers.discard(queue)

    return StreamingResponse(stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# -- demo helpers --------------------------------------------------------------
@api.get("/demo/links", tags=["desk"])
def demo_links():
    """The magic links for the seeded synthetic panel, so the desk can open a card on stage."""
    rows = []
    for token, (pulse_id, expert_id) in STORE.tokens.items():
        expert = STORE.experts.get(expert_id)
        rows.append({"token": token, "pulse_id": pulse_id,
                     "pseudonym": pseudonym_for(expert_id, SETTINGS.pseudonym_key),
                     "region": expert.region if expert else "",
                     "answered": STORE.answered(pulse_id, expert_id),
                     "card_url": f"/e/{token}"})
    return envelope({"links": rows, "synthetic": True,
                     "note": "Synthetic experts. Real panels get these by email magic link."})


# -- hardening stack: sections 6c and 6d ---------------------------------------
def _commitments_by_day() -> dict[str, list[str]]:
    days: dict[str, list[str]] = {}
    for answers in STORE.answers.values():
        for answer in answers:
            days.setdefault(answer.committed_at[:10], []).append(answer.commitment)
    return days


def _record_day_roots() -> None:
    """Keep the daily Merkle roots in step with the sealed commitments. Cheap, and it means the
    ledger can always show a root for the day a round was sealed, submitted or not."""
    for day, commitments in _commitments_by_day().items():
        HARD.anchors.record(day, commitments)


def _expert_by_pseudonym(pseudonym: str) -> str | None:
    wanted = (pseudonym or "").strip().lower()
    for expert_id in STORE.experts:
        if pseudonym_for(expert_id, SETTINGS.pseudonym_key).lower() == wanted:
            return expert_id
    return None


def _acaps_probability(risk_id: str) -> float | None:
    risk = data.get_risk(risk_id) or {}
    return risk.get("probability_assumed_number")


def _pattern_report(expert_id: str) -> dict:
    return pattern_lib.report(
        STORE, expert_id, pseudonym_for(expert_id, SETTINGS.pseudonym_key),
        acaps_probability=_acaps_probability,
        pseudonym_of=lambda other: pseudonym_for(other, SETTINGS.pseudonym_key),
    )


@api.get("/trust/status", tags=["trust"])
def trust_status():
    """Everything the product needs to describe the hardening stack, including the exact
    guarantee / does-not wording. One source, so the UI and the slides cannot drift."""
    return envelope(HARD.status())


@api.get("/registry/status", tags=["trust"])
def registry_status():
    return envelope(HARD.registry.status())


@api.get("/committee/access-log", tags=["trust"])
def committee_access_log():
    """Mechanism 6. Reading an identity is allowed and logged; the log is the control."""
    return envelope({
        "entries": list(reversed(HARD.registry.log())),
        "n": len(HARD.registry.access_log),
        "guarantees": (ff.mechanism("access_log") or {}).get("guarantees"),
        "does_not": (ff.mechanism("access_log") or {}).get("does_not"),
    })


@api.post("/committee/registry/read", tags=["trust"])
def committee_registry_read(body: dict = Body(default_factory=dict)):
    """The only way to open an identity. Refuses an unattributed read, and logs every one."""
    expert_id = (body.get("expert_id") or "").strip()
    if expert_id not in STORE.experts:
        raise HTTPException(404, f"no expert {expert_id}")
    try:
        identity = HARD.registry.read(expert_id, body.get("who") or "", body.get("why") or "")
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    if identity is None:
        raise HTTPException(404, f"no identity on file for {expert_id}")
    return envelope({"expert_id": expert_id, "identity": identity,
                     "logged": HARD.registry.log()[-1],
                     "note": "This read is now in the committee access log, permanently."})


@api.get("/credentials/issuer", tags=["trust"])
def credential_issuer():
    """The issuer public key, so a client can blind its own tokens and keep them unlinkable."""
    return envelope({
        **HARD.credentials.public_key(),
        "how": "Encode the message 'sealed-signals/credential/v1:<token_id>' with EMSA-PSS "
               "(SHA-384, zero salt), blind it with r^e mod n, send the hex to "
               "POST /api/credentials/issue as `blinded`, then unblind with r^-1.",
    })


@api.post("/credentials/issue", status_code=201, tags=["trust"])
def credentials_issue(body: dict = Body(default_factory=dict)):
    """Mechanism 3. Committee-side blind signing of a batch for an approved expert."""
    expert_id = (body.get("expert_id") or "").strip()
    expert = STORE.experts.get(expert_id)
    if not expert:
        raise HTTPException(404, f"no expert {expert_id}")
    if expert.status != "approved":
        raise HTTPException(409, "credentials are issued on approval; this expert is "
                                 f"{expert.status}")
    blinded = body.get("blinded") or None
    count = int(body.get("count") or 0)
    if not blinded and count <= 0:
        raise HTTPException(422, "send `blinded` (preferred: you keep the unlinkability) or "
                                 "`count` for the demo path")
    if count > 32:
        raise HTTPException(422, "32 tokens is the ceiling on one batch")
    issued = HARD.credentials.issue(expert_id, body.get("panel_id") or "", blinded, count)
    logging_conf.log(log, "info", "credentials issued", expert_id=expert_id,
                     n=issued["n_issued"], unlinkable=issued["unlinkable"])
    return envelope({**issued,
                     "guarantees": (ff.mechanism("blind_credentials") or {}).get("guarantees"),
                     "does_not": (ff.mechanism("blind_credentials") or {}).get("does_not")})


@api.get("/credentials/status", tags=["trust"])
def credentials_status():
    """Counts only: issued, spent, and the fact that nothing joins the two."""
    return envelope(HARD.credentials.summary())


@api.get("/ledger/{risk_id}/attestation", tags=["trust"])
def ledger_attestation(risk_id: str):
    """Mechanism 2. The signature over the resolved outcome record, and its verification."""
    record = HARD.attestations.latest(risk_id)
    if not record:
        raise HTTPException(404, f"{risk_id.upper()} has no attestation: it is not resolved yet")
    anchor = HARD.anchors.receipt_for_commitment(record.get("commitment_root") or "")
    return envelope({
        "attestation": record,
        "verification": HARD.attestations.verify(record),
        "public_key": HARD.attestations.public_key(),
        "anchor": anchor,
        "history": HARD.attestations.for_risk(risk_id),
    })


@api.get("/anchors", tags=["trust"])
def anchors_list():
    """Mechanism 5. Daily commitment roots, with status anchored or pending, and the receipt."""
    _record_day_roots()
    return envelope({
        "roots": HARD.anchors.all(),
        "calendars": list(anchor_lib.CALENDARS),
        "enabled": ff.enabled("FF_ANCHOR"),
        "guarantees": (ff.mechanism("anchoring") or {}).get("guarantees"),
        "does_not": (ff.mechanism("anchoring") or {}).get("does_not"),
    })


@api.post("/anchors/{day}/submit", tags=["trust"])
def anchor_submit(day: str):
    _record_day_roots()
    try:
        root = HARD.anchors.submit(day)
    except KeyError as exc:
        raise HTTPException(404, f"no commitments recorded on {day}") from exc
    logging_conf.log(log, "info", "anchor submitted", day=day, status=root.status)
    return envelope(root.as_dict())


@api.post("/anchors/{day}/upgrade", tags=["trust"])
def anchor_upgrade(day: str):
    """Ask the calendar whether the root has made it into a block yet. Usually: not yet."""
    try:
        root = HARD.anchors.upgrade(day)
    except KeyError as exc:
        raise HTTPException(404, f"no root recorded on {day}") from exc
    return envelope(root.as_dict())


@api.get("/zk/status", tags=["trust"])
def zk_status():
    """Mechanism 4, including the part this build does not do. Read `proof_verifier`."""
    return envelope(HARD.membership.status())


@api.get("/committee/patterns/{pseudonym}", tags=["trust"])
def committee_patterns(pseudonym: str):
    """Section 6d, committee side. Pseudonyms in, pseudonyms out: no names anywhere in here."""
    expert_id = _expert_by_pseudonym(pseudonym)
    if not expert_id:
        raise HTTPException(404, f"no panel member answers to {pseudonym}")
    return envelope(_pattern_report(expert_id))


@api.get("/committee/patterns", tags=["trust"])
def committee_patterns_all():
    """Every report that has opened. Experts below the floor are listed as not available, with
    their count, so the committee sees the floor working rather than an empty page."""
    reports, waiting = [], []
    for expert_id in STORE.experts:
        found = _pattern_report(expert_id)
        (reports if found["available"] else waiting).append(found)
    return envelope({
        "reports": sorted(reports, key=lambda r: r["pseudonym"]),
        "not_yet": sorted(({"pseudonym": r["pseudonym"], "n_pulses": r["n_pulses"]}
                           for r in waiting), key=lambda r: r["pseudonym"]),
        "min_pulses": pattern_lib.MIN_PULSES,
        "never": pattern_lib.NEVER,
    })


@api.get("/me/{token}/patterns", tags=["trust"])
def my_patterns(token: str, opt_in: bool = False):
    """Section 6d, expert side. Opt-in, so nobody is handed a reading of themselves unasked."""
    resolved = STORE.resolve_token(token)
    if not resolved:
        raise HTTPException(404, "this link is not valid")
    _, expert_id = resolved
    if not opt_in:
        raise HTTPException(409, "this report is opt-in. Add ?opt_in=true to ask for it. It is "
                                 "never shown to anyone else as a score and never affects your "
                                 "place on a panel.")
    return envelope({**_pattern_report(expert_id), "private": True,
                     "note_to_you": "Yours alone. The committee sees the same sentences under "
                                    "your pseudonym, and nothing else."})


# -- the built UI --------------------------------------------------------------
app.include_router(api, prefix="/api")


@app.get("/", include_in_schema=False)
def root():
    if not UI_DIST.exists():
        return RedirectResponse("/docs")
    return FileResponse(UI_DIST / "index.html")


if UI_DIST.exists():
    class SinglePageApp(StaticFiles):
        """Serve index.html for any path the build has no file for, so /app/desk and /app/e/<token>
        survive a reload or a shared link. StaticFiles(html=True) alone does not do this: it falls
        back to 404.html, and serves index.html only for a directory path."""

        async def get_response(self, path: str, scope):  # type: ignore[override]
            try:
                return await super().get_response(path, scope)
            except StarletteHTTPException as exc:
                if exc.status_code == 404:
                    return await super().get_response("index.html", scope)
                raise

    app.mount("/", SinglePageApp(directory=str(UI_DIST), html=True), name="ui")
