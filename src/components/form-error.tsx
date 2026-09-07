'use client';

/** Inline error for a form that failed validation on the server. */
export function FormError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p
            role="alert"
            className="text-blaze text-sm font-semibold"
        >
            {message}
        </p>
    );
}
