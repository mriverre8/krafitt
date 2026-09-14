/**
 * The date arithmetic behind the training-year grid. All of it in UTC: the grid
 * is rendered on the server and hydrated on the client, and a local timezone
 * would put the two a day apart.
 */

export const DAY_MS = 86_400_000;

/** A day as the `days` map keys it: `YYYY-MM-DD`. */
export const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export const utc = (year: number, month: number, day: number) =>
    Date.UTC(year, month, day);

/** Monday = 0, so the week starts where the calendar in every locale we ship does. */
export const weekday = (time: number) => (new Date(time).getUTCDay() + 6) % 7;

/** Which of the four fills a day gets, from how many sets were logged. */
export function trainingLevel(sets: number) {
    if (sets === 0) return 0;
    if (sets < 10) return 1;
    if (sets < 18) return 2;
    return 3;
}
