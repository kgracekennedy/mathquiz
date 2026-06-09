import { FormEvent, useEffect, useRef, useState } from "react";
import { formatDuration } from "./lib/format";
import { clearSessionState, loadSessionState, saveSessionState } from "./lib/session-storage";
import { cancelSpeech, speakProblem, supportsSpeechSynthesis } from "./lib/speech";
import { buildSessionReport, createProblemRecords, evaluateAnswer } from "./skills/arithmetic";
import type { ProblemRecord, SessionMode, SessionState } from "./types";

const ENCOURAGEMENTS = [
  "Nice effort. Try that one again.",
  "You are close. Give it another shot.",
  "Keep going. You can solve this one."
];
const MODE_LABELS: Record<SessionMode, string> = {
  regular: "Regular",
  challenge: "Challenge"
};

function getInitialSession(): SessionState | null {
  return loadSessionState();
}

function App() {
  const [initialSession] = useState(() => getInitialSession());
  const [mode, setMode] = useState<SessionMode>(() => initialSession?.mode ?? "regular");
  const [records, setRecords] = useState<ProblemRecord[]>(
    () => initialSession?.records ?? createProblemRecords("regular")
  );
  const [currentIndex, setCurrentIndex] = useState(() => initialSession?.currentIndex ?? 0);
  const [answer, setAnswer] = useState(() => initialSession?.answer ?? "");
  const [feedback, setFeedback] = useState<string | null>(() => initialSession?.feedback ?? null);
  const [problemStartedAt, setProblemStartedAt] = useState(
    () => initialSession?.problemStartedAt ?? Date.now()
  );
  const [sessionMessage, setSessionMessage] = useState<string | null>(() =>
    initialSession ? "Resumed your previous session." : null
  );
  const [showResumeBanner, setShowResumeBanner] = useState(() => initialSession !== null);
  const [speechSupported] = useState(() => supportsSpeechSynthesis());
  const inputRef = useRef<HTMLInputElement>(null);

  const currentRecord = records[currentIndex];
  const quizComplete = currentIndex >= records.length;
  const report = quizComplete ? buildSessionReport(records) : null;

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  useEffect(() => {
    cancelSpeech();
    return () => {
      cancelSpeech();
    };
  }, [currentIndex]);

  useEffect(() => {
    if (quizComplete || !currentRecord) {
      clearSessionState();
      return;
    }

    saveSessionState({
      mode,
      records,
      currentIndex,
      answer,
      feedback,
      problemStartedAt
    });
  }, [answer, currentIndex, currentRecord, feedback, mode, problemStartedAt, quizComplete, records]);

  function resetSession(nextMode: SessionMode = mode, message: string | null = null) {
    clearSessionState();
    cancelSpeech();
    setMode(nextMode);
    setRecords(createProblemRecords(nextMode));
    setCurrentIndex(0);
    setAnswer("");
    setFeedback(null);
    setProblemStartedAt(Date.now());
    setSessionMessage(message);
    setShowResumeBanner(false);
  }

  function handleModeChange(nextMode: SessionMode) {
    if (nextMode === mode && !showResumeBanner) {
      return;
    }

    resetSession(nextMode, `Started a new ${MODE_LABELS[nextMode].toLowerCase()} set.`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentRecord) {
      return;
    }

    const isCorrect = evaluateAnswer(answer, currentRecord.answer);
    const nextAttemptCount = currentRecord.attempts + 1;

    if (!isCorrect) {
      setRecords((previous) =>
        previous.map((record, index) =>
          index === currentIndex ? { ...record, attempts: nextAttemptCount } : record
        )
      );
      setFeedback(ENCOURAGEMENTS[(nextAttemptCount - 1) % ENCOURAGEMENTS.length]);
      setAnswer("");
      setSessionMessage(null);
      return;
    }

    const elapsedMs = Date.now() - problemStartedAt;

    setRecords((previous) =>
      previous.map((record, index) =>
        index === currentIndex
          ? {
              ...record,
              attempts: nextAttemptCount,
              solved: true,
              elapsedMs,
              firstAttemptCorrect: nextAttemptCount === 1
            }
          : record
      )
    );
    setFeedback(null);
    setAnswer("");
    setSessionMessage(null);
    setCurrentIndex((previous) => previous + 1);

    if (currentIndex + 1 < records.length) {
      setProblemStartedAt(Date.now());
    }
  }

  if (quizComplete && report) {
    return (
      <main className="shell">
        <section className="panel summary-panel">
          <p className="eyebrow">Session complete</p>
          <h1>Parent Summary</h1>
          <p className="lede">
            Ten problems complete. This summary shows first-try accuracy, time to correct answer,
            and where extra practice is needed.
          </p>

          <div className="summary-grid">
            <article className="summary-card">
              <span className="summary-label">Problems solved</span>
              <strong>{report.solvedProblems} / 10</strong>
            </article>
            <article className="summary-card">
              <span className="summary-label">Total attempts</span>
              <strong>{report.totalAttempts}</strong>
            </article>
          </div>

          <div className="skill-grid">
            {report.skillSummaries.map((summary) => (
              <article key={summary.skill} className="skill-card">
                <h2>{summary.label}</h2>
                <p>{summary.percentCorrect}% correct on the first try</p>
                <p>Average time to correct: {formatDuration(summary.averageTimeToCorrectMs)}</p>
              </article>
            ))}
          </div>

          <section className="missed-list">
            <h2>Problems Missed on the First Try</h2>
            {report.missedProblems.length === 0 ? (
              <p>None. Every problem was correct on the first try.</p>
            ) : (
              <ul>
                {report.missedProblems.map((record) => (
                  <li key={record.id}>
                    <span>{record.prompt} = {record.answer}</span>
                    <span>{record.attempts} attempts</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <button
            type="button"
            className="primary-button"
            onClick={() => resetSession(mode, `Started a new ${MODE_LABELS[mode].toLowerCase()} set.`)}
          >
            Start a new set
          </button>
        </section>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {sessionMessage ?? ""}
        </p>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="panel quiz-panel">
        <p className="eyebrow">Math Practice</p>
        <h1>Addition and subtraction</h1>
        <p className="lede" id="session-help">
          Solve 10 problems. If an answer is wrong, the app keeps the same problem on screen and
          lets the child try again.
        </p>

        <div className="mode-row" aria-label="Practice mode">
          <span className="mode-label">Mode</span>
          <div className="mode-toggle" role="group" aria-label="Practice mode selection">
            {(Object.keys(MODE_LABELS) as SessionMode[]).map((option) => (
              <button
                key={option}
                type="button"
                className={option === mode ? "primary-button mode-button" : "secondary-button mode-button"}
                aria-pressed={option === mode}
                onClick={() => handleModeChange(option)}
              >
                {MODE_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        {showResumeBanner ? (
          <section className="status-banner" aria-live="polite">
            <div>
              <h2>Resumed session</h2>
              <p>Your last unfinished practice set is ready to continue.</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => resetSession(mode, `Started a new ${MODE_LABELS[mode].toLowerCase()} set.`)}
            >
              Start over
            </button>
          </section>
        ) : null}

        <div className="progress-row" aria-label="Session progress">
          <span>Problem {currentIndex + 1} of 10</span>
          <span>{MODE_LABELS[mode]} mode</span>
          <span>{currentRecord.skill === "addition" ? "Addition" : "Subtraction"}</span>
        </div>

        <div className="problem-card">
          <p className="problem-text">{currentRecord.prompt}</p>
          {speechSupported ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                speakProblem(currentRecord);
                setSessionMessage("Read the current problem aloud.");
              }}
            >
              Read aloud
            </button>
          ) : null}
        </div>

        <form className="answer-form" onSubmit={handleSubmit}>
          <label htmlFor="answer" className="answer-label">
            Type the answer
          </label>
          <input
            id="answer"
            ref={inputRef}
            inputMode="numeric"
            autoComplete="off"
            className="answer-input"
            value={answer}
            aria-describedby="session-help feedback"
            onChange={(event) => setAnswer(event.target.value)}
          />
          <button type="submit" className="primary-button">
            Check answer
          </button>
        </form>

        <p id="feedback" className={`feedback ${feedback ? "visible" : ""}`} aria-live="polite" aria-atomic="true">
          {feedback ?? " "}
        </p>
      </section>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {sessionMessage ?? ""}
      </p>
    </main>
  );
}

export default App;
