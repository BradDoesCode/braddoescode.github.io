// schema.org Person data for the home page, so search engines can connect
// searches for Brad's name to this site. Home page only: see
// src/pages/index.astro. It holds only what Brad approved: name, job title,
// employer, town and county, the site's own URL and two public profiles. No
// email, phone number, street address, image or date of birth. `npm run check`
// enforces that and allows this one inline data block and no other inline script.
import { cv } from '../data/cv';
import { githubUrl, linkedinUrl } from '../data/site';

// Town and county come from cv.basics.location ("Town, County"), so there is
// one place to change them. The country is a constant: the CV holds none.
const [locality, region, ...extra] = cv.basics.location.split(',').map((part) => part.trim());
if (!locality || !region || extra.length > 0) {
  throw new Error(`person.ts expects cv.basics.location to be "Town, County", got "${cv.basics.location}"`);
}

// The name the CV is known by, and the public trading name of the employer
// (the CV's current role), not the company's legal name.
const alternateName = 'Brad Barbrook';
const jobTitle = 'Software Developer';
const employer = cv.experience[0]?.organisation;
if (!employer) throw new Error('person.ts expects the CV to list a current role');

export function personJsonLd(site: URL): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: cv.basics.name,
    alternateName,
    jobTitle,
    worksFor: { '@type': 'Organization', name: employer },
    address: {
      '@type': 'PostalAddress',
      addressLocality: locality,
      addressRegion: region,
      addressCountry: 'GB',
    },
    url: new URL('/', site).href,
    sameAs: [githubUrl, linkedinUrl],
  };
  // Inside a <script> element the browser ends the block at "</script>", so
  // "<" is written as a JSON escape. The parsed data is the same.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
