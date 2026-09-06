import { CreateRoutineForm } from "@/components/CreateRoutineForm";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { noopAction, renderWithLocale } from "./setup-helpers";

describe("CreateRoutineForm", () => {
  it("asks for a name and a duration", () => {
    render(<CreateRoutineForm action={noopAction} />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Duration in weeks")).toHaveValue(8);
    expect(screen.getByRole("button", { name: "Create routine" })).toBeInTheDocument();
  });

  it("translates its copy", () => {
    renderWithLocale(<CreateRoutineForm action={noopAction} />, "ca");
    expect(screen.getByRole("button", { name: "Crear rutina" })).toBeInTheDocument();
  });
});
