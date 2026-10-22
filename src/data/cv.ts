// The single source of truth for the CV. The on-site CV page (/cv/) renders
// this file and nothing else, and the print stylesheet formats that same page.
// Update it with the `update-cv` skill. Never hard-code CV content in a page.
//
// Deliberately absent: phone number, home address and email address. The
// location is town and county only. Do not add contact details here without
// Brad confirming which ones are meant to be public.

// The LinkedIn address is defined here, because this file must stay free of
// imports (scripts/cv-flags.mjs loads it on its own), and site.ts re-exports it
// so the footer and the home page use the same one.
export const linkedinUrl = 'https://www.linkedin.com/in/brad-barbrook-89896829a';

export interface CvLink {
  label: string;
  url: string;
}

export interface CvBasics {
  name: string;
  /** Town and county only. */
  location: string;
  links: CvLink[];
}

export interface CvSkillGroup {
  group: string;
  items: string[];
}

export interface CvRole {
  title: string;
  organisation: string;
  location: string;
  /** Display strings, as written on the CV, for example "June 2025". */
  start: string;
  /** Display string, or "Present". */
  end: string;
  /** One entry per paragraph. */
  summary: string[];
  /** An extra line shown under the role, as written on the CV. */
  note?: string;
  /**
   * Set when the text is known to be out of date. The reason is for Brad and
   * for agents; the CV page shows it in dev builds only. `npm run check`
   * warns while it is set and `pre-publish` blocks on it. Clear it when the
   * entry has been rewritten with Brad (the `update-cv` skill does this).
   */
  needsUpdate?: string;
}

export interface CvEarlierRole {
  title: string;
  start: string;
  end: string;
  summary: string;
}

export interface CvEducation {
  institution: string;
  qualification: string;
  start: string;
  end: string;
}

export interface Cv {
  basics: CvBasics;
  /** One entry per paragraph. */
  profile: string[];
  skills: CvSkillGroup[];
  /** Reverse chronological order. */
  experience: CvRole[];
  earlierExperience: CvEarlierRole[];
  education: CvEducation[];
  interests: string[];
  /** ISO date (YYYY-MM-DD) of the last edit to this file. */
  lastUpdated: string;
}

export const cv: Cv = {
  basics: {
    name: 'Bradley Barbrook',
    location: 'Barnstaple, Devon',
    links: [
      { label: 'GitHub', url: 'https://github.com/BradDoesCode' },
      { label: 'LinkedIn', url: linkedinUrl },
    ],
  },

  profile: [
    'I build software with AI coding agents, inside a structured engineering process where people make the design decisions and review what ships. The aim is speed without compromise on quality.',
    "I'm part of the team building Pollards' new internal platform, and I work across the stack, from customer-facing apps to internal tools. Before that I worked on the PHP backend of Brandhub, with earlier experience in full-stack and Flutter mobile development.",
  ],

  skills: [
    {
      group: 'AI-assisted engineering',
      items: ['Claude Code', 'AI-assisted development', 'Reviewing AI-written code'],
    },
    { group: 'Backend', items: ['PHP', 'Yii Framework', 'Laravel', 'MySQL'] },
    { group: 'Frontend', items: ['Vue.js', 'Livewire', 'HTML', 'CSS', 'JavaScript'] },
    { group: 'Mobile', items: ['Flutter', 'Dart'] },
    { group: 'Tools & Platforms', items: ['GitHub', 'Bitbucket', 'Firebase', 'Google Maps API'] },
    {
      group: 'Concepts',
      items: ['MVC', 'REST APIs', 'State Management (Riverpod)', 'Performance Optimisation'],
    },
  ],

  experience: [
    {
      title: 'Software Developer',
      organisation: 'Pollards Print',
      location: 'Exeter',
      start: 'June 2025',
      end: 'Present',
      summary: [
        "Since April 2026 I've been part of the team building Pollards' new internal platform, which is replacing the company's older systems. It's still in development. We build it with AI coding agents (Claude Code) inside a structured engineering process, with people making the design decisions and reviewing what ships.",
        "The work is split by area of the business. My area runs from prepress to the customer receiving their order, giving staff and customers a clearer view of where every job is. I've worked across the stack, on customer-facing apps such as the customer portal and on internal tools for customer service and the shop floor.",
        "Before that, from June 2025, I maintained and improved the PHP backend of Brandhub, the company's established e-commerce platform, working in Yii2 and Vue.js. Brandhub is now a legacy system, kept running while the new platform replaces it.",
      ],
    },
    {
      title: 'Software Developer',
      organisation: 'Digitwell Solutions',
      location: 'Devon',
      start: '2022',
      end: '2025',
      summary: [
        'I gained rounded experience building and maintaining applications and websites across multiple frameworks and environments. I designed and developed applications for iOS and Android, desktop applications, and full-stack projects, while collaborating closely with the founder and taking on a broad range of responsibilities to meet project goals.',
        'Flutter development became a key focus, learning the framework and Dart language from scratch. After researching and advocating for modern alternatives, I led the adoption of Flutter to replace a long-standing legacy platform, resulting in improved development speed and application performance. I worked extensively with state management, including Riverpod, to deliver a fully completed large-scale application.',
      ],
      note: 'Role originally undertaken as part of an apprenticeship programme (not completed). Responsibilities and output were equivalent to a junior-to-mid level software developer.',
    },
  ],

  earlierExperience: [
    {
      title: 'Various Technical & Leadership Roles',
      start: '2012',
      end: '2022',
      summary:
        'Including Apple Authorised Reseller (Dixons Travel) and Team Leader (Co-op). These roles developed strong customer communication, problem-solving, and leadership skills that continue to support my software development work.',
    },
  ],

  education: [
    {
      institution: 'University of Hertfordshire',
      qualification: 'Foundation Degree – Graphic Design',
      start: '2008',
      end: '2012',
    },
  ],

  interests: [
    'Building and experimenting with Flutter applications',
    'Gaming (competitive and cooperative)',
    'Camping, mountain biking, and outdoor activities',
  ],

  // The date of the last real update to this file. The update-cv skill sets
  // it each time the content changes.
  lastUpdated: '2026-10-22',
};
