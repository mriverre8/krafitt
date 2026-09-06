import { AddAthleteForm } from "@/components/AddAthleteForm";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { noopAction, renderWithLocale } from "./setup-helpers";

describe("AddAthleteForm", () => {
  it("takes an email and an editing permission", () => {
    render(<AddAthleteForm action={noopAction} routineId="r1" />);
    expect(screen.getByLabelText("Athlete email")).toHaveAttribute("type", "email");
    expect(screen.getByRole("checkbox", { name: "Can edit the routine" })).not.toBeChecked();
  });

  it("translates its copy", () => {
    renderWithLocale(<AddAthleteForm action={noopAction} routineId="r1" />, "es");
    expect(screen.getByRole("button", { name: "Añadir atleta" })).toBeInTheDocument();
  });
});
