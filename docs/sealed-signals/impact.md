# Impact: who gains, what changes, why it matters

Lane C. Status: part 1 of 3 (stakeholders). Parts 2 and 3 follow in this file.

Labels used in this file:
- **[data]** computed from `data/risk-radar-export.csv` by us.
- **[mentor]** from the ACAPS mentor interview, Fri 6 Nov (master prompt section 0a). These are our interview notes, not a verbatim transcript. Quotation marks mark wording we recorded as spoken.
- **[brief]** from the organisers' brief on `main`.
- **[assumption]** our design choice or guess. To be tested in the December pilot.

## 0. What the mentor told us (primary evidence)

1. Experts are "not sources on the ground". They are well-informed professionals who already track crises: think-tank analysts, journalists, researchers, early-warning practitioners. [mentor]
2. Expertise is geographic and thematic. An earthquake expert outside Venezuela is still the right person for a Venezuela earthquake. Experts tag themselves at sign-up. [mentor]
3. There is a gateway. Experts apply. ACAPS approves on credentials and track of work. It is "a trust system that builds over time". A committee of several ACAPS admins decides. The Risk Radar manager sits in France. [mentor]
4. His open question: a panel could lean one way, or be packed to steer funding. [mentor]
5. "We will get things wrong, like a prediction market; the point is honesty about it." [mentor]
6. Products never change automatically. The app is one validation layer among others. ACAPS must minimise bias and state limitations and what fed into each product. [mentor]
7. No platform exists. The old app died with the US funding cuts. Risk Radar is a dataset on the website plus an API that most heavy users pull into their own systems. He said Risk Radar "should have a platform" and that we may build one on the API to showcase the loop. [mentor]
8. Today 32 analysts track their countries' parameters daily, score risks manually with simple thresholds, and update weekly. "Not very automated, lots of space to improve." [mentor]

Questions we still owe Alex (from `questions-for-acaps.md`) and have no answer for: 4 (expert devices, languages), 5 (how much time per month), 6 (what killed earlier pools), 7 (who needs full anonymity), 11 (who approves the forecast question), 12 (who reads the list for funding), 13 (pilot shape). Every cell below that depends on one of these is marked [assumption].

---

## Part 1. Stakeholders

Five groups. For each: today, with Sealed Signals, what they get, how they want to give their view, what would make them stop.

### 1.1 ACAPS analysts (32 people, one per set of countries)

Persona link: none of the four personas. They are the product's moderators and the ones who must stay in charge.

**Today.** Each analyst tracks the parameters of their countries daily, scores risks by hand against simple thresholds, and updates weekly. [mentor] To check a view they call one or two experts or chat with peers. The answer is not recorded in a way anyone can score later. [brief]

**With Sealed Signals.**
- A daily doorbell reads open indicators mapped to each risk's own triggers and says when something shifted. The analyst can also ring it by hand. Two experts can ring it too.
- A matched panel of up to 8 vetted experts answers in a minute. Answers stay sealed until the analyst opens them.
- The analyst receives one screen: distribution, the panel's surprisingly-popular answer, missing themes, an integrity panel, and a cited draft update. The analyst accepts, edits or rejects. Nothing publishes itself.

**What they get.**
- A number and the reasons behind it, with every claim cited to a panel aggregate, an indicator or an existing source.
- A moderator-only integrity panel (anchoring, herding, collusion, recency, coverage gaps).
- A track record: which experts were right, and whether the panel beat the analyst's own rating.
- Less drafting time per weekly update. [assumption] We have not measured this. The pilot should time it.

**How they want to give their view.** At a desk, on a large screen, in English first. Decision in under five minutes per pulse. [assumption]

**What would make them stop.**
- A draft that cites something false, or an unsourced number. One bad citation costs trust for weeks.
- Extra work: a second system to maintain next to the weekly update.
- A tool that reads as a replacement for their judgement.
- Pulses that fire too often. Design limit: one pulse per expert per 7 days, heartbeat every 28 days.

### 1.2 Vetted experts (analysts, journalists, researchers, early-warning practitioners)

Persona link: closest to Pierre (field MEAL officer who wants a method and has no time) and Jose (regional head who wants an easy way to give quality feedback to headquarters). [brief]

**Today.** Their knowledge reaches ACAPS through informal calls and chats. It is used once and not credited. They get nothing back. Earlier expert pools lost participation after launch. [brief] We do not yet know why in ACAPS's own experience (question 6).

**With Sealed Signals.**
- They apply with geographic and thematic tags. The ACAPS committee approves on credentials and track of work. [mentor]
- A pulse arrives by email magic link. No login. One card, 60 seconds.
- Round 1 is blind: ACAPS's rating is hidden, so their view is their own. They give a probability, a confidence, a guess of what the panel will say, one line on what is missing, and a tag: saw, read or heard.
- They choose a mask per answer: known to ACAPS, pseudonym to peers, or anonymous.
- Round 2 shows ACAPS's rating and the anonymised group, and asks whether they changed their mind.

**What they get.**
- A private calibration report after each risk resolves. It is theirs alone.
- Evidence that their view was heard: the ledger shows the group view and, later, the outcome.
- Credit that builds with track record, never with time in the app. No streaks, no engagement counts.
- A reason to come back that is not a gamified one: the question is relevant to a place they follow.

