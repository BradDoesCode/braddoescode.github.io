---
name: site-quality-check
description: Use after changes to layout, styling, components, pages, images or the CV, and before pre-publish, to check accessibility, responsive layout, broken links, HTML validity, performance budget and visual quality, including a local Lighthouse run and a light and dark mode check in a browser.
---

# Site quality check

A quality check for the built site, measured against `.claude/rules/site-standards.md`. Run against the built output served locally, not the dev server. Do not push, deploy or open PRs.

If the site has not been scaffolded yet (no `package.json`), say so and review only what exists.

## Setup

1. `npm run build`, then `npm run preview` in the background. Note the local URL.
2. Make a list of page types: landing, work listing, one case study, CV (on screen and in print preview), 404. Review each, not only the home page.
3. Stop the preview server when done.

## Checks

1. **Automated gate.** Run `npm run check` and report each part separately: `astro check`, build, HTML validation, internal links, accessibility pass. Report failures verbatim, briefly.
2. **Accessibility.**
   - Automated results from the project's pa11y-ci or axe run.
   - By hand: tab through every page. Focus is always visible, order is sensible, the skip link works, nothing traps focus.
   - One `h1`, no skipped heading levels, landmarks present, `lang="en-GB"` set.
   - Link text makes sense out of context. Alt text is present and sensible; decorative images have empty alt.
   - Contrast in both colour schemes. Target size at least 24 px.
3. **Responsive layout.** Check at 320, 375, 768 and 1280 px wide. No horizontal scroll at 320 px (check code blocks, tables, long words and URLs). Text remains readable at 200% zoom.
4. **Links.** Internal links all resolve (including anchors). External links: spot-check they load, and that each has `rel="noopener noreferrer"`.
5. **HTML validity.** Validator output clean, or each warning explained.
6. **Performance budget.**
   - Total JavaScript under about 100 KB (report the real number).
   - Images optimised through Astro assets, with width, height and no layout shift.
   - Fonts self-hosted and few.
7. **Lighthouse.** Run locally against the preview, for example `npx lighthouse http://localhost:4321/ --only-categories=performance,accessibility,best-practices,seo --output=json --chrome-flags="--headless"`. Do it for each page type. The target is 95 or more in every category. Report the real scores and the top failing audits.
8. **Visual check in a browser** (use the Browser pane or Chrome tools if available).
   - Take screenshots in **light** and **dark** mode (emulate `prefers-color-scheme`) at mobile and desktop widths.
   - Look for clipped text, overlapping elements, unreadable contrast, broken images, awkward wrapping.
   - Emulate `prefers-reduced-motion` and confirm motion stops.
   - Open `/cv/` in print preview and check it fits cleanly on A4.
9. **Meta.** Unique `<title>` and meta description per page, correct canonical URL, favicon, social preview image without private content.

## Verdict

- **Pass:** all targets met.
- **Pass with notes:** minor misses (for example one Lighthouse score at 93) that Brad can accept.
- **Fail:** accessibility failure, horizontal scroll at 320 px, broken link, invalid HTML, or JS budget exceeded.

## Output format

```
Site quality check: <verdict>

Automated gate: astro check / build / html / links / a11y - <pass or fail each>
Lighthouse (perf / a11y / best practice / SEO)
- <page>: 98 / 100 / 100 / 100
Findings
- [severity] <page> <what> - <suggested fix>
Visual check: light <ok/notes>, dark <ok/notes>, mobile <ok/notes>, print <ok/notes>
Not checked: <anything skipped, and why>
```

Do not report scores or checks that were not run. If a browser is not available, say the visual check was not done.
