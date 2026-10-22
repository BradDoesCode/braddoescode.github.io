# Workflow

How agents work in this repo. Brad decides what ships; agents prepare it.

## Hard limits

- **Never push.** No `git push` to any remote or branch, including force pushes.
- **Never deploy.** Do not publish to `gh-pages`, run a deploy script, or change Pages settings.
- **Never open a PR**, or use `gh` to create, merge or comment on one.
- **Never create `.github/workflows`**, or any other CI config (no `.gitlab-ci.yml`, no hooks that call remote services). Brad does not want GitHub Actions. All builds and checks run locally.
- Do not rewrite history on a branch Brad may have already seen, and do not touch `main` directly.
- Do not install global tools or change git or editor config without asking.

If a task seems to need one of these, stop and ask.

## Branches and commits

- **One branch per piece of work**, from an up-to-date `main`, named `type/short-description`: `content/case-study-ai-platform`, `cv/update-2026-10`, `fix/print-page-margins`, `setup/agent-rules`.
- **Small commits**, each one coherent and building on its own. Do not mix content, styling and tooling in one commit.
- **Commit message style:** imperative mood, subject under 72 characters, no full stop. A short body says why, not what, when the reason is not obvious.
  - Good: `Add case study on reviewing agent-written code`
  - Good: `Fix horizontal scroll on CV page at 320px`
  - Bad: `updates`, `WIP`, `Fixed stuff`
- Commit messages are public and fall under `confidentiality.md`. Describe the site change, never the employer-side material behind it.
- End each commit message with the attribution trailer Claude Code is configured to use.
- Never commit `node_modules/`, `dist/`, `.env`, editor files or OS junk. Check `.gitignore` before the first `git add`.
- Stage specific paths. Avoid `git add -A` until you have checked `git status`.

## Checks

- Run `npm run check` locally before reporting work as done (see `CLAUDE.md` for what it runs).
- Report real results. If a check was not run or could not run, say that. Never describe a failing check as passing.

## Which checks to run

Run checks in proportion to the change, then report the verdicts to Brad.

| Change | Run |
| --- | --- |
| Typo, punctuation, or wording with no new claim | Nothing beyond `npm run check` |
| New or changed prose, a case study, or CV entries | `claims-check` and `privacy-check` |
| New or changed images, screenshots or alt text | `privacy-check` and `site-security-check` (metadata) |
| Layout, CSS, components, accessibility | `site-quality-check` |
| Dependencies, scripts, CSP, build config, new external link or asset | `site-security-check` and `site-quality-check` |
| Anything about to be deployed | `pre-publish`, which runs what is proportionate to the whole diff since the last deploy |

When in doubt, run the check. When the change is obviously trivial, say you judged it trivial and why.

## Finishing

When you believe the work is complete, stop and report:

1. The branch name and commit hashes.
2. What changed, in a few lines.
3. Check verdicts, and any items flagged for Brad.
4. What you did not check.
5. Open questions or facts you needed but did not have.

Then wait. Do not prepare a PR description or deploy steps unless asked; `pre-publish` covers the handover.
