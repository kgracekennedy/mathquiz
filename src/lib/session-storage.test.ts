import { afterEach, describe, expect, it } from "vitest";
import { clearSessionState, loadSessionState, saveSessionState } from "./session-storage";
import type { ProblemRecord } from "../types";

const SESSION_STORAGE_KEY = "math-practice-session";

const sampleRecord: ProblemRecord = {
  id: "addition-1",
  skill: "addition",
  prompt: "12 + 34",
  answer: 46,
  operands: [12, 34],
  difficulty: "intro",
  tags: ["no_regrouping"],
  attempts: 1,
  solved: false,
  elapsedMs: null,
  firstAttemptCorrect: false
};

describe("session storage helpers", () => {
  afterEach(() => {
    clearSessionState();
  });

  it("saves and restores a valid in-progress session", () => {
    saveSessionState({
      mode: "challenge",
      records: [sampleRecord],
      currentIndex: 0,
      answer: "46",
      feedback: null,
      problemStartedAt: 5000
    });

    expect(loadSessionState()).toEqual({
      version: 2,
      mode: "challenge",
      records: [sampleRecord],
      currentIndex: 0,
      answer: "46",
      feedback: null,
      problemStartedAt: 5000
    });
  });

  it("drops malformed saved sessions", () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        records: "bad-data",
        currentIndex: 0,
        answer: "",
        feedback: null,
        problemStartedAt: 10
      })
    );

    expect(loadSessionState()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("drops older saved sessions without mode data", () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        records: [sampleRecord],
        currentIndex: 0,
        answer: "",
        feedback: null,
        problemStartedAt: 10
      })
    );

    expect(loadSessionState()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
