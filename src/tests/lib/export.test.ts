import { createT } from '@/i18n/config';
import { en } from '@/i18n/en';
import { routineWorkbook, sheetNames } from '@/lib/export';
import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

const t = createT(en);

const range = { repMode: 'range', repMin: 7, repMax: 10 };

async function read(bytes: Uint8Array) {
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(bytes.buffer as ArrayBuffer);
    return book;
}

const cells = (sheet: ExcelJS.Worksheet, row: number) =>
    (sheet.getRow(row).values as unknown[]).slice(1);

describe('sheetNames', () => {
    it('keeps what Excel takes, and makes the rest fit', () => {
        expect(
            sheetNames(['Push', 'push', 'Legs [A]/B', 'x'.repeat(40), ''])
        ).toEqual(['Push', 'push (2)', 'Legs  A  B', 'x'.repeat(31), '5']);
    });
});

describe('routineWorkbook', () => {
    it('lays out a sheet per day, a row per set, a column per week', async () => {
        const book = await read(
            await routineWorkbook(
                {
                    name: 'P&L',
                    durationWeeks: 3,
                    workouts: [
                        {
                            name: 'Day 5',
                            exercises: [
                                {
                                    id: 'e1',
                                    name: 'Curl',
                                    sets: [
                                        { ...range, technique: 'S.S.' },
                                        { ...range, kind: 'drop', value: 20 },
                                        {
                                            repMode: 'amrap',
                                            repMin: null,
                                            repMax: null,
                                        },
                                        {
                                            repMode: 'time',
                                            repMin: 40,
                                            repMax: null,
                                        },
                                        {
                                            repMode: 'fixed',
                                            repMin: 12,
                                            repMax: null,
                                        },
                                        {
                                            repMode: 'fixed',
                                            repMin: 3,
                                            repMax: null,
                                            kind: 'rest',
                                            value: 20,
                                        },
                                    ],
                                },
                            ],
                        },
                        { name: 'Day 5', exercises: [] },
                    ],
                },
                t
            )
        );

        expect(book.worksheets.map((s) => s.name)).toEqual([
            'Day 5',
            'Day 5 (2)',
        ]);
        const sheet = book.worksheets[0];
        expect(sheet.headerFooter.oddHeader).toBe('&C&"-,Bold"&14- P&&L -');
        expect(sheet.getCell('A3').value).toBe('Day 5');
        expect(sheet.getCell('G3').value).toBe('DAY 3');
        expect(sheet.getCell('H3').value).toBeNull();
        expect(cells(sheet, 6)).toEqual([
            'EXERCISE',
            'SETS',
            'REP RANGE',
            'TECHNIQUE',
            'weight/reps',
            'weight/reps',
            'weight/reps',
        ]);
        // A blank row, then a row per set: the drop and the rest-pause get
        // their own, but only the four working sets are counted.
        expect(cells(sheet, 7)).toEqual([]);
        expect(cells(sheet, 8)).toEqual(['CURL', 4, '7-10', 'S.S.']);
        expect(cells(sheet, 9).slice(2, 4)).toEqual(['7-10', 'D.S. (20%)']);
        expect(sheet.getCell('C10').value).toBe('AMRAP');
        expect(sheet.getCell('C11').value).toBe('40"');
        expect(sheet.getCell('C12').value).toBe('12');
        expect(cells(sheet, 13).slice(2, 4)).toEqual(['3', 'R.P. (20")']);
        expect(sheet.getCell('G13').border.bottom?.style).toBe('thin');
        expect(cells(sheet, 14)).toEqual([]);
        // Taller rows to write in by hand, the gaps between exercises
        // included; the margin above the day's name keeps Excel's own.
        expect([1, 2, 3, 7, 8].map((r) => sheet.getRow(r).height)).toEqual([
            undefined,
            undefined,
            24,
            24,
            24,
        ]);
    });

    it('gives an open-ended routine ten weeks', async () => {
        const book = await read(
            await routineWorkbook(
                {
                    name: 'PPL',
                    durationWeeks: null,
                    workouts: [{ name: 'A', exercises: [] }],
                },
                t
            )
        );
        expect(book.worksheets[0].getCell('N3').value).toBe('DAY 10');
        expect(book.worksheets[0].pageSetup).toMatchObject({
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 1,
            showGridLines: true,
        });
    });

    // A preset is stored as its label, in whichever language it was picked.
    it('shortens the preset techniques, whatever language they were picked in', async () => {
        const techniques = [
            'Warm-up set',
            'Serie recta',
            'Top set',
            'Back off',
            "Sèrie d'escalfament",
            'Pausa 3"',
        ];
        const book = await read(
            await routineWorkbook(
                {
                    name: 'PPL',
                    durationWeeks: 1,
                    workouts: [
                        {
                            name: 'A',
                            exercises: [
                                {
                                    id: 'e1',
                                    name: 'Squat',
                                    sets: techniques.map((technique) => ({
                                        ...range,
                                        technique,
                                    })),
                                },
                            ],
                        },
                    ],
                },
                t
            )
        );
        const column = techniques.map(
            (_, i) => book.worksheets[0].getCell(`D${8 + i}`).value
        );
        expect(column).toEqual([
            'WUP.',
            'S.S.',
            'T.S.',
            'B.O.',
            'WUP.',
            'Pausa 3"',
        ]);
    });

    // A finished routine exports with what was trained: each week's numbers
    // in its column, the day it was started above them.
    it('fills in what was trained and when', async () => {
        const book = await read(
            await routineWorkbook(
                {
                    name: 'PPL',
                    durationWeeks: 2,
                    workouts: [
                        {
                            name: 'A',
                            exercises: [
                                {
                                    id: 'e1',
                                    name: 'Plank',
                                    sets: [
                                        range,
                                        {
                                            repMode: 'time',
                                            repMin: 40,
                                            repMax: null,
                                        },
                                    ],
                                },
                            ],
                            weeks: {
                                1: {
                                    startedAt: new Date('2026-10-12T22:30Z'),
                                    logs: {
                                        e1: {
                                            0: {
                                                weight: 82.5,
                                                reps: 8,
                                                effort: 'fail',
                                            },
                                            1: { weight: 0, reps: 45 },
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                t
            )
        );
        const sheet = book.worksheets[0];
        // The 12th in UTC, as the training calendar counts days.
        expect(sheet.getCell('E4').value).toBe('12/10/2026');
        expect(sheet.getCell('F4').value).toBeNull();
        // How it felt, raised over the reps; a normal set has no mark.
        expect(sheet.getCell('E8').value).toBe('82.5/8ˣ');
        expect(cells(sheet, 9).slice(4)).toEqual(['0/45"']);
    });

    it('gives an open-ended routine as many weeks as it has trained', async () => {
        const book = await read(
            await routineWorkbook(
                {
                    name: 'PPL',
                    durationWeeks: null,
                    workouts: [
                        {
                            name: 'A',
                            exercises: [],
                            weeks: {
                                12: { startedAt: new Date(), logs: {} },
                            },
                        },
                    ],
                },
                t
            )
        );
        expect(book.worksheets[0].getCell('P3').value).toBe('DAY 12');
    });
});
