import { AuthForms } from "@/components/AuthForms";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const signIn = vi.fn().mockResolvedValue({ error: null });
const signUp = vi.fn().mockResolvedValue({ error: null });

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: (...args: unknown[]) => signIn(...args) },
    signUp: { email: (...args: unknown[]) => signUp(...args) },
  },
}));

describe("AuthForms", () => {
  it("starts on sign in, without a name field", () => {
    render(<AuthForms />);
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("asks for a name when signing up", () => {
    render(<AuthForms />);
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("signs in with the typed credentials", async () => {
    render(<AuthForms />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Let's go" }));
    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith({ email: "a@b.com", password: "password123" }),
    );
  });

  it("surfaces the error the server returned", async () => {
    signIn.mockResolvedValueOnce({ error: { message: "Invalid email or password" } });
    render(<AuthForms />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: "Let's go" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });
});
