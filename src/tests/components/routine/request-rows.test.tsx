import { RequestRows } from '@/components/routine/request-rows';
import { acceptRequest, declineRequest } from '@/app/actions';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// A server component: it reads the locale off the request, which no test has.
vi.mock('@/i18n/server', async () => {
    const { createT, dictionaries } = await import('@/i18n/config');
    return { getT: async () => createT(dictionaries.en) };
});

vi.mock('@/app/actions', () => ({
    acceptRequest: vi.fn(),
    declineRequest: vi.fn(),
}));

const ada = { id: 'ada', name: 'Ada', image: null };
const request = (
    id: string,
    kind: 'member' | 'send',
    addSender = false,
    name = 'Push'
) => ({ id, kind, addSender, routine: { name, creator: ada } });

beforeEach(() => {
    vi.mocked(acceptRequest).mockReset().mockResolvedValue(undefined);
    vi.mocked(declineRequest).mockReset().mockResolvedValue(undefined);
});

const both = [request('r1', 'member'), request('r2', 'send', true, 'Legs')];

const rows = async (requests = both) => render(await RequestRows({ requests }));

describe('RequestRows', () => {
    it('says what each request asks, and who asks it', async () => {
        await rows();

        expect(
            screen.getByText('Wants to add you to Push so you can see it')
        ).toBeInTheDocument();
        expect(
            screen.getByText('Wants to send you Legs and join it as a member')
        ).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: 'Ada' })[0]).toHaveAttribute(
            'href',
            '/profile/ada'
        );
    });

    it('leaves the member part out of a plain send', async () => {
        await rows([request('r3', 'send')]);

        expect(screen.getByText('Wants to send you Push')).toBeInTheDocument();
    });

    // The bug this catches is every row answering the first request.
    it('answers each request on its own row', async () => {
        await rows();
        const [, second] = screen.getAllByRole('listitem');

        fireEvent.click(within(second).getByRole('button', { name: 'Accept' }));
        expect(acceptRequest).toHaveBeenCalledWith('r2');

        const [first] = screen.getAllByRole('listitem');
        fireEvent.click(within(first).getByRole('button', { name: 'Decline' }));
        expect(declineRequest).toHaveBeenCalledWith('r1');
        expect(acceptRequest).not.toHaveBeenCalledWith('r1');
    });

    it('says so when nothing is waiting, and offers nothing', async () => {
        await rows([]);

        expect(
            screen.getByRole('heading', { name: 'Nothing waiting' })
        ).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
