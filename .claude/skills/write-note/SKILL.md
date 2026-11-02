---
name: write-note
description: Use when Brad wants to write, draft or rework a note for the Notes section of the portfolio. Interviews Brad with a few targeted questions first, drafts into the notes content collection, then runs the privacy and claims checks on the draft.
---

# Write a note

A note is a short post on one thing Brad learned, tried or changed his mind about while working with AI coding tools. It is lighter than a case study: 300 to 800 words, one idea, no required structure. Read `.claude/rules/confidentiality.md`, `.claude/rules/honesty-and-credit.md` and `.claude/rules/writing-style.md` before starting.

Do not open any work repo or internal document. Everything comes from Brad in this conversation.

## What a note may and may not say

Notes may describe general lessons and freshly written illustrative examples, labelled "illustrative". They may never describe how the employer's internal AI process works: how agents are instructed, which review steps exist, how work is specified, or how fixes and issues are automated (see "How the team's AI engineering process works" in `confidentiality.md`). If a lesson cannot be told without that, ask Brad whether it can be told about his own side projects or in purely general terms, or leave it out.

A note about a general technique, a tool's behaviour, or a mistake Brad made while using AI tooling is fine. A note that explains how the team does it at work is not.

## 1. Interview first

Do not draft until you have answers. Ask three to five short questions in one batch, skipping any Brad has already answered.

1. **The one thing.** What did you learn, try or change your mind about? Say it in a sentence.
2. **What happened.** What led to it? What did you try first, and what did you see?
3. **Why it matters.** What would you tell another developer who is about to run into the same thing?
4. **Where it came from.** Was this at work, on a personal project, or general reading? (If it came from work, check it against the rule above, and say what Brad is happy to share in general terms.)
5. **Limits.** What are you unsure of, or where might this not hold? Is there anything to keep out?

Also ask whether Brad wants a small illustrative example (freshly written, anonymised, labelled illustrative) and agree what it would show.

Confirm the answers back in a few lines before drafting: "Here is what I understood. Correct anything wrong."

## 2. Draft

Create `src/content/notes/<slug>.mdx`. Notes are MDX only, because links in MDX go through `MarkdownLink`, which makes external links safe. The slug is short, lower-case, hyphenated and neutral: no employer, customer or system names. It becomes the URL, `/notes/<slug>/`.

Front matter:

```yaml
title: "Sentence-case title"
description: "One plain sentence."
date: 2026-11-02
draft: true
```

- `description` is one plain sentence. It is shown in the Notes listing, used as the meta description and in the RSS feed, and drawn on the link-preview card, so it has to make sense on its own.
- `updated` is optional. Add it, with a date, only when a published note changes in a way a reader should know about.
- `draft: true` while drafting. Drafts show in `npm run dev` and are left out of production builds. When no note is published, nothing about notes is built at all, so the Notes link, page, feed and card appear with the first published note.

Drafting rules:

- 300 to 800 words, first person, "I" for what Brad did and "we" only for what a team did. Lead with the point.
- Headings are optional. Use sentence case and start at `h2` (the title is the `h1`).
- Every concrete claim traces to something Brad said. Mark anything not sourced with `{/* UNVERIFIED: ask Brad */}` (the MDX comment form; the build drops it). In the front matter, if the `description` itself is not confirmed, say so in your report instead, because a YAML comment is easy to miss.
- Say what did not work and where the lesson may not hold.
- No hype, no absolutes, no numbers Brad cannot stand behind (`honesty-and-credit.md`).
- Illustrative examples are written fresh and labelled "illustrative". Code in them is invented.
- Describe AI's role accurately: what the tool did, what Brad decided, what he checked.

## 3. Review the draft

Run both, in this order, on the new file:

1. `privacy-check`
2. `claims-check`

Apply fixes for "must fix" items yourself. Put "needs Brad's decision" items to Brad as questions. Do not silently keep or silently drop doubtful material.

## 4. Commit and stop

Work on a branch (see `workflow.md`), for example `content/note-<slug>`. Commit the draft. Do not push, deploy or open a PR. Publishing means Brad sets `draft: false` and decides the date.

## Output format

Report:

- Branch and commit hash, and the file path.
- A two-line summary of the note.
- The privacy and claims verdicts.
- A list of open `UNVERIFIED` items and questions for Brad.
- Whether `draft: true` is still set (it should be).
