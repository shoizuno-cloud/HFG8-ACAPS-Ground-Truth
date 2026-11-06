# After the hackathon: ranked features

Lane C. Ranked by value to ACAPS and risk of failure, highest first. Each item names the stakeholder it serves and what would have to be true. Order may change after the December pilot.

| Rank | Feature | Stakeholder served | Why this rank | What must be true |
|---|---|---|---|---|
| 1 | Pilot with real experts and a live committee: approvals, tagging, panel composition rules on real people | Committee, experts | Everything else depends on real experts joining and staying | ACAPS approves 8 or more experts for one country; consent text and data terms agreed |
| 2 | Resolution criterion per question, drafted by the system and approved by the analyst (from the trigger's quantitative objective) | Analysts, readers | Scoring is only fair if "materialised" is clear. See proposals P2. | ACAPS agrees who decides "materialised" and on what evidence (question 3) |
| 3 | French, then Arabic, for the card, email and consent text | Experts | The brief names French as a working language; field experts answer faster in their own language | Native-speaker review of every string |
| 4 | Retention loop: "how it resolved" notes, lapsed-expert re-invite, quiet cadence rules | Experts, committee | Expert pools lose people after launch [brief] | Pilot data on week-8 participation; no engagement metrics added |
| 5 | Voice-first answer on the device (speech to text on the phone; only text leaves) | Experts in the field | A spoken minute is easier than a text line in poor connectivity | On-device speech works offline in French and English; nothing audio is sent |
| 6 | SMS and WhatsApp reply formats | Experts with weak data | Contract already lists the channels | Channel cost and consent agreed; privacy review of message logs |
| 7 | Anticipatory triggers export: a machine-readable "panel probability crossed X" signal for donors and agencies | Readers (UN agencies, INGOs, donors such as ECHO, FCDO, CERF, insurers) | Closes the impact chain. Trigger frameworks exist mostly for weather hazards, so start with a conflict-related partner who wants one. | A funder agrees to treat the signal as one input; legal review; the product still never acts alone |
| 8 | Machine panel member: a model forecaster, labelled as a model, scored like everyone else | Analysts | Gives a baseline and fills coverage gaps in thin contexts | It earns a track record before it gets weight; never mixed in silently; never expert-facing |
| 9 | Daily anchor of ledger roots (`FF_ANCHOR` on) and independent verification page | Readers, committee | Makes the seal checkable outside our server | Third-party timestamp service accepted by ACAPS |
| 10 | Zero-knowledge membership proof (`FF_ZK` on) in place of the HMAC credential | Experts in sensitive contexts | Stronger answer to "from whom are you hiding?" | Security review; question 7 answered; low-bandwidth cost acceptable |
| 11 | Hardware notary for sealing on the expert's own device | Experts, readers | Highest assurance, highest cost | A concrete threat model that justifies it; likely a research task, not a feature |
| 12 | Per-country panel dashboard for the analyst: panel health, coverage gaps over time | Analysts, committee | Helps keep panels balanced as they grow | Enough pulses to show a trend |

Not planned: engagement scores, streaks, public leaderboards of named people, an expert-facing chatbot.
