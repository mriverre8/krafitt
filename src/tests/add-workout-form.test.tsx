import { AddWorkoutForm } from "@/components/add-workout-form";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { noopAction } from "./setup-helpers";

describe("AddWorkoutForm", () => {
  it("carries the routine id with the submission", () => {
    const { container } = render(<AddWorkoutForm action={noopAction} routineId="r1" />);
    expect(container.querySelector('input[name="routineId"]')).toHaveValue("r1");
  });

  it("asks for the day name", () => {
    render(<AddWorkoutForm action={noopAction} routineId="r1" />);
    expect(screen.getByLabelText("Day name")).toBeInTheDocument();
  });
});
