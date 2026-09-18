import { toggleFollow } from '@/app/actions';
import { ActionButton } from '@/components/ui/action-button';
import { getT } from '@/i18n/server';
import { ghostClass, primaryClass } from '@/lib/ui';

export async function FollowButton({
    userId,
    following,
    compact = false,
    className = '',
}: {
    userId: string;
    following: boolean;
    compact?: boolean;
    className?: string;
}) {
    const t = await getT();

    const shape = following
        ? `${ghostClass} ${compact ? 'py-1! text-xs! md:py-1.5! md:text-sm!' : 'py-1.5!'}`
        : `${primaryClass} ${compact ? 'py-1! text-sm! md:py-1.5! md:text-base!' : 'py-1.5! text-base!'}`;

    return (
        <ActionButton
            action={toggleFollow.bind(null, userId, !following)}
            className={`${shape} ${className} group`}
        >
            {following ? (
                <span className="grid">
                    <span className="col-start-1 row-start-1 group-hover:invisible group-focus-visible:invisible">
                        {t('profile.followed')}
                    </span>
                    <span className="invisible col-start-1 row-start-1 group-hover:visible group-focus-visible:visible">
                        {t('profile.unfollow')}
                    </span>
                </span>
            ) : (
                t('profile.follow')
            )}
        </ActionButton>
    );
}
