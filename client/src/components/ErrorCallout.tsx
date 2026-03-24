import { useMemo, useState } from "react";
import { describeError } from "../lib/api";

interface ErrorCalloutProps {
  error: unknown;
  onRetry?: () => Promise<void> | void;
  retryLabel?: string;
}

export const ErrorCallout = ({ error, onRetry, retryLabel = "Retry" }: ErrorCalloutProps) => {
  const [retryCooldownSeconds, setRetryCooldownSeconds] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const presentation = useMemo(() => describeError(error), [error]);

  if (!error) {
    return null;
  }

  const handleRetry = async () => {
    if (!onRetry || retryCooldownSeconds > 0) {
      return;
    }

    try {
      setIsRetrying(true);
      await onRetry();
      setRetryCooldownSeconds(5);

      const intervalId = window.setInterval(() => {
        setRetryCooldownSeconds((previous) => {
          if (previous <= 1) {
            window.clearInterval(intervalId);
            return 0;
          }
          return previous - 1;
        });
      }, 1000);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="error-card" role="alert">
      <p className="error-card-title">{presentation.title}</p>
      <p>
        <strong>What happened:</strong> {presentation.whatHappened}
      </p>
      <p>
        <strong>What to do now:</strong> {presentation.whatToDo}
      </p>
      <p>
        <strong>Request ID:</strong> {presentation.requestId ?? "Not available"}
      </p>
      {onRetry && presentation.retryable && (
        <button
          className="btn btn-secondary"
          type="button"
          onClick={handleRetry}
          disabled={isRetrying || retryCooldownSeconds > 0}
        >
          {isRetrying
            ? "Retrying..."
            : retryCooldownSeconds > 0
              ? `${retryLabel} (${retryCooldownSeconds}s)`
              : retryLabel}
        </button>
      )}
    </div>
  );
};
