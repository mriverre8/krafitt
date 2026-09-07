"use client";

/** Inline error for a form that failed validation on the server. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm font-semibold text-blaze">
      {message}
    </p>
  );
}
