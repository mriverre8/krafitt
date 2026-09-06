import { isSessionComplete, isSetEnabled, positionFromCursor, type Logs } from "@/lib/progress";
import { describe, expect, it } from "vitest";

const exercises = [
  { id: "a", sets: 2 },
  { id: "b", sets: 1 },
];

describe("positionFromCursor", () => {
  it("walks day by day and then week by week", () => {
    expect(positionFromCursor(0, 2, 3)).toEqual({ week: 1, workoutIndex: 0 });
    expect(positionFromCursor(1, 2, 3)).toEqual({ week: 1, workoutIndex: 1 });
    expect(positionFromCursor(2, 2, 3)).toEqual({ week: 2, workoutIndex: 0 });
    expect(positionFromCursor(5, 2, 3)).toEqual({ week: 3, workoutIndex: 1 });
  });

  it("returns null once the routine is over, or when it has no workouts", () => {
    expect(positionFromCursor(6, 2, 3)).toBeNull();
    expect(positionFromCursor(0, 0, 3)).toBeNull();
  });
});

describe("isSetEnabled", () => {
  it("only opens the first set when nothing is logged", () => {
    const logs: Logs = {};
    expect(isSetEnabled(exercises, logs, "a", 0)).toBe(true);
    expect(isSetEnabled(exercises, logs, "a", 1)).toBe(false);
    expect(isSetEnabled(exercises, logs, "b", 0)).toBe(false);
  });

  it("moves on to the next field once the previous one is filled", () => {
    const logs: Logs = { a: { 0: { weight: 60, reps: 8 } } };
    expect(isSetEnabled(exercises, logs, "a", 1)).toBe(true);
    expect(isSetEnabled(exercises, logs, "b", 0)).toBe(false);
  });

  it("crosses into the next exercise only once the previous one is complete", () => {
    const logs: Logs = { a: { 0: { weight: 60, reps: 8 }, 1: { weight: 60, reps: 7 } } };
    expect(isSetEnabled(exercises, logs, "b", 0)).toBe(true);
  });

  it("accepts 0 kg (bodyweight) but not 0 reps", () => {
    expect(isSetEnabled(exercises, { a: { 0: { weight: 0, reps: 10 } } }, "a", 1)).toBe(true);
    expect(isSetEnabled(exercises, { a: { 0: { weight: 60, reps: 0 } } }, "a", 1)).toBe(false);
  });
});

describe("isSessionComplete", () => {
  it("is only complete once the very last set is logged", () => {
    const almost: Logs = { a: { 0: { weight: 60, reps: 8 }, 1: { weight: 60, reps: 7 } } };
    expect(isSessionComplete(exercises, almost)).toBe(false);
    expect(isSessionComplete(exercises, { ...almost, b: { 0: { weight: 30, reps: 12 } } })).toBe(
      true,
    );
  });

  it("never completes a workout that has no exercises", () => {
    expect(isSessionComplete([], {})).toBe(false);
  });
});
