"use client";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Standardized error message component
 * Shows a simple one-line error with optional retry action
 */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="text-red-600 mb-4 bg-red-50 border border-red-200 px-4 py-2 rounded flex items-center justify-between">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-4 text-sm text-red-700 underline hover:text-red-900"
        >
          Retry
        </button>
      )}
    </div>
  );
}
