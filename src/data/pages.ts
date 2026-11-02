// Title and description for each page that is not a case study. The page and
// its link-preview card (src/pages/og/[...slug].png.ts) both read this, so
// the card can only ever say what the page says. Case studies take theirs from
// their own front matter.
export const staticPages = {
  home: {
    title: 'Home',
    description: 'Portfolio of Bradley Barbrook, a software developer in Barnstaple, Devon.',
  },
  cv: {
    title: 'CV',
    description:
      'Curriculum vitae of Bradley Barbrook, software developer: profile, skills, experience and education.',
  },
  'about-this-site': {
    title: 'About this site',
    description: 'How this site is built and checked, how Claude Code and I share the work, and the choices behind how it looks.',
  },
  work: {
    title: 'Work',
    description: 'Case studies by Bradley Barbrook, listed newest first, and a chart of how my weekly pace changed.',
  },
  '404': {
    title: 'Page not found',
    description: 'The page you asked for does not exist on this site.',
  },
} as const;
