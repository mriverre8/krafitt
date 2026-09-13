'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/i18n/use-t';
import { authClient } from '@/lib/auth-client';
import { USER_NAME_MAX } from '@/lib/constants';
import { compressImageToBase64 } from '@/lib/image';
import type { Theme } from '@/lib/theme';
import {
    dangerClass,
    ghostClass,
    inputClass,
    labelClass,
    primaryClass,
} from '@/lib/ui';
import { Modal } from '@/components/modal/modal';
import { Avatar } from '@/components/ui/avatar';
import { FormError } from '@/components/ui/form-error';
import { LocaleSwitcher } from '@/components/chrome/locale-switcher';
import { ThemeToggle } from '@/components/chrome/theme-toggle';
import { showModal } from '@/store/modal';
import { Trash, Upload } from 'lucide-react';

export type SettingsModalProps = {
    theme: Theme;
    /** null when signed out: the username/delete section only makes sense
        for a signed-in user. */
    userName?: string | null;
    userImage?: string | null;
    /** Supplied by the ModalHost. */
    onClose: () => void;
};

/**
 * Language and theme, out of the menu and into a dialog of their own. Nothing
 * here is confirmed or discarded — both switches take effect as they are
 * flipped — so there is no button row at all, only the shell's close.
 */
export function SettingsModal({
    theme,
    userName,
    userImage,
    onClose,
}: SettingsModalProps) {
    const t = useT();
    const router = useRouter();
    const [name, setName] = useState(userName ?? '');
    const [image, setImage] = useState(userImage);
    const [uploading, setUploading] = useState(false);
    const [imageError, setImageError] = useState<string | undefined>();
    const [savedName, setSavedName] = useState(userName ?? '');
    const [error, setError] = useState<string | undefined>();
    const [saving, setSaving] = useState(false);

    async function saveName(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError(undefined);
        const result = await authClient.updateUser({ name });
        setSaving(false);
        if (result.error) setError(result.error.message ?? t('auth.failed'));
        else {
            setSavedName(name);
            router.refresh();
        }
    }

    /** `null` clears the picture; a data URL sets it. */
    async function saveImage(value: string | null) {
        setUploading(true);
        setImageError(undefined);
        try {
            const result = await authClient.updateUser({ image: value });
            if (result.error)
                setImageError(result.error.message ?? t('auth.failed'));
            else {
                setImage(value);
                router.refresh();
            }
        } catch {
            setImageError(t('nav.pictureFailed'));
        } finally {
            setUploading(false);
        }
    }

    async function pickImage(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        try {
            await saveImage(await compressImageToBase64(file));
        } catch {
            setImageError(t('nav.pictureFailed'));
        }
    }

    const removeImage = () => saveImage(null);

    return (
        <Modal
            title={t('nav.settings')}
            onClose={onClose}
        >
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3">
                    <span className={labelClass}>{t('nav.language')}</span>
                    <LocaleSwitcher />
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className={labelClass}>{t('nav.theme')}</span>
                    <ThemeToggle theme={theme} />
                </div>

                {userName != null && (
                    <>
                        <div className="flex flex-col gap-2">
                            <span className={labelClass}>
                                {t('nav.picture')}
                            </span>
                            <div className="flex items-end gap-2">
                                <Avatar
                                    name={savedName}
                                    src={image}
                                    className="size-16 text-xl"
                                />
                                <div className="ml-auto flex items-end gap-2">
                                    <label
                                        className={`${ghostClass} inline-flex cursor-pointer items-center gap-2 leading-4 ${uploading ? 'pointer-events-none opacity-40' : ''}`}
                                    >
                                        <Upload className="size-4" />
                                        {uploading
                                            ? t('common.loading')
                                            : t('nav.uploadPicture')}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={uploading}
                                            onChange={pickImage}
                                            className="sr-only"
                                        />
                                    </label>
                                    {image && (
                                        <button
                                            type="button"
                                            disabled={uploading}
                                            onClick={removeImage}
                                            aria-label={t('nav.removePicture')}
                                            title={t('nav.removePicture')}
                                            className={`${ghostClass} hover:border-danger hover:text-danger px-2.5`}
                                        >
                                            <Trash className="size-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <FormError message={imageError} />
                        </div>

                        <form
                            onSubmit={saveName}
                            className="flex flex-col gap-2"
                        >
                            <span className={labelClass}>
                                {t('nav.username')}
                            </span>
                            <div className="flex items-center gap-2">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    maxLength={USER_NAME_MAX}
                                    aria-label={t('nav.username')}
                                    className={`${inputClass} h-10 py-0`}
                                />
                                <button
                                    type="submit"
                                    disabled={saving || name === savedName}
                                    className={`${primaryClass} inline-flex h-10 items-center justify-center py-0 text-sm md:text-base`}
                                >
                                    {t('common.save')}
                                </button>
                            </div>
                            <FormError message={error} />
                        </form>

                        <div className="flex items-center justify-between gap-3">
                            <span className={labelClass}>
                                {t('nav.deleteAccount')}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    showModal('confirm', {
                                        title: t('nav.deleteAccount'),
                                        message: t('nav.deleteAccountConfirm'),
                                        confirmLabel: t('nav.deleteAccount'),
                                        onConfirm: async () => {
                                            await authClient.deleteUser();
                                            router.push('/');
                                            router.refresh();
                                        },
                                    });
                                }}
                                className={dangerClass}
                            >
                                {t('nav.delete')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
