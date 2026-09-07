/** Shape returned by every form server action, consumed by useActionState. */
export type FormState = { error?: string };

export type FormAction = (
    previous: FormState,
    data: FormData
) => Promise<FormState>;
