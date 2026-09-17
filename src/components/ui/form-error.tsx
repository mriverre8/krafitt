'use client';

export function FormError({ message }: { message?: string }) {
    if (!message) return null;
    return (
        <p
            role="alert"
            className="text-danger text-sm font-semibold"
        >
            {message}
        </p>
    );
}
