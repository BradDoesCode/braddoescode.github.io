---
name: site-security-check
description: Use after changes to dependencies, scripts, CSP, build config, images, external links or the CV, and before pre-publish, to check the static site for secrets, personal data exposure, third-party scripts, link safety, dependency vulnerabilities and anything sensitive in the built output. Read-only apart from running audit commands.
---

# Site security check (static site)

A security check for a static personal site. There is no server, so the risks are: leaked secrets, leaked personal data, risky third-party code, weak browser protections and a vulnerable build chain. Standards are in `.claude/rules/site-standards.md`. Confidentiality of employer work is a separate check (`privacy-check`); mention overlaps but do not skip that skill.

This skill does not fix things. It reports. Do not push, deploy or open PRs.

## Checks

1. **Secrets and tokens.**
   - Search the working tree and history: `git log -p --all | rg -i "<pattern>"`, or `rg -i "(api[_-]?key|secret|token|password|bearer|BEGIN (RSA|OPENSSH|PRIVATE))"`.
   - Check no `.env*`, key files or credentials are tracked (`git ls-files`).
   - If a real secret is in history, tell Brad immediately. The secret must be rotated, and whether to rewrite history is Brad's call.
2. **Personal data exposure.**
   - No phone number or home address anywhere (CV data, pages, metadata, `humans.txt`, structured data).
   - Personal email appears only if Brad chose it. Check it is not scraped from elsewhere, and consider that any address on a public page will be harvested.
   - Images: EXIF GPS, device, author and software fields stripped. Use `exiftool` if available, and report if not.
   - No local file paths or usernames in source maps, comments or build output.
3. **Third-party scripts and assets.**
   - Search the built HTML and source for external `src`, `href`, `@import`, `url(` and `fetch` calls to other origins. The default is none (see `site-standards.md`).
   - Any that exist must be justified in the commit message, pinned, and use Subresource Integrity with `crossorigin`. Fonts must be self-hosted.
   - No analytics, trackers, tag managers, chat widgets or embeds.
4. **Content Security Policy.**
   - A CSP meta tag exists on every page and matches the standard. No `'unsafe-inline'` or `'unsafe-eval'` in `script-src`. Any inline script is hashed.
   - Origins in the CSP match what the pages actually load, no wildcard origins.
5. **External links.** Every link to another origin has `rel="noopener noreferrer"`. Check the built HTML, for example `rg '<a [^>]*href="https?://' dist | rg -v 'noopener'`.
6. **Dependencies.**
   - `npm audit` (once `package.json` exists). Report severity, whether the vulnerable package is in the build chain or the output, and whether a fix is available.
   - Lockfile committed. No unpinned `latest` versions. No install scripts from unfamiliar packages. List any new dependency and why it is needed.
7. **Built output.**
   - After `npm run build`, inspect `dist/` for files that should not be published: source maps, `.env`, notes, drafts (`draft: true` content), editor files, unused large assets.
   - `.nojekyll` present at the root.
   - No secrets or private paths in the HTML, JS or CSS.
8. **`.gitignore` coverage.** Covers `node_modules/`, `dist/`, `.env*`, `.DS_Store`, editor directories, local tool caches and logs. Note the existing `.gitignore` is a Jekyll template and should be replaced when the site is built.
9. **Repo configuration.** No `.github/workflows` or other CI (a breach of `CLAUDE.md`). No committed hooks that call remote services.

## Verdict

Use: **clear**, **needs Brad's attention** (non-blocking findings), or **must fix** (secret, personal data, unjustified third-party script, high-severity reachable vulnerability).

## Output format

```
Site security check: <verdict>

Must fix
- <area> <file/path> - <finding> - <suggested fix>

Needs Brad's attention
- ...

Checked
- secrets (tree and history), personal data, third-party assets, CSP, external links, npm audit, dist contents, .gitignore

Not checked
- <anything skipped, and why>
```

Report real command output summaries. If a tool is missing or the site does not exist yet, say so rather than reporting a pass.
