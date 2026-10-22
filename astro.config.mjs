// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// User site on GitHub Pages: served from the domain root, so no `base`.
export default defineConfig({
  site: 'https://braddoescode.github.io',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Keep all CSS in external files so the CSP can use `style-src 'self'`.
    inlineStylesheets: 'never',
  },
  markdown: {
    // Shiki writes colours as inline style="" attributes, which the CSP
    // (style-src 'self') blocks. Code blocks are styled by global.css instead.
    syntaxHighlight: false,
  },
  integrations: [sitemap()],
});
