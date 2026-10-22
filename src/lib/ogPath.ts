// Where a page's link-preview card lives. A page at /work/some-study/ has its
// card at /og/work/some-study.png; the home page's is /og/home.png. The card
// endpoint (src/pages/og/[...slug].png.ts) generates one for each slug, and
// the layout points og:image at it, so both must use this.
export function cardSlug(pathname: string): string {
  const slug = pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
  return slug === '' ? 'home' : slug;
}

export function cardPath(pathname: string): string {
  return `/og/${cardSlug(pathname)}.png`;
}
