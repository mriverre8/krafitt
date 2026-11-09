import { SettingsModal } from '@/components/modal/settings-modal';
import { useModalStore } from '@/store/modal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateUser = vi.fn();
const deleteUser = vi.fn();
const compress = vi.fn();
const refresh = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: () => refresh(),
        push: (to: string) => push(to),
    }),
}));
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        updateUser: (...args: unknown[]) => updateUser(...args),
        deleteUser: (...args: unknown[]) => deleteUser(...args),
    },
}));
vi.mock('@/lib/image', () => ({
    compressImageToBase64: (...args: unknown[]) => compress(...args),
}));

const PICTURE = 'data:image/jpeg;base64,old';
const COMPRESSED = 'data:image/jpeg;base64,new';

beforeEach(() => {
    vi.clearAllMocks();
    updateUser.mockResolvedValue({ error: null });
    deleteUser.mockResolvedValue({ error: null });
    compress.mockResolvedValue(COMPRESSED);
});

function open(props: Partial<React.ComponentProps<typeof SettingsModal>> = {}) {
    const view = render(
        <SettingsModal
            theme="dark"
            userName="Ada Lovelace"
            onClose={() => {}}
            {...props}
        />
    );
    const file =
        view.container.querySelector<HTMLInputElement>('input[type="file"]')!;
    return { ...view, file };
}

const picture = () => document.querySelector('img');
const removeButton = () =>
    screen.queryByRole('button', { name: 'Remove picture' });

describe('SettingsModal picture', () => {
    it('shows the monogram, and no way to remove a picture that is not there', () => {
        open();
        expect(screen.getByText('AL')).toBeInTheDocument();
        expect(removeButton()).not.toBeInTheDocument();
    });

    it('offers removing the picture once there is one', () => {
        open({ userImage: PICTURE });
        expect(picture()).toHaveAttribute('src', PICTURE);
        expect(removeButton()).toBeInTheDocument();
    });

    it('stores the picked file compressed, and shows it', async () => {
        const { file } = open();
        const chosen = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
        fireEvent.change(file, { target: { files: [chosen] } });

        await waitFor(() =>
            expect(updateUser).toHaveBeenCalledWith({ image: COMPRESSED })
        );
        expect(compress).toHaveBeenCalledWith(chosen);
        expect(picture()).toHaveAttribute('src', COMPRESSED);
        expect(refresh).toHaveBeenCalled();
    });

    // Without this the same file cannot be picked twice in a row: re-selecting
    // it fires no change event at all.
    it('clears the file input after a pick', async () => {
        const { file } = open();
        fireEvent.change(file, {
            target: { files: [new File(['x'], 'photo.jpg')] },
        });
        await waitFor(() => expect(updateUser).toHaveBeenCalled());
        expect(file.value).toBe('');
    });

    it('clears the picture, and falls back to the monogram', async () => {
        open({ userImage: PICTURE });
        fireEvent.click(removeButton()!);

        await waitFor(() =>
            expect(updateUser).toHaveBeenCalledWith({ image: null })
        );
        expect(picture()).not.toBeInTheDocument();
        expect(screen.getByText('AL')).toBeInTheDocument();
        expect(removeButton()).not.toBeInTheDocument();
    });

    it('says so when the file is not a picture it can read', async () => {
        compress.mockRejectedValueOnce(new Error('nope'));
        const { file } = open();
        fireEvent.change(file, {
            target: { files: [new File(['x'], 'notes.txt')] },
        });

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Could not read that image'
        );
        expect(updateUser).not.toHaveBeenCalled();
    });

    it('surfaces the error the server returned', async () => {
        updateUser.mockResolvedValueOnce({ error: { message: 'Too large' } });
        open({ userImage: PICTURE });
        fireEvent.click(removeButton()!);

        expect(await screen.findByRole('alert')).toHaveTextContent('Too large');
        expect(picture()).toHaveAttribute('src', PICTURE);
    });
});

describe('SettingsModal username', () => {
    const field = () => screen.getByLabelText('Username');
    const saveButton = () => screen.getByRole('button', { name: 'Save' });

    it('cannot be saved until it changes', () => {
        open();
        expect(saveButton()).toBeDisabled();
        fireEvent.change(field(), { target: { value: 'Ada L' } });
        expect(saveButton()).toBeEnabled();
    });

    it('saves the typed name', async () => {
        open();
        fireEvent.change(field(), { target: { value: 'Grace Hopper' } });
        fireEvent.click(saveButton());

        await waitFor(() =>
            expect(updateUser).toHaveBeenCalledWith({ name: 'Grace Hopper' })
        );
        expect(refresh).toHaveBeenCalled();
        expect(saveButton()).toBeDisabled();
    });

    // The userName prop is the snapshot from when the modal opened and never
    // updates, so the monogram has to follow the saved name instead.
    it('rebuilds the monogram from the saved name', async () => {
        open();
        fireEvent.change(field(), { target: { value: 'Grace Hopper' } });
        fireEvent.click(saveButton());

        expect(await screen.findByText('GH')).toBeInTheDocument();
        expect(screen.queryByText('AL')).not.toBeInTheDocument();
    });

    it('keeps the old monogram when the save fails', async () => {
        updateUser.mockResolvedValueOnce({ error: { message: 'Taken' } });
        open();
        fireEvent.change(field(), { target: { value: 'Grace Hopper' } });
        fireEvent.click(saveButton());

        expect(await screen.findByRole('alert')).toHaveTextContent('Taken');
        expect(screen.getByText('AL')).toBeInTheDocument();
    });
});

describe('SettingsModal account', () => {
    it('hides everything about the account when signed out', () => {
        open({ userName: null });
        expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
        expect(screen.queryByText('Profile picture')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete account')).not.toBeInTheDocument();
    });

    // Deleting takes the routines and the history with it, so it asks first.
    it('confirms before deleting the account', async () => {
        open();
        fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

        const modal = useModalStore.getState().open;
        expect(modal?.kind).toBe('confirm');
        expect(deleteUser).not.toHaveBeenCalled();

        (modal?.props as { onConfirm: () => void }).onConfirm();
        expect(deleteUser).toHaveBeenCalled();
        await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
    });
});
