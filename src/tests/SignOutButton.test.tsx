import { SignOutButton } from "@/components/SignOutButton";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const signOut = vi.fn().mockResolvedValue(undefined);
const refresh = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => refresh() }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: () => signOut() } }));

describe("SignOutButton", () => {
  it("signs out and refreshes the page", async () => {
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(signOut).toHaveBeenCalled());
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
