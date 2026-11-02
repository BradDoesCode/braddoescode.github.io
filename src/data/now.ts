// The home page's "Now" section. Refresh it every month or two: edit the items
// and change `updated` (YYYY-MM). It is the only place this content lives.
// Source: confirmed by Brad in chat (2 November 2026).
export const now = {
  updated: '2026-11',
  items: [
    {
      label: 'At work',
      text: 'Building the orders side of our customer portal, including order and delivery tracking for customers.',
    },
    { label: 'Learning', text: 'More about AI tooling, and how to get the best out of it.' },
    { label: 'Outside work', text: 'Gaming, and time with my family.' },
  ],
  // The link wraps `link`; `rest` follows it. Together they read as one sentence.
  closing: { link: 'Happy to talk', rest: ' about interesting roles in AI-assisted engineering.' },
} as const;

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// "2026-11" becomes "November 2026".
export function formatMonth(value: string): string {
  const [year, month] = value.split('-');
  return `${months[Number(month) - 1]} ${year}`;
}
