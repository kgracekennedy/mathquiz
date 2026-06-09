import type {
  ArithmeticProblem,
  DifficultyTier,
  ProblemRecord,
  ProblemTag,
  SessionMode,
  SessionReport,
  SkillDefinition,
  SkillId
} from "../types";

const SKILL_LABELS: Record<SkillId, string> = {
  addition: "Addition",
  subtraction: "Subtraction"
};

const TWO_DIGIT_MIN = 10;
const THREE_DIGIT_MAX = 999;
const FOUR_DIGIT_MAX = 9999;
const GENERATION_ATTEMPTS = 40;
let problemSequence = 0;

interface SlotPlan {
  skill: SkillId;
  difficulty: DifficultyTier;
  tag: ProblemTag;
  generate: (random: () => number, difficulty: DifficultyTier) => ArithmeticProblem;
  digitLength?: number;
}

const REGULAR_SESSION_PLAN: SlotPlan[] = [
  { skill: "addition", difficulty: "intro", tag: "no_regrouping", generate: generateAdditionWithoutRegrouping },
  { skill: "subtraction", difficulty: "intro", tag: "no_borrow", generate: generateSubtractionWithoutBorrowing },
  { skill: "addition", difficulty: "intro", tag: "no_regrouping", generate: generateAdditionWithoutRegrouping },
  { skill: "subtraction", difficulty: "core", tag: "near_miss_subtraction", generate: generateNearMissSubtraction },
  { skill: "addition", difficulty: "core", tag: "regrouping", generate: generateAdditionWithRegrouping },
  { skill: "subtraction", difficulty: "core", tag: "borrowing", generate: generateSubtractionWithBorrowing },
  { skill: "addition", difficulty: "core", tag: "regrouping", generate: generateAdditionWithRegrouping },
  { skill: "subtraction", difficulty: "core", tag: "no_borrow", generate: generateSubtractionWithoutBorrowing },
  { skill: "addition", difficulty: "challenge", tag: "regrouping", generate: generateAdditionWithRegrouping },
  { skill: "subtraction", difficulty: "challenge", tag: "borrowing", generate: generateSubtractionWithBorrowing }
];

const CHALLENGE_SESSION_PLAN: SlotPlan[] = [
  { skill: "addition", difficulty: "core", tag: "regrouping", generate: generateAdditionWithRegrouping },
  { skill: "subtraction", difficulty: "core", tag: "borrowing", generate: generateSubtractionWithBorrowing },
  { skill: "addition", difficulty: "challenge", tag: "no_regrouping", generate: generateAdditionWithoutRegrouping, digitLength: 4 },
  { skill: "subtraction", difficulty: "core", tag: "near_miss_subtraction", generate: generateNearMissSubtraction },
  { skill: "addition", difficulty: "challenge", tag: "regrouping", generate: generateAdditionWithRegrouping },
  { skill: "subtraction", difficulty: "challenge", tag: "no_borrow", generate: generateSubtractionWithoutBorrowing, digitLength: 4 },
  { skill: "addition", difficulty: "challenge", tag: "regrouping", generate: generateAdditionWithRegrouping },
  { skill: "subtraction", difficulty: "challenge", tag: "borrowing", generate: generateSubtractionWithBorrowing },
  { skill: "addition", difficulty: "challenge", tag: "regrouping", generate: generateAdditionWithRegrouping },
  { skill: "subtraction", difficulty: "challenge", tag: "borrowing", generate: generateSubtractionWithBorrowing }
];

function nextProblemId(skill: SkillId): string {
  problemSequence += 1;
  return `${skill}-${problemSequence}`;
}

