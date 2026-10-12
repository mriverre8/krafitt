/**
 * A routine as a workbook to train from on paper: a sheet per day, a row per
 * set, and a weight/reps column for every week — blank to fill in, or filled
 * with what has been trained so far. Pure: no Prisma.
 */

import { dictionaries, type Translate } from '@/i18n/config';
import ExcelJS from 'exceljs';
import { TECHNIQUES, type Technique } from './constants';
import type { Effort, Logs, SetValue } from './progress';
import { formatReps, isSetComplete, isTimed, type RepSpec } from './reps';
import { setKind, setPlaces } from './sets';
import type { PlannedSet } from './validate';

export type ExportRoutine = {
    name: string;
    durationWeeks: number | null;
    workouts: {
        name: string;
        exercises: { id: string; name: string; sets: PlannedSet[] }[];
        /** What was trained, by week: fills the log columns and the dates. */
        weeks?: Record<number, TrainedWeek | undefined>;
    }[];
};

export type TrainedWeek = { startedAt: Date; logs: Logs };

/** Columns an open-ended routine gets: it has no last week to stop at. */
const OPEN_WEEKS = 10;

/** Columns before the weeks: exercise, sets, reps, technique. */
const PLAN_COLUMNS = 4;

/** In points: Excel's own 15 leaves no room to write a weight in by hand. */
const ROW_HEIGHT = 24;

const line: Partial<ExcelJS.Borders> = { bottom: { style: 'thin' } };

const ABBREVIATIONS: Record<Technique, string> = {
    warmup: 'WUP.',
    linear: 'S.S.',
    topset: 'T.S.',
    backoff: 'B.O.',
};

/** A preset's label, in every language it may have been picked in, to its
    abbreviation: the set keeps the label, not the key. */
const SHORT = new Map(
    Object.values(dictionaries).flatMap((dict) =>
        TECHNIQUES.map((key): [string, string] => [
            dict[`technique.${key}`].toLowerCase(),
            ABBREVIATIONS[key],
        ])
    )
);

/**
 * What Excel will take as a sheet name: at most 31 characters, none of
 * `\ / ? * : [ ]`, and no two alike — it compares them ignoring case.
 */
export function sheetNames(names: string[]): string[] {
    const taken = new Set<string>();
    return names.map((raw, index) => {
        const base =
            raw
                .replace(/[\\/?*:[\]]/g, ' ')
                .trim()
                .replace(/^'+|'+$/g, '') || String(index + 1);
        let name = base.slice(0, 31);
        for (let n = 2; taken.has(name.toLowerCase()); n += 1) {
            const suffix = ` (${n})`;
            name = base.slice(0, 31 - suffix.length) + suffix;
        }
        taken.add(name.toLowerCase());
        return name;
    });
}

