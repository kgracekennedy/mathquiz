import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { createProblemRecords } from "./skills/arithmetic";

const SESSION_STORAGE_KEY = "math-practice-session";

function installSpeechSupport() {
  const speak = vi.fn();
  const cancel = vi.fn();

  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: { speak, cancel }
  });

  class MockSpeechSynthesisUtterance {
    rate = 1;

    constructor(public text: string) {}
  }

  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    configurable: true,
    value: MockSpeechSynthesisUtterance
  });

  return { speak, cancel };
}

describe("App", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
    Reflect.deleteProperty(window, "speechSynthesis");
    Reflect.deleteProperty(window, "SpeechSynthesisUtterance");
  });

  it("shows encouragement after a wrong answer and completes the session after correct answers", async () => {
    let now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => {
      now += 1000;
      return now;
    });

    render(<App />);
    const user = userEvent.setup();
    const input = screen.getByLabelText(/type the answer/i);
    const button = screen.getByRole("button", { name: /check answer/i });

    await user.type(input, "0");
    await user.click(button);

    expect(screen.getByText(/nice effort\. try that one again\./i)).toBeInTheDocument();

    for (let index = 0; index < 10; index += 1) {
      const problem = screen.getByText(/\d+\s[+-]\s\d+/).textContent ?? "";
      const [leftText, operator, rightText] = problem.split(" ");
      const left = Number(leftText);
      const right = Number(rightText);
      const answer = operator === "+" ? left + right : left - right;

      await user.clear(input);
      await user.type(input, String(answer));
      await user.click(button);
    }

    expect(screen.getByRole("heading", { name: /parent summary/i })).toBeInTheDocument();
  });

  it("restores an unfinished session from local storage and allows starting over", async () => {
    const records = createProblemRecords("challenge", () => 0.37);

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        mode: "challenge",
        records,
        currentIndex: 0,
        answer: "42",
        feedback: "Keep going. You can solve this one.",
        problemStartedAt: 1234
      })
    );

    render(<App />);
    const user = userEvent.setup();

    expect(screen.getByRole("heading", { name: /resumed session/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("42")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /challenge mode/i })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: /start over/i }));

    expect(screen.queryByRole("heading", { name: /resumed session/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/type the answer/i)).toHaveValue("");

    const savedState = JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) ?? "{}");
    expect(savedState.mode).toBe("challenge");
    expect(savedState.currentIndex).toBe(0);
    expect(savedState.answer).toBe("");
  });

  it("switches modes by starting a fresh set in the selected mode", async () => {
    render(<App />);
    const user = userEvent.setup();
    const modeGroup = screen.getByRole("group", { name: /practice mode selection/i });

    expect(within(modeGroup).getByRole("button", { name: /^regular mode$/i })).toHaveAttribute("aria-pressed", "true");

    await user.click(within(modeGroup).getByRole("button", { name: /^challenge mode$/i }));

    expect(within(modeGroup).getByRole("button", { name: /^challenge mode$/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/started a new challenge set\./i)).toBeInTheDocument();

    const savedState = JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) ?? "{}");
    expect(savedState.mode).toBe("challenge");
  });

  it("reads the current problem aloud when speech synthesis is available", async () => {
    const { speak, cancel } = installSpeechSupport();

    render(<App />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /read aloud/i }));

    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("keeps the quiz panel synced with the answer input focus state", async () => {
    render(<App />);
    const user = userEvent.setup();
    const input = screen.getByLabelText(/type the answer/i);
    const panel = input.closest(".quiz-panel");

    expect(panel).toHaveClass("answer-active");

    await user.tab();
    expect(panel).not.toHaveClass("answer-active");

    await user.click(input);
    expect(panel).toHaveClass("answer-active");
    expect(input).toHaveAttribute("pattern", "[0-9]*");
  });
});