function randomInt(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pickDigit(min: number, max: number, random: () => number): number {
  return randomInt(min, max, random);
}

function buildNumber(digits: number[]): number {
  return digits.reduceRight((value, digit) => value * 10 + digit, 0);
}

function digitsOf(value: number): number[] {
  return String(value)
    .split("")
    .reverse()
    .map((digit) => Number(digit));
}

function chooseDigitLength(random: () => number, difficulty: DifficultyTier): number {
  if (difficulty === "intro") {
    return 2;
  }

  if (difficulty === "challenge") {
    return 3;
  }

  return random() < 0.5 ? 2 : 3;
}

function getSessionPlan(mode: SessionMode): SlotPlan[] {
  return mode === "challenge" ? CHALLENGE_SESSION_PLAN : REGULAR_SESSION_PLAN;
}

function makeProblem(
  skill: SkillId,
  difficulty: DifficultyTier,
  tags: ProblemTag[],
  left: number,
  right: number
): ArithmeticProblem {
  const answer = skill === "addition" ? left + right : left - right;
  const operator = skill === "addition" ? "+" : "-";

  return {
    id: nextProblemId(skill),
    skill,
    prompt: `${left} ${operator} ${right}`,
    answer,
    operands: [left, right],
    difficulty,
    tags
  };
}

function hasCarry(left: number, right: number): boolean {
  const leftDigits = digitsOf(left);
  const rightDigits = digitsOf(right);
  const maxDigits = Math.max(leftDigits.length, rightDigits.length);

  for (let index = 0; index < maxDigits; index += 1) {
    if ((leftDigits[index] ?? 0) + (rightDigits[index] ?? 0) >= 10) {
      return true;
    }
  }

  return false;
}

function requiresBorrow(minuend: number, subtrahend: number): boolean {
  const minuendDigits = digitsOf(minuend);
  const subtrahendDigits = digitsOf(subtrahend);
  const maxDigits = Math.max(minuendDigits.length, subtrahendDigits.length);

  for (let index = 0; index < maxDigits; index += 1) {
    if ((minuendDigits[index] ?? 0) < (subtrahendDigits[index] ?? 0)) {
      return true;
    }
  }

  return false;
}

function createNoRegroupingAddends(random: () => number, digitLength: number): [number, number] {
  const leftDigits: number[] = [];
  const rightDigits: number[] = [];

  for (let index = 0; index < digitLength; index += 1) {
    const isHighestDigit = index === digitLength - 1;
    const rightMin = isHighestDigit ? 1 : 0;
    const rightMax = isHighestDigit ? 8 : 9;
    const rightDigit = pickDigit(rightMin, rightMax, random);
    const leftMin = isHighestDigit ? 1 : 0;
    const leftMax = 9 - rightDigit;
    const leftDigit = pickDigit(leftMin, leftMax, random);

    leftDigits.push(leftDigit);
    rightDigits.push(rightDigit);
  }

  return [buildNumber(leftDigits), buildNumber(rightDigits)];
}

function createRegroupingAddends(random: () => number, digitLength: number): [number, number] {
  const carryIndex = pickDigit(0, digitLength - 1, random);
  const leftDigits: number[] = [];
  const rightDigits: number[] = [];

  for (let index = 0; index < digitLength; index += 1) {
    const isHighestDigit = index === digitLength - 1;
    const minLeft = isHighestDigit ? 1 : 0;
    const minRight = isHighestDigit ? 1 : 0;

    if (index === carryIndex) {
      const leftDigit = pickDigit(Math.max(minLeft, 1), 9, random);
      const rightMin = Math.max(minRight, 10 - leftDigit);
      const rightDigit = pickDigit(rightMin, 9, random);
      leftDigits.push(leftDigit);
      rightDigits.push(rightDigit);
      continue;
    }

    const rightDigit = pickDigit(minRight, 9, random);
    const leftMax = Math.max(minLeft, 9 - rightDigit);
    const leftDigit = pickDigit(minLeft, leftMax, random);
    leftDigits.push(leftDigit);
    rightDigits.push(rightDigit);
  }

  return [buildNumber(leftDigits), buildNumber(rightDigits)];
}

function createNoBorrowSubtraction(random: () => number, digitLength: number): [number, number] {
  const minuendDigits: number[] = [];
  const subtrahendDigits: number[] = [];

  for (let index = 0; index < digitLength; index += 1) {
    const isHighestDigit = index === digitLength - 1;
    const minuendDigit = pickDigit(isHighestDigit ? 1 : 0, 9, random);
    const subtrahendDigit = pickDigit(0, minuendDigit, random);
    minuendDigits.push(minuendDigit);
    subtrahendDigits.push(subtrahendDigit);
  }

  return [buildNumber(minuendDigits), buildNumber(subtrahendDigits)];
}

function createBorrowSubtraction(random: () => number, digitLength: number): [number, number] {
  const borrowIndex = pickDigit(0, digitLength - 2, random);
  const minuendDigits: number[] = [];
  const subtrahendDigits: number[] = [];

  for (let index = 0; index < digitLength; index += 1) {
    const isHighestDigit = index === digitLength - 1;

    if (index === borrowIndex) {
      const minuendDigit = pickDigit(0, 8, random);
      const subtrahendDigit = pickDigit(minuendDigit + 1, 9, random);
      minuendDigits.push(minuendDigit);
      subtrahendDigits.push(subtrahendDigit);
      continue;
    }

    const minuendMin = index === borrowIndex + 1 ? 1 : isHighestDigit ? 1 : 0;
    const minuendDigit = pickDigit(minuendMin, 9, random);
    const subtrahendMax = isHighestDigit ? minuendDigit - 1 : minuendDigit;
    const subtrahendDigit = pickDigit(0, subtrahendMax, random);
    minuendDigits.push(minuendDigit);
    subtrahendDigits.push(subtrahendDigit);
  }

  return [buildNumber(minuendDigits), buildNumber(subtrahendDigits)];
}

export function randomOperand(random = Math.random): number {
  return randomInt(TWO_DIGIT_MIN, THREE_DIGIT_MAX, random);
}

export function generateAdditionWithoutRegrouping(
  random = Math.random,
  difficulty: DifficultyTier = "core"
): ArithmeticProblem {
  const digitLength = chooseDigitLength(random, difficulty);
  const [left, right] = createNoRegroupingAddends(random, digitLength);

  return makeProblem("addition", difficulty, ["no_regrouping"], left, right);
}

export function generateAdditionWithRegrouping(
  random = Math.random,
  difficulty: DifficultyTier = "core"
): ArithmeticProblem {
  const digitLength = chooseDigitLength(random, difficulty);
  const [left, right] = createRegroupingAddends(random, digitLength);

  return makeProblem("addition", difficulty, ["regrouping"], left, right);
}

export function generateAdditionProblem(random = Math.random): ArithmeticProblem {
  return random() < 0.5
    ? generateAdditionWithoutRegrouping(random)
    : generateAdditionWithRegrouping(random);
}

export function generateSubtractionWithoutBorrowing(
  random = Math.random,
  difficulty: DifficultyTier = "core"
): ArithmeticProblem {
  const digitLength = chooseDigitLength(random, difficulty);
  const [minuend, subtrahend] = createNoBorrowSubtraction(random, digitLength);

  return makeProblem("subtraction", difficulty, ["no_borrow"], minuend, subtrahend);
}

export function generateSubtractionWithBorrowing(
  random = Math.random,
  difficulty: DifficultyTier = "core"
): ArithmeticProblem {
  const digitLength = Math.max(2, chooseDigitLength(random, difficulty));
  const [minuend, subtrahend] = createBorrowSubtraction(random, digitLength);

  return makeProblem("subtraction", difficulty, ["borrowing"], minuend, subtrahend);
}

export function generateNearMissSubtraction(
  random = Math.random,
  difficulty: DifficultyTier = "core"
): ArithmeticProblem {
  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    const difference = pickDigit(1, 9, random);
    const maxOperand = chooseDigitLength(random, difficulty) === 2 ? 99 : THREE_DIGIT_MAX;
    const subtrahend = randomInt(TWO_DIGIT_MIN, maxOperand - difference, random);
    const minuend = subtrahend + difference;

    if (!requiresBorrow(minuend, subtrahend)) {
      continue;
    }

    return makeProblem("subtraction", difficulty, ["near_miss_subtraction"], minuend, subtrahend);
  }

  return makeProblem("subtraction", difficulty, ["near_miss_subtraction"], 101, 99);
}

