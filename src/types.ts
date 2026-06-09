export type SkillId = "addition" | "subtraction";
export type DifficultyTier = "intro" | "core" | "challenge";
export type SessionMode = "regular" | "challenge";
export type ProblemTag =
  | "no_regrouping"
  | "regrouping"
  | "no_borrow"
  | "borrowing"
  | "near_miss_subtraction";

export interface ArithmeticProblem {
  id: string;
  skill: SkillId;
  prompt: string;
  answer: number;
  operands: [number, number];
  difficulty: DifficultyTier;
  tags: ProblemTag[];
}

export interface ProblemRecord extends ArithmeticProblem {
  attempts: number;
  solved: boolean;
  elapsedMs: number | null;
  firstAttemptCorrect: boolean;
}

export interface SkillDefinition {
  id: SkillId;
  label: string;
  generate: () => ArithmeticProblem;
}

export interface SkillSummary {
  skill: SkillId;
  label: string;
  total: number;
  firstTryCorrect: number;
  percentCorrect: number;
  averageTimeToCorrectMs: number;
}

export interface SessionReport {
  totalProblems: number;
  solvedProblems: number;
  skillSummaries: SkillSummary[];
  missedProblems: ProblemRecord[];
  totalAttempts: number;
}

export interface SessionState {
  version: number;
  mode: SessionMode;
  records: ProblemRecord[];
  currentIndex: number;
  answer: string;
  feedback: string | null;
  problemStartedAt: number;
}
