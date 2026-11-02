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

export interface CvProject {
  name: string;
  /** Display string, as written on the CV. */
  year: string;
  summary: string;
  /** Internal path to the case study, if one is published. */
  url?: string;
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
  projects: CvProject[];
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
    "I'm part of the team building Pollards' new internal platform, working on customer-facing apps and internal tools. Before that I worked on the PHP backend of an established e-commerce print platform. Earlier, I did full-stack and Flutter mobile development.",
  ],

  skills: [
    {
      group: 'AI-assisted engineering',
      items: ['Claude Code', 'Reviewing AI-written code'],
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
        "Since April 2026 I've been part of the team building Pollards' new internal platform. It's still in development. We build it with AI coding agents (Claude Code).",
        "The work is split by area of the business. My area runs from prepress to the customer receiving their order. I've worked across the stack, on customer-facing apps such as the customer portal and on internal tools for customer service and the shop floor. One is a customer service dashboard: some of the team use it to see problems with jobs before the customer calls.",
        "Before that, from June 2025, I worked on the PHP backend of an established e-commerce print platform, in Yii2 and Vue.js. I cut about 400ms from every page load by removing some of the data each page loaded and speeding up how the rest was fetched.",
      ],
    },
    {
      title: 'Software Developer',
      organisation: 'Digitwell Solutions',
      location: 'Devon',
      start: '2022',
      end: '2025',
      summary: [
        'I built mobile apps for iOS and Android, desktop applications and full-stack projects, working closely with the founder. I learned full-stack development there, mainly in Laravel.',
        'I learned Flutter and Dart from scratch. I researched modern alternatives to a long-standing legacy platform, made the case for Flutter and led the move to it, which made development faster and the apps perform better. I used Riverpod for state management and delivered a large-scale application.',
      ],
      note: "I started the role as an apprentice; the apprenticeship wasn't completed. The work was at junior-to-mid level.",
    },
  ],

  earlierExperience: [
    {
      title: 'Retail and team-leading roles',
      start: '2012',
      end: '2022',
      summary:
        "Including Apple Authorised Reseller (Dixons Travel) and Team Leader (Co-op). I still use what I learned there about talking to customers and leading a team.",
    },
  ],

  projects: [
    {
      name: 'Runedex',
      year: '2025',
      summary:
        'A Flutter app for Android and iOS that I built on my own in about five months, from April to August 2025.',
      url: '/work/runedex/',
    },
    {
      name: 'FiveM roleplay server',
      year: '2022',
      summary:
        'A British-themed roleplay server for GTA V. I wrote its scripts in Lua and ran the community, which grew to more than 1,000 members. At its peak it was full at 64 players every night.',
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

  interests: ['Flutter apps', 'Gaming', 'Camping and mountain biking'],

  // The date of the last real update to this file. The update-cv skill sets
  // it each time the content changes.
  lastUpdated: '2026-11-02',
};