export function generateSubtractionProblem(random = Math.random): ArithmeticProblem {
  return random() < 0.5
    ? generateSubtractionWithoutBorrowing(random)
    : generateSubtractionWithBorrowing(random);
}

export const skillDefinitions: SkillDefinition[] = [
  {
    id: "addition",
    label: SKILL_LABELS.addition,
    generate: () => generateAdditionProblem()
  },
  {
    id: "subtraction",
    label: SKILL_LABELS.subtraction,
    generate: () => generateSubtractionProblem()
  }
];

function operandPairKey([left, right]: [number, number]): string {
  return [left, right].sort((a, b) => a - b).join(":");
}

function primaryTag(problem: ArithmeticProblem): ProblemTag {
  return problem.tags[0] ?? "regrouping";
}

function isNearDuplicate(previous: ArithmeticProblem, candidate: ArithmeticProblem): boolean {
  if (previous.skill !== candidate.skill) {
    return false;
  }

  const [previousLeft, previousRight] = previous.operands;
  const [candidateLeft, candidateRight] = candidate.operands;
  return Math.abs(previousLeft - candidateLeft) <= 8 && Math.abs(previousRight - candidateRight) <= 8;
}

function scoreCandidate(candidate: ArithmeticProblem, accepted: ArithmeticProblem[]): number {
  let score = 0;
  const recentProblems = accepted.slice(-3);

  if (accepted.some((problem) => problem.prompt === candidate.prompt)) {
    score += 100;
  }

  if (accepted.some((problem) => operandPairKey(problem.operands) === operandPairKey(candidate.operands))) {
    score += 100;
  }

  if (recentProblems.some((problem) => isNearDuplicate(problem, candidate))) {
    score += 15;
  }

  const sameSkillStreak = accepted
    .slice()
    .reverse()
    .findIndex((problem) => problem.skill !== candidate.skill);
  if (sameSkillStreak === -1 && accepted.length >= 2) {
    score += 20;
  } else if (sameSkillStreak >= 2) {
    score += 20;
  }

  const sameTagStreak = accepted
    .slice()
    .reverse()
    .findIndex((problem) => primaryTag(problem) !== primaryTag(candidate));
  if (sameTagStreak === -1 && accepted.length >= 2) {
    score += 10;
  } else if (sameTagStreak >= 2) {
    score += 10;
  }

  if (recentProblems.some((problem) => problem.difficulty === candidate.difficulty && primaryTag(problem) === primaryTag(candidate))) {
    score += 5;
  }

  return score;
}

