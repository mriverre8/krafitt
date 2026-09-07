import { ActionButton } from "@/components/action-button";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("ActionButton", () => {
  it("runs the action on click", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<ActionButton action={action}>Delete</ActionButton>);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(action).toHaveBeenCalledOnce());
  });

  it("asks for confirmation first and skips the action when declined", () => {
    const action = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <ActionButton action={action} confirm="Sure?">
        Delete
      </ActionButton>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(window.confirm).toHaveBeenCalledWith("Sure?");
    expect(action).not.toHaveBeenCalled();
  });
});
