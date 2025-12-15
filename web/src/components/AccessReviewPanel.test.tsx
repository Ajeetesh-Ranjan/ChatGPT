import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccessReviewPanel } from "./AccessReviewPanel";

const base = [
  {
    id: "test-1",
    subject: "Sample",
    reviewer: "Tester",
    status: "pending" as const,
    lastReviewedAt: new Date().toISOString(),
    notes: "",
  },
];

describe("AccessReviewPanel", () => {
  it("shows list and allows adding", () => {
    render(<AccessReviewPanel initialItems={base} useApi={false} />);
    fireEvent.change(screen.getByLabelText(/Subject/), { target: { value: "New Record" } });
    fireEvent.change(screen.getByLabelText(/Reviewer/), { target: { value: "Auditor" } });
    fireEvent.click(screen.getByText(/Update/));

    expect(screen.getByText(/New Record/)).toBeInTheDocument();
  });
});
