# Confidentiality: give nothing away about employer work

This repo and the site are public. Brad works for William Pollard & Co, and their private work is not ours to publish. A leak is hard to undo, because git history and caches keep copies. Treat this rule as the highest priority after Brad's own instructions.

## Never publish

- Code, snippets, prompts, or rule and skill text taken from any William Pollard repo, even lightly edited.
- Names of private repos, internal systems, tools, services, databases or environments. Describe the internal platform generically, for example "an internal business platform". Say no more than that about what it does.
- Names of customers, suppliers or colleagues.
- How the team's AI engineering process works: how agents are instructed, which review steps exist, how work is specified, or how fixes and issues are automated. Say only that agents work inside a structured process with human decisions and review.
- Internal architecture specifics, infrastructure names, data models, schemas, endpoints, or screenshots of internal tools.
- Internal metrics: volumes, revenue, savings, PR counts, commit counts, review counts, agent run counts, from private repos.
  - Exception: the activity chart may show the *shape* of Brad's weekly pull-request activity: relative values only, no counts, axis values or averages, in the UI or in committed data.
  - Brad decided (22 October 2026) that the Activity section may also show rounded multipliers of pull requests per week, relative to Brad's own average before April 2026. Never counts, averages or totals.

## Where this applies

Page content, headings, alt text, image filenames and image metadata (EXIF, XMP, PDF properties), URLs and slugs, code comments, commit messages, branch names, PR descriptions, front matter, `package.json` fields, and the text of these rules and skills.

## Allowed and not allowed

| Allowed | Not allowed |
| --- | --- |
| Brad's role and responsibilities | Names of colleagues, even in thanks |
| The general approach and ideas ("agents work inside a structured process; people decide and review") | The text of any internal spec, prompt, rule or skill |
| Technologies at a general level ("PHP", "TypeScript", "LLM agents") | Internal service names, hostnames, repo names, table or field names |
| Brandhub as a public product, and Brad's PHP backend work on it in general terms | Brandhub internals, customer brand portals, client data |
| Freshly written, anonymised, illustrative examples labelled as such | Real code or output, even trimmed or "mostly generic" |
| Qualitative outcomes Brad is happy to say publicly | Internal numbers, even rounded or "roughly" |

## Rewrite examples

The examples are illustrative. They use bracketed placeholders, never names, real or invented. Never reuse them as site content.

| Before (not allowed) | After (allowed) |
| --- | --- |
| "We built the sync service for [customer] using the [private repo]." | "We built a service that keeps data in step between two internal systems." |
| "The [internal service] reads the [internal table] every five minutes." | "A background job keeps two systems up to date with each other." |
| "[Colleague] caught a missing access check in the [internal API]." | "Review caught an access-control gap before it merged." |
| "This cut report handling from 14 minutes to 3 across 2,000 reports a month." | "It made the task noticeably quicker for the team. I can talk through how we measured it." (only if Brad confirms this is fine to say) |
| Screenshot of the internal dashboard, blurred. | A freshly drawn mock-up of a generic dashboard, made for the site and marked as illustrative. |
| "Here is the prompt we use:" followed by the real prompt. | "Here is a made-up prompt in the same spirit:" followed by a new one written from scratch for this page. |

## Rules for agents

1. **Write from Brad's brief, not from work repos.** Do not open, read, search, copy from or summarise any work repo or internal document, even when they exist on Brad's machine. If Brad pastes internal text into chat, use it only to understand the point being made, never to quote or paraphrase closely.
2. **Illustrative examples are written fresh**, with invented details, and are labelled "illustrative" on the page. Use roles ("a teammate", "a customer") or bracketed placeholders, never names, not even invented ones.
3. **If unsure, leave it out and ask Brad.** A flagged doubt costs a minute. A leak costs far more. Do not decide on Brad's behalf that something is probably fine.
4. **Strip image metadata** and use neutral filenames. Check screenshots for tabs, URLs, usernames and notification banners.
5. **Never put doubtful material in a commit** "to be removed later". History keeps it.
6. If something confidential has already been committed, stop, tell Brad, and do not try to hide it with a quiet follow-up commit. Rewriting history is Brad's call.

Run the `privacy-check` skill on any change to content, images or case studies before it is handed to Brad.
