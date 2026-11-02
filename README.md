# braddoescode.github.io

This is the source of my portfolio site. If you are here to see my work, start with the site itself.

**[braddoescode.github.io](https://braddoescode.github.io)**

- [My CV](https://braddoescode.github.io/cv/)
- [How this site is built](https://braddoescode.github.io/about-this-site/)

## How it is built

The site is made with [Astro](https://astro.build) and is static: plain HTML and CSS, with no JavaScript sent to the browser. The fonts are served from the site itself. A strict Content-Security-Policy is set on every page, and there are no cookies, analytics or trackers.

I build the site with Claude Code, Anthropic's coding assistant. Claude Code writes the code. I choose what to build, judge the designs, review what comes back and decide what is published.

The instructions Claude Code works under are in this repository: [`CLAUDE.md`](CLAUDE.md), the written rules in [`.claude/rules/`](.claude/rules/) and the skills in [`.claude/skills/`](.claude/skills/). `CLAUDE.md` is the best place to see the stack, the commands and the non-negotiables, so I have not repeated them here.

## Checks

`npm run check` is the single local gate. It runs offline and fails if any stage fails: type checks, the build, assertions about the built output, HTML validation, internal links, and accessibility (WCAG 2.2 AA) in both light and dark colours. There is no CI by choice. Everything runs on my own machine, and I publish the built site to the `gh-pages` branch myself.

## Running it locally

You need Node 22.23.4 or newer, which is what `engines` in `package.json` asks for.

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build the site into `dist/`:

```bash
npm run build
```

Run all the checks:

```bash
npm run check
```

The build also needs Chrome, which `puppeteer` installs, to make the CV PDF from the built CV page.
