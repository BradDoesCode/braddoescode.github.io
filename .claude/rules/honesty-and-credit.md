# Honesty and credit: collaboration, not competition

Every claim on this site must be true and supportable by Brad if a hiring manager asks about it in an interview. The work was a team effort, and the site should say so warmly and without fuss.

## Principles

1. **True and supportable.** If Brad has not confirmed a claim, it does not go in. Ask instead of inferring.
2. **"We" and "I" used accurately.** "We" for outcomes the team achieved. "I" for what Brad personally did. Be specific about which is which; do not blur them in either direction.
3. **Never rank Brad against teammates.** No contribution counts, no "most active", no "the main author", no comparisons of any kind.
4. **No implied sole authorship.** Avoid "I built the platform", "my system", "my agents" when it was a team's work. "I worked on", "I helped design", "I was responsible for X within it" are fine when true.
5. **No inflated or unverifiable metrics.** No percentages, multipliers or volumes without a source Brad can stand behind and is allowed to publish (see `confidentiality.md`). Prefer no number to a soft one.
6. **No hype words.** Avoid "revolutionary", "game-changing", "cutting-edge", "world-class", "10x", "seamless", "blazing", "next-generation", "state of the art".
7. **No absolutes** ("always", "never", "every", "zero bugs", "fully automated") unless literally true.
8. **Accurate about AI's role.** Neither "AI did it all" nor hiding it. Say what agents did, what humans decided, and where humans checked. Humans own the outcome.
9. **Say what was hard and what did not work.** Honest limits make the rest believable.
10. **Credit others by role, not name** (confidentiality forbids naming colleagues). "A teammate suggested...", "our reviewers..." is warm and safe.

## Before and after: collaborative framing

**These examples are illustrative. Their facts are invented. Never reuse them as site content**; write from what Brad has confirmed.

| Before | After |
| --- | --- |
| "I built an AI platform that runs our engineering." | "I'm part of a small team building an internal platform where AI agents do much of the routine engineering work, under human direction." |
| "My agents wrote all the code." | "Agents wrote a lot of the first drafts. People made the design calls and reviewed what came back." |
| "I designed the whole review process." | "I helped shape how we work with the agents, and the team refined it in use." (only if true) |
| "I outperformed the previous workflow." | "We found the new workflow suited this kind of work better. Here is what we noticed." |
| "Thanks to me, releases became reliable." | "Our releases became steadier once we added automated checks. I worked on part of that." |

## Before and after: de-hyping

| Before | After |
| --- | --- |
| "A revolutionary 10x leap in productivity." | "It removed some tedious steps. I can't give a reliable multiplier." |
| "World-class, fully automated pipeline." | "A pipeline where most steps run without a person, and a person approves the result." |
| "Zero bugs reached production." | "Review caught several problems before they shipped." (only if Brad can support "several") |
| "Seamless AI integration." | "Getting agents to work reliably took a lot of iteration. The hardest part was keeping their context accurate." |
| "Rebuilt the backend single-handedly." | "I worked on the PHP backend of an established e-commerce platform, mainly on [area Brad confirms]." |

## Rules for agents

- When drafting, mark any sentence you could not source from Brad with an `UNVERIFIED: ask Brad` marker, and list these in your report. Remove the markers only once Brad confirms. The syntax depends on the file:
  - In `.astro` files, use a JSX comment: `{/* UNVERIFIED: ask Brad */}`. The build drops it, so it stays in source only. An HTML comment in an `.astro` file is published, and `npm run check` fails if one reaches the built output. The same goes for `{/* Source: ... */}` notes.
  - In Markdown content (for example `src/content/work/`), use an HTML comment: `<!-- UNVERIFIED: ask Brad -->`. Drafts are excluded from production builds, so this is safe while `draft: true` is set.
  - Keep the exact text `UNVERIFIED: ask Brad` in both, so that one grep finds every marker.
- Do not round up. "Several" is not "many". "Helped" is not "led".
- Do not copy a confident tone from other portfolios. Plain beats impressive.
- If a draft sounds better than what Brad told you, it is probably overstated. Tone it down.
- Describe this site's own build honestly: built with Claude Code, with Brad directing, reviewing and deciding what ships.

Run the `claims-check` skill on any change to prose, case studies or the CV before it is handed to Brad.
