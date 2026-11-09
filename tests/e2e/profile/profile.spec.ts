import { expect, test } from '../fixtures';
import {
    seedCompleteRoutine,
    seedFollow,
    seedFollowers,
} from '../support/seed';

test.describe('profiles and follows', () => {
    test('my profile: reached from the menu, empty to begin with', async ({
        page,
        user,
    }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Menu' }).click();
        await page.getByRole('link', { name: 'Profile', exact: true }).click();

        await expect(page).toHaveURL(`/profile/${user.id}`);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
            user.name
        );
        await expect(page.getByText(/^Member since/)).toBeVisible();
        await expect(
            page.getByRole('link', { name: '0 followers' })
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: '0 following' })
        ).toBeVisible();
        await expect(page.getByText('No active routine')).toBeVisible();
        await expect(page.getByText('No public routines yet.')).toBeVisible();
        await expect(page.getByText(/^Training year \d{4}/)).toBeVisible();
        // Nobody follows themselves.
        await expect(page.getByRole('button', { name: 'Follow' })).toHaveCount(
            0
        );
    });

    test('a profile shows the active routine and the finished public ones', async ({
        user,
        newUser,
        pageAs,
    }) => {
        // Two days for four weeks: a cursor of 8 is a finished block.
        await seedCompleteRoutine(user.id, 'Current block', {
            isActive: true,
            isPublic: true,
        });
        await seedCompleteRoutine(user.id, 'Shown off', {
            isPublic: true,
            cursor: 8,
        });
        await seedCompleteRoutine(user.id, 'Not done yet', { isPublic: true });
        await seedCompleteRoutine(user.id, 'Kept quiet', { cursor: 8 });

        const visitor = await pageAs(await newUser());
        await visitor.goto(`/profile/${user.id}`);
        await expect(
            visitor.getByRole('heading', { name: 'Active routine' })
        ).toBeVisible();
        await expect(
            visitor.getByRole('link', { name: /Current block/ })
        ).toBeVisible();
        await expect(
            visitor.getByRole('link', { name: /Shown off/ })
        ).toBeVisible();
        await expect(
            visitor.getByRole('link', { name: /Kept quiet/ })
        ).toHaveCount(0);
        await expect(
            visitor.getByRole('link', { name: /Not done yet/ })
        ).toHaveCount(0);

        await visitor.getByRole('link', { name: /Shown off/ }).click();
        await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(
            'Shown off'
        );
    });

    test('follow and unfollow, with the counts and lists to match', async ({
        page,
        user,
        newUser,
    }) => {
        const star = await newUser('Ivy Star');
        await page.goto(`/profile/${star.id}`);
        await expect(
            page.getByRole('link', { name: '0 followers' })
        ).toBeVisible();

        await page.getByRole('button', { name: 'Follow' }).click();
        await expect(
            page.getByRole('button', { name: /Following|Unfollow/ })
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: '1 follower' })
        ).toBeVisible();

        await page.getByRole('link', { name: '1 follower' }).click();
        await expect(page).toHaveURL(`/profile/${star.id}/follows`);
        await expect(
            page.getByRole('link', { name: '1 follower' })
        ).toHaveAttribute('aria-current', 'page');
        await expect(page.getByRole('link', { name: user.name })).toBeVisible();
        await page.getByRole('link', { name: '0 following' }).click();
        await expect(page).toHaveURL(/tab=following/);
        await expect(page.getByText('Not following anyone yet.')).toBeVisible();

        // From my side: I follow one person.
        await page.goto(`/profile/${user.id}/follows?tab=following`);
        await expect(
            page.getByRole('link', { name: 'Ivy Star' })
        ).toBeVisible();
        await page.getByRole('button', { name: /Following|Unfollow/ }).click();
        await expect(
            page.getByRole('button', { name: 'Follow' })
        ).toBeVisible();

        await page.goto(`/profile/${star.id}`);
        await expect(
            page.getByRole('link', { name: '0 followers' })
        ).toBeVisible();
    });

    test('followers can be followed back from the list', async ({
        page,
        user,
        newUser,
    }) => {
        const fan = await newUser('Jo Fan');
        await seedFollow(fan.id, user.id);
        await page.goto(`/profile/${user.id}/follows`);
        await expect(page.getByRole('link', { name: 'Jo Fan' })).toBeVisible();

        const row = page.getByRole('listitem').filter({ hasText: 'Jo Fan' });
        await row.getByRole('button', { name: 'Follow' }).click();
        await expect(
            row.getByRole('button', { name: /Following|Unfollow/ })
        ).toBeVisible();
        await page.goto(`/profile/${user.id}`);
        await expect(
            page.getByRole('link', { name: '1 following' })
        ).toBeVisible();
    });

    test('an empty followers tab says so', async ({ page, user }) => {
        await page.goto(`/profile/${user.id}/follows`);
        await expect(page.getByText('No followers yet.')).toBeVisible();
    });
});

test.describe('profiles: long lists and sharing', () => {
    test('followers load fifty at a time', async ({ page, user }) => {
        await seedFollowers(user.id, 55);
        await page.goto(`/profile/${user.id}/follows`);
        const people = page.getByRole('link', { name: /^Fan \d+$/ });
        await expect(people).toHaveCount(50);

        await page.getByRole('link', { name: 'Load more' }).click();
        await expect(page).toHaveURL(/shown=100/);
        await expect(people).toHaveCount(55);
        await expect(page.getByRole('link', { name: 'Load more' })).toHaveCount(
            0
        );
    });

    test('share copies the profile link', async ({
        page,
        user,
        browserName,
    }) => {
        test.skip(
            browserName !== 'chromium',
            'clipboard permissions are Chromium-only'
        );
        await page
            .context()
            .grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto(`/profile/${user.id}`);
        await page.getByRole('button', { name: 'Share' }).click();
        await expect(
            page.getByRole('button', { name: 'Link copied' })
        ).toBeVisible();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
            page.url()
        );
    });
});
