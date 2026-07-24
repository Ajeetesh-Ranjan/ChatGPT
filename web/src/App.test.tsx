import { render, screen } from "@testing-library/react";
import App from "./App";
import { expect, it } from "vitest";

it("renders hero and access review panel", () => {
  render(<App />);
  expect(screen.getByText(/Conflicts Identifier/i)).toBeInTheDocument();
  expect(screen.getByText(/Access Reviews/i)).toBeInTheDocument();
});
