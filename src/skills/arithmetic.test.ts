import { describe, expect, it } from "vitest";
import {
  buildSessionReport,
  createQuiz,
  evaluateAnswer,
  generateAdditionWithRegrouping,
  generateAdditionWithoutRegrouping,
  generateNearMissSubtraction,
  generateSubtractionWithBorrowing,
  generateSubtractionWithoutBorrowing,
  problemRequiresBorrow,
  problemRequiresCarry
} from "./arithmetic";
import type { ProblemRecord, SessionMode } from "../types";

function createSeededRandom(seed: number): () => number {
  let current = seed;

  return () => {
    current = (current * 48271) % 2147483647;
    return (current - 1) / 2147483646;
  };
}

describe("arithmetic skill helpers", () => {
  it("creates a regular quiz with the planned skill and difficulty distribution", () => {
    const quiz = createQuiz("regular", createSeededRandom(17));
    const counts = quiz.reduce<Record<string, number>>((accumulator, problem) => {
      accumulator[problem.skill] = (accumulator[problem.skill] ?? 0) + 1;
      accumulator[problem.tags[0]] = (accumulator[problem.tags[0]] ?? 0) + 1;
      return accumulator;
    }, {});

    expect(quiz).toHaveLength(10);
    expect(counts.addition).toBe(5);
    expect(counts.subtraction).toBe(5);
    expect(counts.no_regrouping).toBe(2);
    expect(counts.regrouping).toBe(3);
    expect(counts.no_borrow).toBe(2);
    expect(counts.borrowing).toBe(2);
    expect(counts.near_miss_subtraction).toBe(1);
    expect(quiz.map((problem) => problem.skill)).toEqual([
      "addition",
      "subtraction",
      "addition",
      "subtraction",
      "addition",
      "subtraction",
      "addition",
      "subtraction",
      "addition",
      "subtraction"
    ]);
  });

  it("creates a challenge quiz with mostly hard structure and two four-digit confidence items", () => {
    const quiz = createQuiz("challenge", createSeededRandom(21));
    const counts = quiz.reduce<Record<string, number>>((accumulator, problem) => {
      accumulator[problem.skill] = (accumulator[problem.skill] ?? 0) + 1;
      accumulator[problem.tags[0]] = (accumulator[problem.tags[0]] ?? 0) + 1;
      return accumulator;
    }, {});
    const fourDigitProblems = quiz.filter(
      (problem) =>
        String(problem.operands[0]).length === 4 && String(problem.operands[1]).length === 4
    );

    expect(quiz).toHaveLength(10);
    expect(counts.addition).toBe(5);
    expect(counts.subtraction).toBe(5);
    expect(counts.regrouping).toBe(4);
    expect(counts.borrowing).toBe(3);
    expect(counts.near_miss_subtraction).toBe(1);
    expect(counts.no_regrouping).toBe(1);
    expect(counts.no_borrow).toBe(1);
    expect(fourDigitProblems).toHaveLength(2);
    expect(fourDigitProblems.map((problem) => problem.tags[0]).sort()).toEqual([
      "no_borrow",
      "no_regrouping"
    ]);
  });

  it("avoids duplicate prompts and repeated operand pairs in a session", () => {
    (["regular", "challenge"] as SessionMode[]).forEach((mode) => {
      const quiz = createQuiz(mode, createSeededRandom(mode === "regular" ? 99 : 199));
      const prompts = new Set(quiz.map((problem) => problem.prompt));
      const pairKeys = new Set(
        quiz.map((problem) => [...problem.operands].sort((left, right) => left - right).join(":"))
      );

      expect(prompts.size).toBe(quiz.length);
      expect(pairKeys.size).toBe(quiz.length);
    });
  });

  it("generates addition problems without regrouping when requested", () => {
    const random = createSeededRandom(7);

    for (let index = 0; index < 20; index += 1) {
      const problem = generateAdditionWithoutRegrouping(random);
      expect(problem.tags).toContain("no_regrouping");
      expect(problemRequiresCarry(problem)).toBe(false);
    }
  });

  it("generates addition problems with regrouping when requested", () => {
    const random = createSeededRandom(13);

    for (let index = 0; index < 20; index += 1) {
      const problem = generateAdditionWithRegrouping(random);
      expect(problem.tags).toContain("regrouping");
      expect(problemRequiresCarry(problem)).toBe(true);
    }
  });

  it("generates subtraction problems without borrowing when requested", () => {
    const random = createSeededRandom(23);

    for (let index = 0; index < 20; index += 1) {
      const problem = generateSubtractionWithoutBorrowing(random);
      expect(problem.tags).toContain("no_borrow");
      expect(problemRequiresBorrow(problem)).toBe(false);
      expect(problem.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("generates subtraction problems with borrowing when requested", () => {
    const random = createSeededRandom(29);

    for (let index = 0; index < 20; index += 1) {
      const problem = generateSubtractionWithBorrowing(random);
      expect(problem.tags).toContain("borrowing");
      expect(problemRequiresBorrow(problem)).toBe(true);
      expect(problem.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it("generates near-miss subtraction problems with small positive differences", () => {
    const random = createSeededRandom(31);

    for (let index = 0; index < 20; index += 1) {
      const problem = generateNearMissSubtraction(random);
      expect(problem.tags).toContain("near_miss_subtraction");
      expect(problemRequiresBorrow(problem)).toBe(true);
      expect(problem.answer).toBeGreaterThanOrEqual(1);
      expect(problem.answer).toBeLessThanOrEqual(9);
    }
  });

  it("validates numeric answers", () => {
    expect(evaluateAnswer("123", 123)).toBe(true);
    expect(evaluateAnswer(" 123 ", 123)).toBe(true);
    expect(evaluateAnswer("12a", 12)).toBe(false);
    expect(evaluateAnswer("", 0)).toBe(false);
  });

  it("builds a report with first-try accuracy, times, and missed problems", () => {
    const records: ProblemRecord[] = [
      {
        id: "1",
        skill: "addition",
        prompt: "120 + 30",
        answer: 150,
        operands: [120, 30],
        difficulty: "intro",
        tags: ["no_regrouping"],
        attempts: 1,
        solved: true,
        elapsedMs: 5000,
        firstAttemptCorrect: true
      },
      {
        id: "2",
        skill: "addition",
        prompt: "250 + 20",
        answer: 270,
        operands: [250, 20],
        difficulty: "core",
        tags: ["regrouping"],
        attempts: 3,
        solved: true,
        elapsedMs: 9000,
        firstAttemptCorrect: false
      },
      {
        id: "3",
        skill: "subtraction",
        prompt: "403 - 198",
        answer: 205,
        operands: [403, 198],
        difficulty: "challenge",
        tags: ["borrowing"],
        attempts: 1,
        solved: true,
        elapsedMs: 7000,
        firstAttemptCorrect: true
      }
    ];

    const report = buildSessionReport(records);

    expect(report.totalProblems).toBe(3);
    expect(report.totalAttempts).toBe(5);
    expect(report.missedProblems).toHaveLength(1);
    expect(report.skillSummaries[0]?.percentCorrect).toBe(50);
    expect(report.skillSummaries[0]?.averageTimeToCorrectMs).toBe(7000);
    expect(report.skillSummaries[1]?.percentCorrect).toBe(100);
  });
});
