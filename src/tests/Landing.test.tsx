import { Landing } from "@/components/Landing";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithLocale } from "./setup-helpers";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/auth-client", () => ({
  authClient: { signIn: { email: vi.fn() }, signUp: { email: vi.fn() } },
}));

describe("Landing", () => {
  it("explains the app and offers the auth form", () => {
    render(<Landing />);
    expect(screen.getByText(/Build your gym routines/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Let's go" })).toBeInTheDocument();
  });

  it("translates the pitch", () => {
    renderWithLocale(<Landing />, "es");
    expect(screen.getByText(/Monta tus rutinas de gimnasio/)).toBeInTheDocument();
  });
});
