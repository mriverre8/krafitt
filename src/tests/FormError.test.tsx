import { FormError } from "@/components/FormError";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("FormError", () => {
  it("renders nothing without a message", () => {
    const { container } = render(<FormError />);
    expect(container).toBeEmptyDOMElement();
  });

  it("announces the message to screen readers", () => {
    render(<FormError message="Give the routine a name" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Give the routine a name");
  });
});
