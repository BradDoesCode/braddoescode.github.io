---
name: privacy-check
description: Use after any change to content, case studies, images, alt text, filenames or commit messages, and before pre-publish, to check nothing about employer work has leaked. Scans against the confidentiality rule and flags anything doubtful for Brad rather than silently keeping it. Read-only.
---

# Privacy check

A check with one question: does anything here give away employer work? The standard is `.claude/rules/confidentiality.md`; read it first. Anything doubtful goes to Brad. Never decide on Brad's behalf that it is probably fine, and never silently keep or silently delete it.

This skill is read-only. Do not open or search any work repo or internal document to "compare". Judge from the text itself and from what Brad has said.

## Scope

All changes since `main` (`git diff main...HEAD`, plus untracked files) across:

- Page content, headings, front matter, summaries and slugs.
- Alt text, captions and image filenames.
- Image metadata: run `exiftool` on each new or changed image if available (otherwise `mdls` or `identify -verbose`) and look for author, software, GPS, comments, device and path fields.
- Screenshots: look at them for tabs, URLs, usernames, notification banners, hostnames and real data.
- Code blocks and comments: is any of it real rather than freshly written?
- Commit messages and branch names (`git log main..HEAD`).
- `package.json`, config files, `.claude/` rules and skills.

## What to look for

1. **Names:** private repos, internal systems, tools, services, environments, customers, suppliers, colleagues, clients' brands. Also initials, usernames and nicknames that identify people.
2. **Specifics:** architecture, infrastructure, hostnames, table or field names, endpoints, data models, workflows specific enough to identify a system.
3. **Numbers:** volumes, revenue, savings, times, counts of PRs, commits, reviews, agent runs, headcount if internal.
4. **Text lifted from work:** code, prompts, rule or skill text, specs, tickets, emails, even lightly reworded. Phrasing that looks too specific to have been invented is a flag.
5. **Visuals:** real screenshots, even blurred. Illustrative mock-ups must be clearly freshly drawn.
6. **Metadata:** EXIF, XMP, PDF properties, file paths, author names.
7. **Illustrative examples** not labelled as illustrative, or that look real.
8. **Indirect identification:** a combination of details that lets a reader work out which customer or system is meant.

Use search to help (`rg -i` for terms Brad has told you are private, for dates, digits followed by units or percent signs, and for proper nouns), but read the text too. A scan will not catch a clever paraphrase.

## Verdict

- **Clear:** nothing found, and the content stays at the level of role, approach and general technology.
- **Needs Brad's decision:** doubtful items exist. List each with the question to ask.
- **Must fix:** content that plainly breaks the rule (a customer name, real code, an internal number, a real screenshot). Must not be published or committed as-is.

If something confidential is already committed, say so plainly at the top and recommend Brad decide on history rewriting. Do not rewrite history yourself.

## Output format

```
Privacy check: <verdict>

Must fix
- <file>:<line> "<text>" - <which rule, why> - suggested generic rewrite: "..."

Needs Brad's decision
- <file>:<line> "<text>" - <why it is doubtful> - question: "..."

Checked and clear
- content, alt text, filenames, metadata (<n> images), commit messages, config
```

Say what you did not check (for example, "exiftool not installed; metadata not inspected"). Do not claim "Clear" for areas you could not look at.
