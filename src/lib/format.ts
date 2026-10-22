const longDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "22 October 2026", as the writing style asks. */
export function formatDate(date: Date | string): string {
  return longDate.format(typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date);
}

/** YYYY-MM-DD for a <time datetime> attribute. */
export function isoDate(date: Date | string): string {
  return (typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date).toISOString().slice(0, 10);
}

/** "2026", for listings that only need the year. */
export function formatYear(date: Date | string): string {
  return isoDate(date).slice(0, 4);
}