export async function routineWorkbook(
    routine: ExportRoutine,
    t: Translate
): Promise<Uint8Array<ArrayBuffer>> {
    const book = new ExcelJS.Workbook();
    // An open-ended routine trained past its default columns gets as many as
    // it has weeks to show.
    const weeks = Math.max(
        routine.durationWeeks ?? OPEN_WEEKS,
        ...routine.workouts.flatMap((w) =>
            Object.keys(w.weeks ?? {}).map(Number)
        )
    );
    const width = PLAN_COLUMNS + weeks;
    const names = sheetNames(routine.workouts.map((w) => w.name));

    routine.workouts.forEach((workout, index) => {
        const sheet = book.addWorksheet(names[index], {
            // Printed on one landscape page, scaled to fit it, with the grid
            // to write the weights in.
            pageSetup: {
                paperSize: 9, // A4
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 1,
                showGridLines: true,
            },
            // The routine's name above the table, centred in the page header.
            // `&` is the header's own escape, so a name's must be doubled.
            headerFooter: {
                oddHeader: `&C&"-,Bold"&14- ${routine.name.replaceAll('&', '&&')} -`,
            },
        });
        sheet.columns = [
            { width: 40 },
            { width: 8 },
            { width: 14 },
            { width: 18 },
            ...Array.from({ length: weeks }, () => ({ width: 14 })),
        ];
        const weekColumns = Array.from({ length: weeks }, (_, i) => i + 1);

        sheet.getRow(3).values = [
            workout.name,
            '',
            '',
            '',
            ...weekColumns.map((n) => t('export.day', { n })),
        ];
        sheet.getRow(3).font = { bold: true, size: 12 };
        sheet.getCell('A3').font = { bold: true, size: 16 };
        sheet.getCell('D4').value = t('export.date');
        for (const week of weekColumns) {
            const started = workout.weeks?.[week]?.startedAt;
            if (started)
                sheet.getCell(4, PLAN_COLUMNS + week).value = dayOf(started);
        }

        const header = sheet.getRow(6);
        header.values = [
            t('export.exercise'),
            t('export.sets'),
            t('export.reps'),
            t('export.technique'),
            ...weekColumns.map(() => t('export.weightReps')),
        ];
        for (let c = 1; c <= PLAN_COLUMNS; c += 1)
            header.getCell(c).font = { bold: true };
        underline(header, width);

        for (const exercise of workout.exercises) {
            sheet.addRow([]);
            // A row per set, drops and rest-pauses included; only the
            // working sets are counted.
            const working = setPlaces(exercise.sets).filter(
                (place) => place.kind === 'normal'
            ).length;
            exercise.sets.forEach((set, i) => {
                const row = sheet.addRow([
                    i === 0 ? exercise.name.toLocaleUpperCase() : '',
                    i === 0 ? working : '',
                    repRange(set, t),
                    technique(set),
                    ...weekColumns.map((week) => {
                        const value =
                            workout.weeks?.[week]?.logs[exercise.id]?.[i];
                        return value ? logged(value, set.repMode) : null;
                    }),
                ]);
                if (i === 0) row.getCell(1).font = { bold: true };
                if (i === exercise.sets.length - 1) underline(row, width);
            });
        }

        // Blank rows too: they are the gaps between exercises. The two above
        // the day's name are only a margin, and keep Excel's height.
        sheet.eachRow({ includeEmpty: true }, (row, number) => {
            if (number < 3) return;
            row.height = ROW_HEIGHT;
            for (let c = 1; c <= width; c += 1)
                row.getCell(c).alignment = {
                    vertical: 'middle',
                    horizontal: c === 1 ? 'left' : 'center',
                };
        });
    });

    return new Uint8Array(await book.xlsx.writeBuffer());
}

/** The bare numbers: the column header already says reps, and seconds carry
    the sheet's own `"`. A set left unfinished says so, as the app does. */
function repRange(set: RepSpec, t: Translate): string {
    if (!isSetComplete(set)) return formatReps(set, t);
    switch (set.repMode) {
        case 'range':
            return `${set.repMin}-${set.repMax}`;
        case 'fixed':
            return String(set.repMin);
        case 'time':
            return `${set.repMin}"`;
        default:
            return formatReps(set, t);
    }
}

/** A working set's own technique; a drop or rest-pause by its short name. */
function technique(set: PlannedSet): string {
    switch (setKind(set)) {
        case 'drop':
            return set.value == null ? 'D.S.' : `D.S. (${set.value}%)`;
        case 'rest':
            return `R.P. (${set.value}")`;
        default: {
            const written = set.technique?.trim() ?? '';
            return SHORT.get(written.toLowerCase()) ?? written;
        }
    }
}

/** DD/MM/YYYY, in UTC as the training calendar reads days
    (`lib/training-year.ts`). */
export function dayOf(date: Date): string {
    const [year, month, day] = date.toISOString().slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
}

/** How a set felt, as a mark raised over its reps. A normal set has none, as
    in the app. Superscript characters rather than a superscript font: Google
    Sheets drops the font on import, the characters survive anywhere. */
const EFFORT_MARK: Partial<Record<Effort, string>> = {
    fail: 'ˣ',
    hard: '⁻',
    easy: '⁺',
};

/** `82.5/8`, seconds as `45"`, and the effort raised after: `82.5/8ˣ`. */
function logged(value: SetValue, repMode: string): string {
    const reps = isTimed(repMode) ? `${value.reps}"` : value.reps;
    const mark = (value.effort && EFFORT_MARK[value.effort]) ?? '';
    return `${value.weight}/${reps}${mark}`;
}

/** The workbook as a download named after the routine. */
export function xlsxResponse(bytes: Uint8Array<ArrayBuffer>, name: string) {
    return new Response(bytes, {
        headers: {
            'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(name)}.xlsx`,
        },
    });
}

function underline(row: ExcelJS.Row, width: number) {
    for (let c = 1; c <= width; c += 1) row.getCell(c).border = line;
}
