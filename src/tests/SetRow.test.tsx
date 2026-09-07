import { SetRow } from "@/components/SetRow";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithLocale } from "./setup-helpers";

const base = {
  setIndex: 0,
  enabled: true,
  previousWeek: null,
  onSave: () => {},
};

describe("SetRow", () => {
  it("disables both inputs when the set is locked", () => {
    render(<SetRow {...base} enabled={false} />);
    expect(screen.getByLabelText("Weight set 1")).toBeDisabled();
    expect(screen.getByLabelText("Reps set 1")).toBeDisabled();
  });

  it("keeps save disabled until weight and reps are filled", () => {
    render(<SetRow {...base} />);
    const save = screen.getByLabelText("Save set 1");
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Weight set 1"), { target: { value: "80" } });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Reps set 1"), { target: { value: "8" } });
    expect(save).toBeEnabled();
  });

  it("reports the parsed numbers on save", () => {
    const onSave = vi.fn();
    render(<SetRow {...base} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Weight set 1"), { target: { value: "72.5" } });
    fireEvent.change(screen.getByLabelText("Reps set 1"), { target: { value: "7" } });
    fireEvent.click(screen.getByLabelText("Save set 1"));
    expect(onSave).toHaveBeenCalledWith(72.5, 7);
  });

  it("shows the stored values and marks the set as done", () => {
    render(<SetRow {...base} saved={{ weight: 60, reps: 10 }} />);
    expect(screen.getByLabelText("Weight set 1")).toHaveValue(60);
    expect(screen.getByLabelText("Save set 1")).toHaveAttribute("data-done", "true");
  });

  it("shows last session's numbers as a reference", () => {
    render(<SetRow {...base} previous={{ weight: 80, reps: 8 }} previousWeek={1} />);
    expect(screen.getByText("W1: 80×8")).toBeInTheDocument();
  });

  it("translates its labels", () => {
    renderWithLocale(<SetRow {...base} />, "es");
    expect(screen.getByLabelText("Peso serie 1")).toBeInTheDocument();
  });
});
