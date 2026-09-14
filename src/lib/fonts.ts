// The Sports/Fitness pairing: condensed for impact, regular for everything read.
//
// next/font has to be called at module scope with literal options — the
// compiler reads the call to know which files to fetch at build time — so the
// two loaders live here as constants rather than inside the layout.

import { Barlow, Barlow_Condensed } from 'next/font/google';

export const displayFont = Barlow_Condensed({
    variable: '--font-barlow-condensed',
    subsets: ['latin'],
    weight: ['600', '700', '800'],
});

export const bodyFont = Barlow({
    variable: '--font-barlow',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
});
