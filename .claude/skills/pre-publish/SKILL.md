---
name: pre-publish
description: Use when Brad says the work is ready to publish or asks for the pre-deploy check. Runs npm run check and the check skills proportionate to the change, summarises the results, then stops and hands Brad the deploy command. Never deploys, pushes or opens a PR itself.
---

# Pre-publish gate

The last step before Brad deploys. It collects evidence and hands over. **It never deploys, pushes, opens a PR or edits the `gh-pages` branch.** Brad runs the final command.

Read `CLAUDE.md` (deploy model) and `.claude/rules/workflow.md` (which checks match which changes).

## 1. Establish what is shipping

- Confirm the branch and that the working tree is clean (`git status`). Uncommitted changes: stop and say so.
- List the change since the last deploy: `git diff --stat main...HEAD` (or against the last published commit if Brad names one). Group it into content, CV, images, styling, dependencies, config.
- Grep the **source** for `UNVERIFIED` (`grep -rn UNVERIFIED src`). It appears as `{/* UNVERIFIED: ask Brad */}` in `.astro` files and `<!-- UNVERIFIED: ask Brad -->` in Markdown, and the built HTML must never contain it, so a source grep is the only way to see the markers. Any hit blocks publishing until Brad resolves it.
- Run `node scripts/cv-flags.mjs`. Any CV entry flagged `needsUpdate` in `src/data/cv.ts` **blocks publishing**: the text is known to be stale. `npm run check` only warns about it, so this skill is where it becomes a blocker. Stop and tell Brad which entries are flagged. Do not clear the flag to get past it; the `update-cv` skill clears it once Brad has confirmed new text.
- Read `generatedAt` in `src/data/activity.json`. If it is more than 7 days old, tell Brad to run `npm run stats` and commit the refreshed data before the deploy command is handed over. Agents may run `npm run stats` themselves: it only makes read-only GitHub queries with the `gh` login. Do not edit the JSON by hand.
- Note anything in the diff marked `draft: true`. That blocks publishing until Brad resolves it.
- Confirm there is no `.github/workflows` directory and no CI config.

## 2. Run the checks

1. `npm run check`. Read the whole output, including the CV warning printed after the summary.
2. Run the check skills in proportion to the diff, following the table in `workflow.md`:
   - Any prose, case study or CV change: `claims-check` and `privacy-check`.
   - Any image, screenshot or alt text change: `privacy-check` and `site-security-check`.
   - Any layout, style or component change: `site-quality-check`.
   - Any dependency, script, CSP or build change: `site-security-check` and `site-quality-check`.
   - A first deploy, or a large mixed diff: all of them.
3. For a trivial change (typo or wording with no new claim), run `npm run check` and a short confidentiality scan of the changed lines only, and say you judged the rest unnecessary and why.

Use the verdict scale from each skill. Do not rerun a check that already ran on the same commit; cite it.

## 3. Verify the output

After `npm run build`:

- `dist/.nojekyll` exists and is empty.
- `dist/` contains no source maps, drafts, `.env`, or notes.
- `dist/_astro/` exists (it is why `.nojekyll` matters).
- `/cv/` is present and matches the CV data, and its print stylesheet is still in the built CSS.

## 4. Summarise and stop

Give Brad a decision-ready summary, then stop. If any verdict is **must fix**, **misleading** or **fail**, say clearly that it is not ready, list the blockers, and do not offer the deploy command.

If everything is clear or only has non-blocking notes, hand over the deploy command for Brad to run. Use the project's own deploy script (`npm run deploy` in `CLAUDE.md`; it builds, then publishes `dist/` to the `gh-pages` branch). Do not improvise a command: `dist/` is git-ignored, so a plain `git subtree push` of it will not work. Show the command in a code block as a suggestion, never run it, and state that it publishes publicly.

## Output format

```
Pre-publish: <ready / not ready>

Shipping: <branch>, <n commits>, <groups of change>
npm run check: <pass / fail / not available yet>
Checks run
- claims-check: <verdict>
- privacy-check: <verdict>
- site-security-check: <verdict or not needed, why>
- site-quality-check: <verdict or not needed, why>
Output checks: .nojekyll <ok>, no source maps <ok>, /cv/ print stylesheet <ok>
Blockers: <list or none>
Notes for Brad: <non-blocking items, open questions>

Deploy (run this yourself, it publishes publicly):
<command>
```

Do not run the command. Do not push the branch. Wait for Brad.
