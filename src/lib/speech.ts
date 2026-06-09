import type { ProblemRecord } from "../types";

function getSpeechSupport(): SpeechSynthesis | null {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof window.SpeechSynthesisUtterance === "undefined"
  ) {
    return null;
  }

  return window.speechSynthesis;
}

export function supportsSpeechSynthesis(): boolean {
  return getSpeechSupport() !== null;
}

export function speakProblem(problem: ProblemRecord): boolean {
  const speechSynthesis = getSpeechSupport();
  if (!speechSynthesis) {
    return false;
  }

  const [left, right] = problem.operands;
  const verb = problem.skill === "addition" ? "plus" : "minus";
  const utterance = new window.SpeechSynthesisUtterance(`What is ${left} ${verb} ${right}?`);
  utterance.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
  return true;
}

export function cancelSpeech(): void {
  const speechSynthesis = getSpeechSupport();
  speechSynthesis?.cancel();
}
