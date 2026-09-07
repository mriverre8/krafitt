import { TodayWorkout, type TodayWorkoutProps } from "@/components/today-workout";
import { useSessionStore } from "@/store/session";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions", () => ({
  logSet: vi.fn(),
  skipDay: vi.fn(),
  startWorkout: vi.fn(),
}));

const props: TodayWorkoutProps = {
  routineId: "r1",
  routineName: "Strength",
  week: 2,
  totalWeeks: 8,
  workout: {
    id: "w1",
    name: "Push A",
    exercises: [
      {
        id: "e1",
        name: "Bench press",
        sets: 2,
        repMin: 6,
        repMax: 8,
        technique: "Top set",
        targetWeight: 80,
      },
    ],
  },
  sessionId: null,
  logs: {},
  previous: {},
  previousWeek: null,
};

describe("TodayWorkout", () => {
  beforeEach(() => useSessionStore.setState({ sessionId: null, logs: {} }));

  it("shows the routine, day and week", () => {
    render(<TodayWorkout {...props} />);
    expect(screen.getByText("Push A")).toBeInTheDocument();
    expect(screen.getByText("Week 2 of 8")).toBeInTheDocument();
  });

  it("locks every field until the workout is started", () => {
    render(<TodayWorkout {...props} />);
    expect(screen.getByRole("button", { name: "Start workout" })).toBeInTheDocument();
    expect(screen.getByLabelText("Weight set 1")).toBeDisabled();
    expect(screen.getByLabelText("Weight set 2")).toBeDisabled();
  });

  it("once started, only the first set is open", () => {
    render(<TodayWorkout {...props} sessionId="s1" />);
    expect(screen.getByLabelText("Weight set 1")).toBeEnabled();
    expect(screen.getByLabelText("Weight set 2")).toBeDisabled();
  });

  it("opens the next set once the previous one is logged", () => {
    render(<TodayWorkout {...props} sessionId="s1" logs={{ e1: { 0: { weight: 80, reps: 8 } } }} />);
    expect(screen.getByLabelText("Weight set 2")).toBeEnabled();
  });

  it("cannot be started when the day has no exercises", () => {
    render(<TodayWorkout {...props} workout={{ ...props.workout, exercises: [] }} />);
    expect(screen.getByRole("button", { name: "Start workout" })).toBeDisabled();
    expect(screen.getByText("This workout has no exercises yet.")).toBeInTheDocument();
  });
});
