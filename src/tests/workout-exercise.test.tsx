import { WorkoutExercise, type ExerciseView } from "@/components/workout-exercise";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const exercise: ExerciseView = {
  id: "e1",
  name: "Bench press",
  sets: 3,
  repMin: 6,
  repMax: 8,
  technique: "Top set",
  targetWeight: 80,
};

const base = {
  exercise,
  logs: {},
  previous: {},
  previousWeek: null,
  isSetEnabled: () => false,
  onSaveSet: () => {},
};

describe("WorkoutExercise", () => {
  it("renders the prescription", () => {
    render(<WorkoutExercise {...base} />);
    expect(screen.getByText("Bench press")).toBeInTheDocument();
    expect(screen.getByText("Top set")).toBeInTheDocument();
    expect(screen.getByText(/3 × 6-8 reps/)).toBeInTheDocument();
    expect(screen.getByText(/target 80 kg/)).toBeInTheDocument();
  });

  it("renders one row per set", () => {
    render(<WorkoutExercise {...base} />);
    expect(screen.getAllByLabelText(/^Weight set/)).toHaveLength(3);
  });

  it("omits the target when the exercise has none", () => {
    render(<WorkoutExercise {...base} exercise={{ ...exercise, targetWeight: null }} />);
    expect(screen.queryByText(/target/)).not.toBeInTheDocument();
  });

  it("reports which set was saved", () => {
    const onSaveSet = vi.fn();
    render(<WorkoutExercise {...base} isSetEnabled={() => true} onSaveSet={onSaveSet} />);
    fireEvent.change(screen.getByLabelText("Weight set 2"), { target: { value: "80" } });
    fireEvent.change(screen.getByLabelText("Reps set 2"), { target: { value: "8" } });
    fireEvent.click(screen.getByLabelText("Save set 2"));
    expect(onSaveSet).toHaveBeenCalledWith(1, 80, 8);
  });
});
