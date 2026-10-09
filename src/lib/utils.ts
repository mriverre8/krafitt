/** An email as the searches compare it: case and stray spaces don't make it
    another address. */
export const normalEmail = (email: string) => email.trim().toLowerCase();
