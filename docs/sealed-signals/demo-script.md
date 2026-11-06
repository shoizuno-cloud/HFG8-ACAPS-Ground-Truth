# Demo script: 3 minutes

Lane C. Total 180 seconds. Spoken words about 400, so about 135 words per minute. Practice Sat 16:00. Two rehearsals with the QR step before Sun 10:30 (master prompt section 9).

## Roles

Names to be filled in by the team. Role first, because the script depends on the role.

- **Presenter (P):** speaks, stands at the screen. Holds no device.
- **Driver (D):** at the laptop on `/desk`. Clicks Reveal, Accept, Verify. Says nothing except the two cues below.
- **Phone (F):** holds the phone that shows the pulse. Passes it to the front row if asked. Watches the envelope count and calls "five" aloud when it reaches five sealed answers.

## Before the start (not in the 3 minutes)

1. `make seed`, then `make demo` once, offline. Confirm R1043 shows on `/desk` and the panel match returns 8.
2. Open three browser tabs on the projector laptop: `/desk`, `/ledger`, and the proof chart (`reports/proof.png`).
3. Phone: email with magic link loaded, 375 px card ready. Screenshot of the card on the phone as a backup.
4. QR code on slide 4 points to the live card URL. Test it on two phones on venue Wi-Fi.
5. Footer on `/desk` must read the flags (proposal P6). Know them: seal path, anchor on or off, model on or off. Say only what is on.
6. Demo mode must top up to 8 synthetic answers if fewer than 5 are live (proposal P7). Confirm the switch works.

## The script

| Time | On screen | Speaker | Words |
|---|---|---|---|
| 0:00 to 0:15 | Slide 1: "47 %" | P | "ACAPS rates a risk Medium. We checked the 58 Medium risks that have resolved. 27 happened, 31 did not. That is 47 percent. A donor cannot act on a coin flip. And the experts who could sharpen it are reached by chat, once, with no record." |
| 0:15 to 0:25 | Phone held up, projected: email, then the card | P, F | P: "Here is what an expert gets. R1043, eastern Chad. A doorbell rang because attacks near the border rose." F shows the card. |
| 0:25 to 1:25 | Slide 4 with QR. Then desk tray on the projector. 60-second countdown on the card. | P | P: "Scan this. You are now the Chad panel. A minute. No login. Your own probability first. ACAPS's rating is hidden, so you are not anchored. Pick how much ACAPS knows about you: your name, a nickname, or nothing. Press Seal." (about 20 s) Then, while envelopes land on the desk tray: "Each answer is locked with a hash the moment you press the button. Nobody can read it. Not us, not ACAPS." F calls "five". |
| 1:25 to 1:45 | `/desk`: Reveal. Distribution chart with ACAPS line, panel dots, dissenter highlighted | D clicks Reveal. P speaks. | "Now we open them together. The panel says 0.74. ACAPS says High. One expert disagrees. We highlight the dissenter instead of averaging them away. The surprisingly-popular answer is yes." |
| 1:45 to 2:10 | Desk: integrity panel, cited draft, Accept | P; D clicks Accept on cue "accept". | "The analyst sees what could be wrong with this round: did people follow the ACAPS number, did two experts move together, is there a missing expert type. Then a draft where every claim has a source. One claim could not be checked, so it is marked, not published. The analyst decides. One click." |
| 2:10 to 2:25 | `reports/proof.png` | P | "We ran the method on all 104 resolved ACAPS risks, with synthetic experts. [Read the actual numbers from proof.json.] This tests the method. It does not say real experts are this good." |
| 2:25 to 2:40 | `/desk` or card: "Six months later" calibration | P, D | "Six months later R1043 resolves. Every forecast gets a Brier score. Good forecasters count more next time. Each expert gets a private report. Nobody gets a streak or a time-in-app count." |
| 2:40 to 2:55 | `/ledger`: entry, honesty box, Verify turns green | P; D clicks Verify. | "And this is the public page. The group view next to the ACAPS rating, how many people, how much they agreed, what we could not check, and our hit rate with the misses. Verify: the seal matches." |
| 2:55 to 3:00 | Slide 8 | P | "ACAPS told us they should have a platform, and that the point is honesty about being wrong. This is that platform. The machine rings the doorbell, the panel answers, the analyst decides, the ledger remembers." |

Time check: the live step (0:25 to 1:25) is a full minute. If the room is slow to scan, the reveal at 1:25 must still happen. Rule: **at 1:25 D clicks Reveal whatever the count is.** If fewer than 5 live answers have sealed, demo mode adds synthetic answers and P says: "We are topping up with synthetic panelists, so you see how it looks at eight." Do not skip this sentence.

Numbers to verify in rehearsal and fix in the script: the 0.74 and the dissenter count are placeholders. Read them off the screen from the seeded run.

## Cues that must not drift

- P says "accept" immediately before D clicks Accept.
- F says "five" aloud. P never claims a number the screen does not show.
- P says "synthetic" every time a synthetic answer or panel is on screen. The desk footer says it too.

## Fallback: pre-loaded synthetic answers

Trigger any one of these:
- Venue Wi-Fi fails or the QR page does not load by 0:40.
- Fewer than 3 phones have sealed by 1:10.
- The live API is down.

Switch (D, one command or button): load the stored run from `make demo`, which replays R1043 with 8 synthetic answers.

What P says at the switch (read it, do not improvise): "The network has let us down, so I will use the recorded run with eight synthetic experts. Same code, same screens, pre-loaded answers." Then continue the table from 1:25. No apology beyond that line.

Rules for the fallback:
- Never claim the answers are live.
- The desk footer and the ledger entry must read "synthetic".
- The 60-second countdown can be skipped; P talks over the envelopes already in the tray.
- If the desk is down: use the screenshots in `slides/backup/` (taken from the seeded run). Takes 15 seconds longer. Drop the proof chart line to stay in time.

## Q and A: likely questions, short answers

| Question | Answer |
|---|---|
| How do you stop a packed panel? | Panels are matched by tag, capped at 3 of 8 from one affiliation, and a coverage gap shows in public. A committee of two admins approves each expert. The analyst decides; nothing publishes itself. |
| Does this change an ACAPS rating by itself? | No. Only the analyst's accept, edit or reject does. [mentor: products never change automatically] |
| Is the proof real? | It is a method test on real outcomes with synthetic experts. We say so on the slide. |
| What stops identification? | The mask is per answer. Public output is aggregate only and never under 5. |
| Why would experts stay? | They get a private calibration report and hear how it resolved. No streaks. We will measure it in the pilot. |
| What if the model is wrong? | The model works analyst-side, every claim is cited, and a deterministic checker marks what it cannot support. |
| Do you cover mortality? | No. We claim a better-calibrated probability. The chain to mortality is in our impact note with its weak links. |