**How they want to give their view.**
- Channel: email magic link first, WhatsApp second, as the master prompt sets. [assumption] To test at the pilot with real people.
- Language: English first, French next. Arabic is on the future list. [brief: French named as a working language]
- Time: a minute, on a phone, outside office hours as much as in them. A 60-second countdown keeps it short. [assumption]

**What would make them stop.**
- A card that takes more than a minute or asks for a login.
- Any sign that their answer could be traced back when they chose a mask.
- Being asked too often. Cap: one pulse per expert per 7 days.
- Hearing nothing back. The "how it resolved" message and the calibration report answer this.
- A panel they see as stacked, or an app that feels like a chatbot.

### 1.3 ACAPS readers (UN agencies, INGOs, donors such as ECHO, FCDO and CERF, insurers)

Persona link: Emily (donor methodology head who struggles to judge reliability), Aisha (INGO country director who wants anticipation of what comes next), Jose (UN regional head who wants field feedback to reach headquarters). [brief]

**Today.** They read the Risk List on the website or pull it through the API into their own systems. [mentor] A rating is a single analyst-set label. They cannot see how it was reached, how often ACAPS has been right, or whether people on the ground recognise the picture. [brief] Emily "has to go elsewhere to check it".

**With Sealed Signals.**
- Each Risk List entry can carry, next to the ACAPS rating, the panel's group view, sealed at a stated time and checkable with a Verify button.
- Every ledger entry has an honesty box: number of contributors, agreement, confidence band, coverage gaps, claims corroborated out of total, the panel's past hit rate with misses included, and a caveat line.
- When the risk resolves, the outcome appears on the same entry.

**What they get.**
- For Emily: a stated basis for each number and a visible record of past errors.
- For Aisha: a view on what the people who follow a context expect, in numbers, with an earlier signal when the panel moves before ACAPS.
- For Jose: a documented channel through which his field teams' view can reach the analysis without exposing them. [assumption: only if his teams are admitted as experts]
- For donors and insurers: a calibrated probability they can compare with ACAPS's own record. Today High-rated risks materialised 84 % of the time and Medium-rated 47 % [data: 32 of 38 and 27 of 58 resolved risks].

**How they want to give their view.** They do not contribute. They read, via the website, a ledger page or the existing API. [assumption] Public pages show aggregates only.

**What would make them stop.**
- Numbers that look precise but are wrong in a way nobody states.
- Any suggestion that funding decisions can be steered by whoever sits on the panel.
- A product that changes without notice. The ledger records every change and who decided it.

### 1.4 The ACAPS committee (several admins, global)

Persona link: none. This is the gatekeeper the mentor named. [mentor]

**Today.** No expert gateway exists as a formal process. Expert contacts are personal to each analyst. [assumption: inferred from "informal conversations with peers" in the brief]

**With Sealed Signals.**
- Applications arrive with tags. Approval needs two admins before a credential is issued.
- The committee sees panel composition against rules: no more than 3 of 8 from one affiliation tag, geographic spread, theme cover.
- It sees coverage gaps (a conflict risk with no conflict expert) and decides who to invite.
- It can pause an expert. Removing an expert never alters past ledger entries.

**What they get.** An audit trail of who was admitted, when and by whom; a defence against a packed panel; a reliable way to grow the pool by tag rather than by contact lists.

**How they want to give their view.** Committee screen on the desk. Two-person approval. Time: a short review session per week. [assumption]

**What would make them stop.** Admin workload with no payoff; a gateway that is too slow so good experts drop out; any pressure to approve someone without checks.

### 1.5 Affected populations (people in eastern Chad and in the next Risk List country)

Persona link: indirect. Aisha's 150-person team and Pierre's deployments act on their behalf.

**Today.** Humanitarian decisions use ACAPS risk ratings as one input among many. When the rating is late or uncalibrated, preparation starts late. [assumption, supported by the anticipatory-action evidence in part 3]

**With Sealed Signals.** They are not users and never see the app. Their interest is in downstream effects: an earlier and better-calibrated warning reaches the agencies that plan for them. This is a possibility, not a promise. Section 3 of this file sets out the chain and its weak links.

**What they get.** Nothing direct. We say so plainly. The case for impact rests on whether better forecasts change an agency's decision, which part 3 treats as the weakest link.

**Risks to them.** If an expert's identity leaks, the expert is in danger, and so are the people they work with. This is why anonymity is chosen per answer, public output is aggregate only, and no aggregate is shown with fewer than 5 contributions.

**What would make us stop.** Any evidence that the tool exposes a contributor or biases attention toward places with more experts and away from places with fewer. The second is a real risk: contexts with few vetted experts get a thinner panel. The honesty box states this as a coverage gap.

---

## Summary table

| Group | Today | Main gain | Channel and time | Stops if |
|---|---|---|---|---|
| Analysts (32) | Manual scoring, weekly updates, informal calls [mentor] | One screen with cited draft and integrity checks | Desk, minutes per pulse [assumption] | Draft cites falsehood; extra workload |
| Experts | Informal chats, no feedback [brief] | Private calibration report, a heard view | Email link, then WhatsApp; 60 s [assumption] | Login, traceability, over-asking |
| Readers | One label, no visible basis [mentor] | Basis, record and outcome on each rating | Website, ledger, API [assumption] | Hidden errors; steering |
| Committee | No formal gateway [assumption] | Audit trail and composition rules | Desk, weekly [assumption] | Workload; pressure to admit |
| Affected people | Indirect | Possible earlier preparation | None | Leak of a contributor; thin panels |
