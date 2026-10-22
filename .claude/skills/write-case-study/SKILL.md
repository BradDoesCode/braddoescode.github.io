---
name: write-case-study
description: Use when Brad wants to write, draft or rework a case study or work write-up for the portfolio. Interviews Brad with targeted questions first, drafts into the work content collection, then runs the privacy and claims checks on the draft.
---

# Write a case study

A case study is a short, honest account of one piece of work: what the problem was, what Brad did, what the team did, what was hard, and what happened. Read `.claude/rules/confidentiality.md`, `.claude/rules/honesty-and-credit.md` and `.claude/rules/writing-style.md` before starting.

Do not open any work repo or internal document. Everything comes from Brad in this conversation.

## 1. Interview first

Do not draft until you have answers. Ask in two or three short batches, not one wall of questions. Skip any Brad has already answered.

1. **Problem.** What needed doing, and for whom (a role or kind of user, not a name)? Why did it matter?
2. **Brad's role.** What did Brad personally do? Be specific: which parts, which decisions.
3. **Team context.** How big was the team, in general terms? Who did what by role? Who should be thanked by role?
4. **Approach.** What did you try, in general terms? Why that way? Which technologies, at a general level?
5. **What was hard.** What went wrong, surprised you, or took several tries?
6. **Outcome.** What changed? What evidence does Brad have, and is Brad allowed to say it publicly? Prefer qualitative outcomes. Get a number only if Brad can stand behind it and it is safe to publish.
7. **What Brad would do differently.**
8. **Publishability.** Is anything here Brad is unsure about sharing? Is there anything to keep out?

Also ask whether Brad wants an illustrative example (a freshly written, anonymised snippet, diagram or mock-up) and agree what it would show.

Confirm the answers back in a few lines before drafting: "Here is what I understood. Correct anything wrong."

## 2. Draft

Create `src/content/work/<slug>.md` (or `.mdx` if a component is needed). The slug is short, lower-case, hyphenated and neutral: no employer, customer or system names.

Front matter (adjust to the collection schema once it exists):

```yaml
title: "Sentence-case title"
summary: "One plain sentence for the listing page."
date: 2026-10-22
role: "What Brad did, in a few words"
tech: ["PHP", "TypeScript"]
draft: true
```

Suggested sections, in sentence case: **The problem**, **My part**, **How we approached it**, **What was hard**, **What happened**, **What I would do differently**. Drop sections that have nothing honest to say.

Drafting rules:

- 600 to 1,200 words, first person, "we" and "I" used accurately.
- Every concrete claim traces to something Brad said. Mark anything not sourced with `<!-- UNVERIFIED: ask Brad -->` in Markdown (or `{/* UNVERIFIED: ask Brad */}` if a claim ends up in an `.astro` file; see `honesty-and-credit.md`).
- Illustrative examples are written fresh and labelled "illustrative".
- Alt text and image filenames are neutral and follow `confidentiality.md`.
- Keep `draft: true` until Brad says it is ready.

## 3. Review the draft

Run both, in this order, on the new file and any images:

1. `privacy-check`
2. `claims-check`

Apply fixes for "must fix" items yourself. Put "needs Brad's decision" items to Brad as questions. Do not silently keep or silently drop doubtful material.

## 4. Commit and stop

Work on a branch (see `workflow.md`), for example `content/case-study-<slug>`. Commit the draft. Do not push, deploy or open a PR.

## Output format

Report:

- Branch and commit hash, and the file path.
- A three-line summary of the case study.
- The privacy and claims verdicts.
- A list of open `UNVERIFIED` items and questions for Brad.
- Whether `draft: true` is still set (it should be).
