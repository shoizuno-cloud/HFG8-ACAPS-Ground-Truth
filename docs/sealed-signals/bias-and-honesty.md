# Bias and honesty

Lane C. Maps each detector and design choice in master prompt section 6a to its research source, says what the source does and does not support, and records the mentor's words on honesty.

Verification: each citation below was looked up on 6 Nov 2026 (bibliographic record or abstract, through search). We did not read every full paper. Status column: **verified** (record found and matches), **corrected** (found, but our first wording was wrong), **design** (our own choice, no source claimed).

## 1. The mentor's frame

- "We will get things wrong, like a prediction market; the point is honesty about it." [mentor, 6 Nov]
- The app is one validation layer among others. Products never change automatically. ACAPS must minimise bias and state limitations and what fed into each product. [mentor]
- His open question: a panel could lean one way, or be packed to steer funding. [mentor]

Our answer in one line: we cannot remove bias, so we measure it, show it to the moderator, state it publicly in the honesty box, and let an analyst decide.

## 2. Detector by detector

| # | Design element | What it does | Research source | Status |
|---|---|---|---|---|
| 1 | Blind first round | Round 1 hides ACAPS's rating. The expert gives their own number first. | Anchoring: Tversky and Kahneman 1974. Independent first round: the Delphi method, Dalkey and Helmer 1963. | verified |
| 2 | Anchoring shift | Logs the change in each answer from round 1 to round 2 | Tversky and Kahneman 1974 | verified |
| 3 | Accuracy prompt and source tag | One line asks whether the point was seen, read or heard | Pennycook et al. 2021 (accuracy nudge); source tag is ours | verified / design |
| 4 | Calibration and overconfidence | Calibration curve and overconfidence index per pseudonym; feeds weights and the private report | Tetlock 2005; Tetlock and Gardner 2015; Mellers et al. 2015; Brier 1950 | verified, one citation corrected |
| 5 | Reliability weights and extremizing | Weights from past Brier score; aggregate in log-odds; extremize | Baron et al. 2014; Mellers et al. 2015 | verified; 1.3 factor is ours |
| 6 | Surprisingly popular | Compare actual share of "yes" with the panel's guess of that share | Prelec, Seung and McCoy 2017 | verified |
| 7 | Herding | Round 2 converges to the mean with no new reasons; the aggregate then uses round 1 | Lorenz et al. 2011; Delphi design | verified |
| 8 | Collusion and independence | Pairwise agreement beyond shared evidence; composition caps at panel build | Lorenz et al. 2011 (independence); caps are ours | design |
| 9 | Recency and availability | Panel moves with news volume while hard indicators are flat | Tversky and Kahneman 1973 | verified |
| 10 | Coverage gap | Panel tags vs the risk's triggers; also public in the honesty box | Delphi expert-selection practice; rule is ours | design |
| 11 | Rumour propagation and corroboration | Copied wording counts once; claims are checked against ACAPS API, ReliefWeb, ACLED | Our design. No source claimed. | design |
| 12 | Honesty box | Public: n, agreement, band, gaps, corroborated claims, hit rate, caveat | Brier 1950 for scoring; mentor for the principle | verified / mentor |

## 3. Notes per source: what it supports, what it does not

