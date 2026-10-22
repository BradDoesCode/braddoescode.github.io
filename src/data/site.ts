// Site-wide constants. Personal facts for the CV live in cv.ts, not here.
export const siteName = 'Bradley Barbrook';
export const githubUrl = 'https://github.com/BradDoesCode';
export { linkedinUrl } from './cv';
export const repoUrl = 'https://github.com/BradDoesCode/braddoescode.github.io';

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Work', href: '/work/' },
  { label: 'CV', href: '/cv/' },
  { label: 'About this site', href: '/about-this-site/' },
] as const;

// Served as a <meta http-equiv> tag, because GitHub Pages gives no control of
// response headers. Production builds only: Astro's dev server injects inline
// scripts that this policy would block. See .claude/rules/site-standards.md.
export const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self'",
  "script-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');
