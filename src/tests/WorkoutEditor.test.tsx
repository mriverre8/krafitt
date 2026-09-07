import { WorkoutEditor } from "@/components/WorkoutEditor";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { noopAction } from "./setup-helpers";

const workout = {
  id: "w1",
  name: "Push A",
  exercises: [
    {
      id: "e1",
      name: "Bench press",
      sets: 4,
      repMin: 6,
      repMax: 8,
      technique: "Top set",
      targetWeight: 80,
    },
  ],
};

const base = {
  workout,
  addExercise: noopAction,
  onDeleteWorkout: async () => {},
  onDeleteExercise: async () => {},
};

describe("WorkoutEditor", () => {
  it("lists the exercises of the day", () => {
    render(<WorkoutEditor {...base} />);
    expect(screen.getByText("Push A")).toBeInTheDocument();
    expect(screen.getByText("Bench press")).toBeInTheDocument();
    expect(screen.getByText(/4×6-8 · Top set/)).toBeInTheDocument();
  });

  it("offers the editing controls", () => {
    render(<WorkoutEditor {...base} />);
    expect(screen.getByRole("button", { name: "Delete day" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add exercise" })).toBeInTheDocument();
  });

  it("confirms before deleting a day", async () => {
    const onDeleteWorkout = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<WorkoutEditor {...base} onDeleteWorkout={onDeleteWorkout} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete day" }));
    expect(window.confirm).toHaveBeenCalledWith("Delete Push A and its exercises?");
    await waitFor(() => expect(onDeleteWorkout).toHaveBeenCalledWith("w1"));
  });

  it("says so when the day is empty", () => {
    render(<WorkoutEditor {...base} workout={{ ...workout, exercises: [] }} />);
    expect(screen.getByText("No exercises yet.")).toBeInTheDocument();
  });
});
