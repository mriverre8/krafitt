export const DAY_MS = 86_400_000;

export const dayKey = (date: Date) => date.toISOString().slice(0, 10);
export const utc = (year: number, month: number, day: number) =>
    Date.UTC(year, month, day);

export const weekday = (time: number) => (new Date(time).getUTCDay() + 6) % 7;

export const fills = ['bg-surface2', 'bg-volt/30', 'bg-volt/65', 'bg-volt'];

export function level(sets: number) {
    if (sets === 0) return 0;
    if (sets < 10) return 1;
    if (sets < 18) return 2;
    return 3;
}
