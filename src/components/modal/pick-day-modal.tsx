'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass, cardLinkClass } from '@/lib/ui';
import { Modal } from '@/components/modal/modal';

export type PickDayModalProps = {
    /** The days still to do this week, the one on screen among them. */
    choices: { id: string; name: string; index: number }[];
    current: string;
    onPick: (workoutId: string) => void;
    onClose: () => void;
};

export function PickDayModal({
    choices,
    current,
    onPick,
    onClose,
}: PickDayModalProps) {
    const t = useT();

    return (
        <Modal
            title={t('today.changeDay')}
            onClose={onClose}
        >
            <p className="text-muted text-base">{t('today.changeDayBody')}</p>
            <ul className="space-y-2">
                {choices.map((choice) => (
                    <li key={choice.id}>
                        <button
                            type="button"
                            aria-current={choice.id === current || undefined}
                            onClick={() => {
                                onClose();
                                if (choice.id !== current) onPick(choice.id);
                            }}
                            className={`${cardLinkClass} aria-current:border-l-volt flex w-full items-center justify-between gap-3 text-left`}
                        >
                            <span className="flex min-w-0 items-center gap-3">
                                <span
                                    aria-hidden
                                    className="figure border-line text-muted grid h-7 w-7 shrink-0 place-items-center rounded-md border-2 text-sm leading-none"
                                >
                                    {choice.index + 1}
                                </span>
                                <span className="text-ink truncate font-semibold">
                                    {choice.name}
                                </span>
                            </span>
                            {choice.id === current && (
                                <span
                                    className={`${badgeClass} bg-volt text-on-volt`}
                                >
                                    {t('today.changeDayCurrent')}
                                </span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </Modal>
    );
}
