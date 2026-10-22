---
name: claims-check
description: Use after writing or changing any prose, case study, CV entry or page copy, and before pre-publish, to check every claim is true, supportable and credits the team fairly. Runs a phrase scan and a claim reconciliation, then gives a verdict and suggested rewrites. Read-only.
---

# Claims check

A check with one question: would every sentence survive a hiring manager asking Brad "is that true?" Read `.claude/rules/honesty-and-credit.md` first. It is the standard. This skill is read-only: report findings and suggested rewrites, do not edit the content.

## Scope

Review the changed content only (use `git diff main...HEAD` plus untracked files), unless asked for the whole site. Include page copy, front matter summaries, alt text, the CV data file, and commit messages if they make claims.

## Layer 1: phrase scan

Search the changed text for each category and list every hit with file and line.

- **Hype words:** revolutionary, game-changing, cutting-edge, world-class, 10x, seamless, blazing, next-generation, state of the art, best-in-class, groundbreaking, transformative.
- **Unverifiable metrics:** percentages, multipliers, "X times faster", volumes, savings, counts of PRs, commits, runs or reviews. Any number needs a source Brad confirmed and is allowed to publish.
- **Absolute claims:** always, never, every, all, zero, fully, completely, entirely, perfect, guaranteed.
- **Sole-authorship language:** "I built the platform", "my system", "single-handedly", "I created", "I invented", "I alone".
- **Teammate comparisons:** "most", "top", "main author", "led" (when it ranks), contribution counts, "more than", any comparison of people.
- **Misstated AI role:** "AI did everything", "fully autonomous", or the reverse, hiding AI involvement where it mattered.
- **Text copied from the rules' examples:** any sentence that matches or closely paraphrases an example in `honesty-and-credit.md` or `writing-style.md`. Those examples are illustrative and their facts are invented, so reuse as content is a must-fix unless Brad has confirmed the facts.
- **Unmarked unverified items:** `UNVERIFIED` markers still present in source (`{/* UNVERIFIED: ask Brad */}` in `.astro` files, `<!-- UNVERIFIED: ask Brad -->` in Markdown).

A hit is not automatically wrong. Judge each in context and say why.

## Layer 2: claim reconciliation

1. Extract each concrete, checkable claim: what was done, by whom, when, how much, with what result.
2. Mark each:
   - **Verified:** Brad has confirmed it in this session or it is in the CV data Brad approved. Say where.
   - **Overstated:** partly true, but stronger than the evidence ("led" for "contributed to", "many" for "several").
   - **Unsupported:** no confirmation either way. Needs a question to Brad.
   - **Contradicted:** conflicts with something Brad said, or with another page on the site.
3. Check "we" versus "I" for each claim. Flag any "I" that was probably a team effort and any "we" that hides what Brad did.
4. Check consistency across pages: dates, titles and technologies must agree between the CV, case studies and the landing page.

Do not guess to resolve an Unsupported item. List it as a question.

## Verdict

Choose one:

- **Honest:** no overstatements, nothing unsupported.
- **Mostly honest with overstatements:** small fixes needed, none misleading as a whole.
- **Misleading:** a claim or the overall impression would mislead a reasonable reader. Must fix before Brad publishes.

## Output format

```
Claims check: <verdict>

Phrase scan
- <file>:<line> "<text>" [category] - <why it matters>

Claims
| Claim | Status | Basis | Suggested rewrite |
| ... | verified / overstated / unsupported / contradicted | ... | ... |

Questions for Brad
1. ...
```

Keep suggested rewrites in Brad's voice and in line with `writing-style.md`. If everything is clear, say so briefly and stop.