function generateSlotProblem(slot: SlotPlan, accepted: ArithmeticProblem[], random: () => number): ArithmeticProblem {
  let bestCandidate = generatePlannedProblem(slot, random);
  let bestScore = scoreCandidate(bestCandidate, accepted);

  for (let attempt = 1; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = generatePlannedProblem(slot, random);
    const candidateScore = scoreCandidate(candidate, accepted);

    if (candidateScore < bestScore) {
      bestCandidate = candidate;
      bestScore = candidateScore;
    }

    if (candidateScore === 0) {
      return candidate;
    }
  }

  return bestCandidate;
}

function generatePlannedProblem(slot: SlotPlan, random: () => number): ArithmeticProblem {
  const problem = slot.generate(random, slot.difficulty);
  if (!slot.digitLength) {
    return problem;
  }

  for (let attempt = 1; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    if (
      String(problem.operands[0]).length === slot.digitLength &&
      String(problem.operands[1]).length === slot.digitLength
    ) {
      return problem;
    }

    const candidate = slot.generate(random, slot.difficulty);
    if (
      String(candidate.operands[0]).length === slot.digitLength &&
      String(candidate.operands[1]).length === slot.digitLength
    ) {
      return candidate;
    }
  }

  return slot.tag === "no_regrouping"
    ? makeProblem("addition", slot.difficulty, ["no_regrouping"], 4123, 1564)
    : makeProblem("subtraction", slot.difficulty, ["no_borrow"], 8642, 2310);
}

export function createQuiz(mode: SessionMode = "regular", random = Math.random): ArithmeticProblem[] {
  return getSessionPlan(mode).reduce<ArithmeticProblem[]>((problems, slot) => {
    problems.push(generateSlotProblem(slot, problems, random));
    return problems;
  }, []);
}

export function createProblemRecords(mode: SessionMode = "regular", random = Math.random): ProblemRecord[] {
  return createQuiz(mode, random).map((problem) => ({
    ...problem,
    attempts: 0,
    solved: false,
    elapsedMs: null,
    firstAttemptCorrect: false
  }));
}

export function evaluateAnswer(input: string, answer: number): boolean {
  const normalized = input.trim();
  if (!/^-?\d+$/.test(normalized)) {
    return false;
  }

  return Number(normalized) === answer;
}

export function buildSessionReport(records: ProblemRecord[]): SessionReport {
  const skillSummaries = (Object.keys(SKILL_LABELS) as SkillId[]).map((skill) => {
    const skillRecords = records.filter((record) => record.skill === skill);
    const solvedRecords = skillRecords.filter((record) => record.solved && record.elapsedMs !== null);
    const firstTryCorrect = skillRecords.filter((record) => record.firstAttemptCorrect).length;
    const totalElapsed = solvedRecords.reduce((sum, record) => sum + (record.elapsedMs ?? 0), 0);
    const averageTimeToCorrectMs =
      solvedRecords.length > 0 ? Math.round(totalElapsed / solvedRecords.length) : 0;

    return {
      skill,
      label: SKILL_LABELS[skill],
      total: skillRecords.length,
      firstTryCorrect,
      percentCorrect:
        skillRecords.length > 0 ? Math.round((firstTryCorrect / skillRecords.length) * 100) : 0,
      averageTimeToCorrectMs
    };
  });

  return {
    totalProblems: records.length,
    solvedProblems: records.filter((record) => record.solved).length,
    skillSummaries,
    missedProblems: records.filter((record) => !record.firstAttemptCorrect),
    totalAttempts: records.reduce((sum, record) => sum + record.attempts, 0)
  };
}

export function problemRequiresCarry(problem: ArithmeticProblem): boolean {
  return hasCarry(problem.operands[0], problem.operands[1]);
}

export function problemRequiresBorrow(problem: ArithmeticProblem): boolean {
  return requiresBorrow(problem.operands[0], problem.operands[1]);
}
