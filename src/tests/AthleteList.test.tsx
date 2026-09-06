import { AthleteList, type AthleteView } from "@/components/AthleteList";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const athletes: AthleteView[] = [
  { userId: "u1", name: "Victor", email: "victor@test.com", canEdit: true, isOwner: true },
  { userId: "u2", name: "Ana", email: "ana@test.com", canEdit: false, isOwner: false },
];

const base = { athletes, onToggleEdit: async () => {}, onRemove: async () => {} };

describe("AthleteList", () => {
  it("marks the owner and the editors", () => {
    render(<AthleteList {...base} viewerIsOwner={false} />);
    expect(screen.getByText("· owner")).toBeInTheDocument();
  });

  it("hides the management buttons from non-owners", () => {
    render(<AthleteList {...base} viewerIsOwner={false} />);
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("never lets the owner be managed", () => {
    render(<AthleteList {...base} viewerIsOwner />);
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(1);
  });

  it("toggles the editing permission of an athlete", async () => {
    const onToggleEdit = vi.fn().mockResolvedValue(undefined);
    render(<AthleteList {...base} viewerIsOwner onToggleEdit={onToggleEdit} />);
    fireEvent.click(screen.getByRole("button", { name: "Grant editing" }));
    await waitFor(() => expect(onToggleEdit).toHaveBeenCalledWith("u2", true));
  });
});
