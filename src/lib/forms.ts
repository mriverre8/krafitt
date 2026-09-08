/**
 * Shape returned by every form server action, consumed by useActionState.
 * A form that keeps its own state clears it on `ok`, and on `error` it holds
 * on to whatever the user typed.
 */
export type FormState = { error?: string; ok?: true };

export type FormAction = (
    previous: FormState,
    data: FormData
) => Promise<FormState>;
