"use client";

import { useState, useEffect } from "react";
import { useMCQPlay } from "@/hooks/useMCQPlay";
import { useMCQResponse } from "@/hooks/useMCQResponse";
import { ErrorMessage } from "@/components/ErrorMessage";
import Link from "next/link";

export default function MCQPlayPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    explanation: string | null;
    correctAnswerIndex: number;
  } | null>(null);
  const [timeStarted, setTimeStarted] = useState<number | null>(null);

  // Fetch MCQs (hardcoded to no topic filter for now - can be made configurable later)
  const { data: playData, isLoading, error, refetch } = useMCQPlay(undefined, 10);
  const submitResponse = useMCQResponse();

  const sessionId = playData?.sessionId;
  const questions = playData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const hasMoreQuestions = currentQuestionIndex < questions.length - 1;
  const isQuestionAnswered = result !== null;

  // Start timer when question loads
  useEffect(() => {
    if (currentQuestion && !isQuestionAnswered) {
      setTimeStarted(Date.now());
    }
  }, [currentQuestionIndex, currentQuestion, isQuestionAnswered]);

  const handleOptionClick = async (choice: number) => {
    if (!currentQuestion || !sessionId || isQuestionAnswered) {
      return;
    }

    setSelectedChoice(choice);

    // Calculate time spent
    const timeMs = timeStarted ? Date.now() - timeStarted : 0;

    try {
      const responseResult = await submitResponse.mutateAsync({
        sessionId,
        mcqId: currentQuestion.id,
        choice,
        timeMs,
      });

      setResult(responseResult);
    } catch (error: any) {
      console.error("Failed to submit response:", error);
      // Reset selection on error
      setSelectedChoice(null);
    }
  };

  const handleNext = () => {
    if (hasMoreQuestions) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setResult(null);
      setTimeStarted(null);
    }
  };

  const getOptionLabel = (index: number): string => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-gray-500">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <ErrorMessage
          message="Could not load questions. Retry."
          onRetry={() => refetch()}
        />
        <Link href="/week" className="text-blue-600 underline mt-4 inline-block">
          ← Back to Week View
        </Link>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="text-gray-600 mb-4">No questions available.</div>
        <Link href="/week" className="text-blue-600 underline">
          ← Back to Week View
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/week" className="text-blue-600 underline">
          ← Back to Week View
        </Link>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Question {currentQuestionIndex + 1} of {questions.length}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">{currentQuestion.stem}</h2>

        <div className="space-y-2">
          {currentQuestion.options.map((option: string, index: number) => {
            const isSelected = selectedChoice === index;
            const isDisabled = isQuestionAnswered;
            const isCorrectAnswer = result && result.correctAnswerIndex === index;
            const isWrongSelection = result && isSelected && !result.correct;

            let optionStyle = "border border-gray-300 px-4 py-3 text-left cursor-pointer hover:bg-gray-50";
            if (isDisabled) {
              optionStyle += " cursor-not-allowed opacity-60";
            }
            if (isSelected && !isQuestionAnswered) {
              optionStyle += " bg-blue-50 border-blue-400";
            }
            if (isQuestionAnswered && isCorrectAnswer) {
              optionStyle += " bg-green-50 border-green-400";
            }
            if (isWrongSelection) {
              optionStyle += " bg-red-50 border-red-400";
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={isDisabled}
                className={`w-full ${optionStyle}`}
              >
                <span className="font-medium">{getOptionLabel(index)}.</span> {option}
              </button>
            );
          })}
        </div>
      </div>

      {submitResponse.isPending && (
        <div className="text-gray-500 mb-4">Submitting answer...</div>
      )}

      {submitResponse.error && (
        <div className="text-red-600 mb-4">
          Error: {submitResponse.error.message}
        </div>
      )}

      {result && (
        <div className="mb-6 p-4 border border-gray-300">
          <div className={`font-semibold mb-2 ${result.correct ? "text-green-600" : "text-red-600"}`}>
            {result.correct ? "Correct" : "Incorrect"}
          </div>
          {result.explanation && (
            <div className="text-gray-700">{result.explanation}</div>
          )}
        </div>
      )}

      {isQuestionAnswered && (
        <div className="flex justify-between items-center">
          {hasMoreQuestions ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white border border-blue-700 hover:bg-blue-700"
            >
              Next Question
            </button>
          ) : (
            <div>
              <div className="text-gray-600 mb-2">All questions completed.</div>
              <Link href="/week" className="text-blue-600 underline">
                ← Back to Week View
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
