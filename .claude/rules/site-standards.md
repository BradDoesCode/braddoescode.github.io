# Site standards

Technical and quality standards for the built site. Stack choices live in `CLAUDE.md`; this file says what the output must be like.

## Static and private by design

- **Static output only.** No server code, no runtime API calls, no forms that post to a backend.
- **No analytics, trackers, cookies, or fingerprinting.** No consent banner is needed because nothing needs consent. Do not add one.
- **No third-party runtime scripts, fonts, embeds or CDNs** unless justified in the commit message and in the description Brad will use for the merge. Self-host fonts (WOFF2, subsetted). If a third-party script is ever approved, pin it with Subresource Integrity and add its origin to the CSP.
- **No contact forms.** Use a plain `mailto:` link or a link to a profile. Do not scrape or obfuscate Brad's address with fake tricks; ask Brad which public contact to show.

## Accessibility (WCAG 2.2 AA)

- Semantic HTML first: `header`, `nav`, `main`, `section`, `article`, `footer`, real `button` and `a`. ARIA only to fill gaps.
- One `h1` per page, no skipped heading levels, a visible "Skip to main content" link.
- Fully usable with keyboard alone. Visible focus indicators that meet contrast. Tab order follows reading order.
- Works with a screen reader: landmarks labelled where there are several, meaningful link text, alt text per `writing-style.md`.
- Colour contrast at least 4.5:1 for text, 3:1 for large text and UI components. Never use colour as the only signal.
- Target size at least 24 by 24 CSS pixels. Text resizes to 200% without loss.
- Respect `prefers-reduced-motion`: no motion, parallax or auto-play when it is set. Keep animation minimal anyway.
- Respect `prefers-color-scheme`: provide light and dark themes via CSS custom properties. Both must pass contrast.
- Set `lang="en-GB"` on the root element.

## Layout

- **Mobile-first.** Base styles are for small screens, wider layouts are added with `min-width` queries.
- **No horizontal scroll at 320px wide**, including code blocks, tables and long URLs (wrap or scroll inside their own container).
- Use relative units for type and spacing. Do not disable zoom.

## Performance budget

- Under about **100 KB of JavaScript in total**, uncompressed ceiling. Default target is zero for most pages.
- Images through Astro's asset pipeline (`astro:assets`): responsive sizes, modern formats, explicit width and height, `loading="lazy"` below the fold, no layout shift.
- Fonts: at most two families or variable files, `font-display: swap`, preload only the one used above the fold.
- **Lighthouse 95 or more on all four categories** (performance, accessibility, best practices, SEO) is the target for every page type. Report real scores. Do not claim a pass that was not run.

## Security headers and links

- Provide a **Content-Security-Policy via `<meta http-equiv>`**, since Pages gives no header control. Start strict: `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'self'; form-action 'none'`. Loosen only with a stated reason. Astro inlines small stylesheets by default, so set `build.inlineStylesheets: 'never'` to keep `style-src 'self'` valid. (`frame-ancestors` is ignored in a meta tag; do not rely on it.)
- Add `<meta name="referrer" content="strict-origin-when-cross-origin">`.
- Every external link carries `rel="noopener noreferrer"`. Use one shared link component so this cannot be forgotten.
- No inline event handlers. Avoid inline scripts; if one is needed, hash it in the CSP rather than using `'unsafe-inline'`.

## Output

- Build output must include an empty `.nojekyll` file at its root (see `CLAUDE.md`).
- The printable CV is a print stylesheet on `/cv/`, not a separate page: no navigation, black on white, sensible page breaks, link URLs readable in print. It is the same page, so it uses the same data source as the on-site CV.
- Provide a `404.html`, `robots.txt` and a sitemap. Page titles and meta descriptions are unique per page.
- Do not publish anything that is not a page asset: no source maps with private paths, no `.env`, no editor files.

Checks for these standards are run by the `site-quality-check` and `site-security-check` skills.
