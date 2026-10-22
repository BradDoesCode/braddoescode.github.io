---
name: update-cv
description: Use when Brad wants to add, change or tidy anything on the CV, such as a new role, project, skill, qualification or date. Updates the single CV data source, keeps the on-site CV and its print stylesheet in sync, keeps phone number and home address out, and flags gaps or stale entries.
---

# Update the CV

The CV has one data source, `src/data/cv.ts` (see `CLAUDE.md`). The `/cv/` page renders it, and the printable CV is a print stylesheet on that same page, not a separate page. Never hard-code CV content in a page or component.

Read `.claude/rules/confidentiality.md`, `.claude/rules/honesty-and-credit.md` and `.claude/rules/writing-style.md` first. CV entries are public claims.

## 1. Gather

Take what Brad gives you in chat. Do not pull career details from work repos, internal documents or guesses. For each new or changed entry, make sure you have:

- Employer or organisation (the employer's name is fine; internal systems are not).
- Title, start and end month and year (or "present").
- A few plain bullets on responsibilities and outcomes.
- Technologies at a general level.

Ask for anything missing. Do not invent dates, titles or numbers.

## 2. Update the data file

- Edit the single source only. Keep entries in reverse chronological order.
- Bullets are first person implied ("Worked on the PHP backend of..."), past tense for past roles, present tense for the current one. Specific, short, no hype.
- Team work is described as team work ("Part of a small team building...").
- No internal metrics, customer names, colleague names or internal system names. Describe the internal platform generically.
- **Keep the public CV free of a phone number and a home address.** City or region at most. If Brad wants a contact route, ask which public one (profile link, `mailto:`). Do not scrape or copy one from elsewhere.
- Add a "last updated" date field and set it to today.
- If an entry carries a `needsUpdate` flag (see `node scripts/cv-flags.mjs`), keep it until Brad has confirmed the replacement text. Once Brad has confirmed, remove the flag from that entry and any `NEEDS UPDATE` comment beside it. Never clear it on a guess, because `pre-publish` treats the flag as a blocker.

## 3. Keep site and print in sync

- Confirm `/cv/` renders the new content, both on screen and in print preview. Run `npm run build` and look at both.
- Check the print stylesheet still fits sensibly on one or two A4 pages with no orphaned headings.
- If a PDF download link is offered, remind Brad it is made from the browser's print dialog and Brad must regenerate it. Do not commit a stale PDF.

## 4. Flag gaps and stale entries

After the edit, read the whole CV and list for Brad:

- Entries with no end date that may be out of date.
- Roles with thin or missing bullets.
- Skills listed but not evidenced anywhere on the CV or site.
- Technologies or claims that appear on the site but not on the CV, or the reverse.
- Anything that has not changed in over a year and may need a refresh.
- Gaps in the timeline.

Flag these as questions. Do not fix them by guessing.

## 5. Review and commit

Run `claims-check` and `privacy-check` on the changed entries. Commit on a branch such as `cv/update-<yyyy-mm>`. Do not push, deploy or open a PR.

## Output format

- Branch and commit hash.
- A list of entries added, changed or removed.
- Confirmation: `/cv/` renders the change on screen and in print preview (or what could not be checked).
- Confirmation: no phone number or home address present.
- Review verdicts.
- Gaps and stale items as a short list of questions.
