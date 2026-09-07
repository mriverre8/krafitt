import { ThemeToggle } from "@/components/theme-toggle";
import { THEME_COOKIE } from "@/lib/theme";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.cookie = `${THEME_COOKIE}=; max-age=0; path=/`;
  });

  it("offers the sun in dark mode and the moon in light mode", () => {
    const { container } = render(<ThemeToggle theme="dark" />);
    expect(container.querySelector(".lucide-sun")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Switch theme"));
    expect(container.querySelector(".lucide-moon")).toBeInTheDocument();
  });

  it("switches the html class from dark to light", () => {
    document.documentElement.classList.add("dark");
    render(<ThemeToggle theme="dark" />);
    fireEvent.click(screen.getByLabelText("Switch theme"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("switches back to dark", () => {
    render(<ThemeToggle theme="light" />);
    fireEvent.click(screen.getByLabelText("Switch theme"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("stores the choice so the server renders the same theme", () => {
    render(<ThemeToggle theme="dark" />);
    fireEvent.click(screen.getByLabelText("Switch theme"));
    expect(document.cookie).toContain(`${THEME_COOKIE}=light`);
  });
});
