import type { ProblemRecord, SessionState } from "../types";

const SESSION_STORAGE_KEY = "math-practice-session";
const SESSION_VERSION = 2;

function isProblemRecord(value: unknown): value is ProblemRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    (record.skill === "addition" || record.skill === "subtraction") &&
    typeof record.prompt === "string" &&
    typeof record.answer === "number" &&
    Array.isArray(record.operands) &&
    record.operands.length === 2 &&
    typeof record.operands[0] === "number" &&
    typeof record.operands[1] === "number" &&
    typeof record.attempts === "number" &&
    typeof record.solved === "boolean" &&
    (typeof record.elapsedMs === "number" || record.elapsedMs === null) &&
    typeof record.firstAttemptCorrect === "boolean" &&
    (record.difficulty === "intro" || record.difficulty === "core" || record.difficulty === "challenge") &&
    Array.isArray(record.tags)
  );
}

function isSessionState(value: unknown): value is SessionState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Record<string, unknown>;
  return (
    session.version === SESSION_VERSION &&
    (session.mode === "regular" || session.mode === "challenge") &&
    Array.isArray(session.records) &&
    session.records.every((record) => isProblemRecord(record)) &&
    typeof session.currentIndex === "number" &&
    typeof session.answer === "string" &&
    (typeof session.feedback === "string" || session.feedback === null) &&
    typeof session.problemStartedAt === "number"
  );
}

export function loadSessionState(): SessionState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isSessionState(parsed)) {
      clearSessionState();
      return null;
    }

    if (parsed.currentIndex < 0 || parsed.currentIndex >= parsed.records.length) {
      clearSessionState();
      return null;
    }

    return parsed;
  } catch {
    clearSessionState();
    return null;
  }
}

export function saveSessionState(state: Omit<SessionState, "version">): void {
  if (typeof window === "undefined") {
    return;
  }

  const nextState: SessionState = {
    version: SESSION_VERSION,
    ...state
  };

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextState));
}

export function clearSessionState(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
