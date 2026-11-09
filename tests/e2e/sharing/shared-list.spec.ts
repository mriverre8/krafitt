import { expect, test } from '../fixtures';
import { seedCompleteRoutine, seedMember } from '../support/seed';

test.describe('shared with me', () => {
    test('grouped by owner, three each, with a page of their own for the rest', async ({
        page,
        user,
        newUser,
    }) => {
        const coach = await newUser('Kim Coach');
        for (const name of ['Base', 'Build', 'Peak', 'Taper']) {
            const routine = await seedCompleteRoutine(
                coach.id,
                `Coach ${name}`
            );
            await seedMember(routine.id, user.id);
        }

        await page.goto('/routines/shared');
        const block = page.locator('section').filter({
            has: page.getByRole('heading', { name: 'Kim Coach' }),
        });
        await expect(block.getByRole('link', { name: /^Coach / })).toHaveCount(
            3
        );
        await block.getByRole('link', { name: 'View more' }).click();

        await expect(page).toHaveURL(`/routines/shared/${coach.id}`);
        await expect(page.getByRole('heading', { level: 1 })).toContainText(
            'Kim Coach'
        );
        await expect(page.getByRole('link', { name: /^Coach / })).toHaveCount(
            4
        );

        const search = page.getByRole('searchbox', { name: 'Search routines' });
        await search.fill('peak');
        await search.press('Enter');
        await expect(page.getByRole('link', { name: /^Coach / })).toHaveCount(
            1
        );
        await expect(
            page.getByRole('link', { name: /Coach Peak/ })
        ).toBeVisible();
    });

    test('the full list searches by person or email', async ({
        page,
        user,
        newUser,
    }) => {
        const lena = await newUser('Lena Owner');
        const omar = await newUser('Omar Owner');
        await seedMember(
            (await seedCompleteRoutine(lena.id, 'Lena plan')).id,
            user.id
        );
        await seedMember(
            (await seedCompleteRoutine(omar.id, 'Omar plan')).id,
            user.id
        );

        await page.goto('/routines/shared/all');
        const search = page.getByRole('searchbox', {
            name: 'Search shared routines',
        });
        const by = page.getByRole('group', { name: 'Search by' });

        await by.getByText('Person').click();
        await expect(search).toHaveAttribute('placeholder', "Person's name");
        await search.fill('lena');
        await search.press('Enter');
        await expect(
            page.getByRole('link', { name: /Lena plan/ })
        ).toBeVisible();
        await expect(page.getByRole('link', { name: /Omar plan/ })).toHaveCount(
            0
        );

        await by.getByText('Email').click();
        await search.fill(omar.email);
        await search.press('Enter');
        await expect(
            page.getByRole('link', { name: /Omar plan/ })
        ).toBeVisible();
        await expect(page.getByRole('link', { name: /Lena plan/ })).toHaveCount(
            0
        );

        await search.fill('nobody at all');
        await search.press('Enter');
        await expect(
            page.getByText('Nothing matches your search.')
        ).toBeVisible();
    });

    test('an owner who shares nothing with me has no page', async ({
        page,
        user,
        newUser,
    }) => {
        const stranger = await newUser();
        await page.goto(`/routines/shared/${stranger.id}`);
        await expect(
            page.getByText('This page could not be found.')
        ).toBeVisible();
        await expect(page.getByRole('button', { name: 'Menu' })).toContainText(
            user.name
        );
    });
});
