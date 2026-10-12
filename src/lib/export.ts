/**
 * A routine as a workbook to train from on paper: a sheet per day, a row per
 * set, and a blank weight/reps column for every week. Pure: no Prisma.
 */

import { dictionaries, type Translate } from '@/i18n/config';
import ExcelJS from 'exceljs';
import { TECHNIQUES, type Technique } from './constants';
import { formatReps, type RepSpec } from './reps';
import { setKind, setPlaces } from './sets';
import type { PlannedSet } from './validate';

export type ExportRoutine = {
    name: string;
    durationWeeks: number | null;
    workouts: {
        name: string;
        exercises: { name: string; sets: PlannedSet[] }[];
    }[];
};

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
    const weeks = routine.durationWeeks ?? OPEN_WEEKS;
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
    the sheet's own `"`. Only a complete routine is exported, so they are set. */
function repRange(set: RepSpec, t: Translate): string {
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

function underline(row: ExcelJS.Row, width: number) {
    for (let c = 1; c <= width; c += 1) row.getCell(c).border = line;
}
