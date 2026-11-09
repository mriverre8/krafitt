import { normalEmail } from '@/lib/utils';
import { describe, expect, it } from 'vitest';

describe('normalEmail', () => {
    // The searches compare what is typed against what was last asked: a
    // capital or a stray space must not read as a different address.
    it('drops case and the spaces around the address', () => {
        expect(normalEmail('  Ada@Example.COM ')).toBe('ada@example.com');
    });

    it('leaves an address that is already plain as it is', () => {
        expect(normalEmail('ada@example.com')).toBe('ada@example.com');
    });
});
