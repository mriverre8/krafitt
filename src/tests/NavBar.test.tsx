import { NavBar } from "@/components/NavBar";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("NavBar", () => {
  it("hides the app links when signed out", () => {
    render(<NavBar signedIn={false} theme="dark" />);
    expect(screen.queryByRole("link", { name: "Today" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("shows the app links when signed in", () => {
    render(<NavBar signedIn theme="dark" />);
    expect(screen.getByRole("link", { name: "Today" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Routines" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("always offers theme and language controls", () => {
    render(<NavBar signedIn={false} theme="dark" />);
    expect(screen.getByLabelText("Switch theme")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
  });
});