### 3.1 Anchoring: Tversky and Kahneman
- Citation: Tversky, A. and Kahneman, D. (1974). Judgment under Uncertainty: Heuristics and Biases. *Science* 185(4157): 1124-1131. DOI 10.1126/science.185.4157.1124. Record: [PubMed 17835457](https://pubmed.ncbi.nlm.nih.gov/17835457/).
- Supports: people anchor on a starting value when making numerical estimates. This is why round 1 hides the ACAPS rating.
- Does not support: any claim about the size of the effect on expert forecasts. Their anchoring experiments used lay participants and general-knowledge questions. We state this on the slide as "known effect", not "measured on our panel". We measure our own `anchoring_shift`.

### 3.2 Delphi method: Dalkey and Helmer
- Citation: Dalkey, N. and Helmer, O. (1963). An Experimental Application of the Delphi Method to the Use of Experts. *Management Science* 9(3): 458-467. DOI 10.1287/mnsc.9.3.458. Record: [RePEc](https://econpapers.repec.org/RePEc:inm:ormnsc:v:9:y:1963:i:3:p:458-467).
- Supports: repeated questionnaires with controlled feedback between rounds, answered independently, is an established way to reach a group opinion. The organisers' brief itself names Delphi as the model for ground truthing.
- Does not support: claims that Delphi yields correct answers. The paper reports an experiment on use of experts, not proof of accuracy. Not verified beyond the abstract.

### 3.3 Calibration, overconfidence and the Good Judgment Project
- Tetlock, P. E. (2005). *Expert Political Judgment: How Good Is It? How Can We Know?* Princeton University Press. Reviews confirm it scored forecasts for calibration and discrimination and found experts often overconfident.
- Tetlock, P. E. and Gardner, D. (2015). *Superforecasting: The Art and Science of Prediction.* Crown (US edition). Covers the IARPA tournament run by the Good Judgment Project, 2011 to 2015.
- Mellers, B. et al. (2015). Identifying and Cultivating Superforecasters as a Method of Improving Probabilistic Predictions. *Perspectives on Psychological Science* 10(3): 267-281. Record: [APS](https://www.psychologicalscience.org/journals/perspectives/1745691615577794/).
- **Corrected:** the brief for this task said "Psychological Science, 2014". The paper is in *Perspectives on Psychological Science*, 2015. Use the corrected form.
- Brier, G. W. (1950). Verification of forecasts expressed in terms of probability. *Monthly Weather Review* 78(1): 1-3. Origin of the Brier score. Title wording varies between sources; check the original before printing.
- Supports: forecasts should be scored on resolved outcomes; track records can identify better forecasters; weighting by past accuracy is a legitimate method.
- Does not support: our specific weight formula `w = 1 / (0.1 + mean_brier)`. That is our choice.
- Source caution: we saw wiki sites quoting percentages for how much better the superforecasters did (figures from 30 % to 85 % in different places). We cite no percentage.

### 3.4 Extremizing
- Baron, J., Mellers, B. A., Tetlock, P. E., Stone, E. and Ungar, L. H. (2014). Two Reasons to Make Aggregated Probability Forecasts More Extreme. *Decision Analysis* 11(2): 133-145. DOI 10.1287/deca.2014.0293. Record: [RePEc](https://econpapers.repec.org/RePEc:inm:ordeca:v:11:y:2014:i:2:p:133-145).
- Supports: the average of many forecasts tends to be too close to 0.5, and a transformation that pushes it toward 0 or 1 can help.
- Does not support: the 1.3 factor. Later work (Satopaa et al., arXiv 1705.02391) argues extremizing is not always appropriate. With a panel of 5 to 8 whose information overlaps, extremizing can hurt.
- **Question for Lane A:** make the extremizing factor a setting, report the proof simulation with and without it, and say which one the demo used.

### 3.5 Surprisingly popular
- Prelec, D., Seung, H. S. and McCoy, J. (2017). A solution to the single-question crowd wisdom problem. *Nature* 541: 532-535. Record: [MIT News](https://news.mit.edu/2017/algorithm-better-wisdom-crowds-0125).
- Supports: the answer that is more popular than respondents predicted is a better guide to truth than the majority in the authors' studies. Press coverage reports error reductions of about 21 % against majority vote; we did not confirm that figure in the paper and do not cite it.
- Does not support: reliability with 5 to 8 respondents. The authors state results depend on assumptions real respondents may not meet. We show the surprisingly-popular answer as a highlight on the chart, not as the number that sets the rating.

### 3.6 Accuracy prompt
- Pennycook, G., Epstein, Z., Mosleh, M., Arechar, A. A., Eckles, D. and Rand, D. G. (2021). Shifting attention to accuracy can reduce misinformation online. *Nature* 592: 590-595. DOI 10.1038/s41586-021-03344-2. Record: [MIT Sloan](https://mitsloan.mit.edu/press/what-can-be-done-to-reduce-spread-fake-news-mit-sloan-research-finds-shifting-peoples-attention-toward-accuracy-can-decrease-online-misinformation-sharing).
- Pennycook is lead author and Rand senior author. Cite as "Pennycook et al. 2021".
- Supports: a subtle prompt to think about accuracy improved the quality of news that people chose to share, in survey experiments and a Twitter field experiment.
- Does not support: any effect on expert forecasts. That study was about sharing news headlines. Our prompt and the saw / read / heard tag are an adaptation. We say "adapted from", never "proven for experts". Page range 590-595 not checked; verify before printing.

### 3.7 Herding and independence
- Lorenz, J., Rauhut, H., Schweitzer, F. and Helbing, D. (2011). How social influence can undermine the wisdom of crowd effect. *PNAS* 108(22): 9020-9025. DOI 10.1073/pnas.1008636108. Record: [PMC3107299](https://pmc.ncbi.nlm.nih.gov/articles/PMC3107299).
- Supports: when people see others' estimates and revise, diversity falls without accuracy improving, and confidence rises. This is the case for logging round 2 convergence and falling back to round 1 when it looks like herding.
- Does not support: our herding threshold. It is a rule we set.
- Note: this paper was not on the original source list. We added it because it is the direct evidence for the herding detector.

### 3.8 Recency and availability
- Tversky, A. and Kahneman, D. (1973). Availability: A heuristic for judging frequency and probability. *Cognitive Psychology* 5(2): 207-232. DOI 10.1016/0010-0285(73)90033-9.
- Supports: people judge likelihood by how easily examples come to mind. News volume is a proxy for that.
- Also added to the original source list.

## 4. Citations dropped or changed

| Original wording | Problem | Action |
|---|---|---|
| Mellers et al., Psychological Science 2014 | Wrong journal and year | Replaced with *Perspectives on Psychological Science* 10(3), 2015 |
| Tetlock "and the Good Judgment Project on calibration and extremizing" | Mellers 2015 record shows nothing on extremizing in the snippets we saw | Extremizing now cited to Baron et al. 2014 |
| Pennycook and Rand | Lead author is Pennycook; Rand is senior author of a six-author paper | Cite as Pennycook et al. |
| Percentage superiority of superforecasters | Sources disagree | Not cited |
| "Half the cost" in Bangladesh anticipatory action | One secondary source only | Not cited (see impact.md) |

## 5. What the public sees (the honesty box)

On every ledger entry:
- n: number of contributors
- agreement (0 to 1) and confidence band
- coverage gaps, in plain words
- claims corroborated out of claims total
- the panel's past hit rate, misses included
- one caveat line, e.g. "This panel has no displacement expert."

What the public does not see: any flag about a person; any integrity block. Those stay on the moderator desk.

Draft caveat lines for the ledger (for Lane A to use as templates):
1. "Panel of 6 vetted experts. No displacement specialist. Treat the displacement signal with caution."
2. "Round 2 answers moved toward the mean without new reasons. This view uses round 1."
3. "Two claims could not be corroborated and are not in the draft."
4. "Synthetic panel for demonstration. Not a real forecast."

## 6. Limits we say out loud

- Experts are not sources on the ground. They are informed professionals. [mentor]
- A small panel can lean one way. We cap composition and show coverage gaps. We cannot prove independence.
- The bias literature above is mostly lab work on non-experts. Effects on vetted experts are unknown. The pilot will measure ours.
- The proof simulation uses synthetic experts. It tests the method.
- Brier scores on a handful of resolved risks per expert are noisy. Weights move slowly on purpose (new expert starts at median weight).
