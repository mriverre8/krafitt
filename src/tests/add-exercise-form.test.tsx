import { AddExerciseForm } from "@/components/add-exercise-form";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { noopAction } from "./setup-helpers";

describe("AddExerciseForm", () => {
  it("collects sets, rep range, technique and target weight", () => {
    render(<AddExerciseForm action={noopAction} workoutId="w1" />);
    expect(screen.getByLabelText("Exercise name")).toBeInTheDocument();
    expect(screen.getByLabelText("Sets")).toHaveValue(4);
    expect(screen.getByLabelText("Min reps")).toHaveValue(6);
    expect(screen.getByLabelText("Max reps")).toHaveValue(8);
    expect(screen.getByLabelText("Target weight")).toBeInTheDocument();
    expect(screen.getByLabelText("Technique")).toBeInTheDocument();
  });

  it("suggests the known techniques", () => {
    const { container } = render(<AddExerciseForm action={noopAction} workoutId="w1" />);
    const options = [...container.querySelectorAll("datalist option")].map((o) =>
      o.getAttribute("value"),
    );
    expect(options).toEqual(["Straight sets", "Top set", "Back off", "Drop set"]);
  });

  it("carries the workout id with the submission", () => {
    const { container } = render(<AddExerciseForm action={noopAction} workoutId="w1" />);
    expect(container.querySelector('input[name="workoutId"]')).toHaveValue("w1");
  });
});
