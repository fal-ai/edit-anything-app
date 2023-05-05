import { XCircleIcon } from "@heroicons/react/24/outline";
import { useCallback } from "react";

export interface ErrorNotificationProps {
  message: string;
  details?: string;
  onDismiss?: () => void;
}

export default function ErrorNotification(props: ErrorNotificationProps) {
  const { details, message, onDismiss } = props;
  const handleDismiss = useCallback(() => {
    onDismiss?.call(null);
  }, [onDismiss]);
  return (
    <div className="toast toast-top toast-center w-full md:w-auto md:toast-end">
      <div
        className="alert alert-error rounded-md space-y-2 md:space-y-4"
        onClick={handleDismiss}
      >
        <div>
          <XCircleIcon className="flex-shrink-0 h-6 w-6" />
          <span>{message}</span>
        </div>
        {details && (
          <div>
            <span>{details}</span>
          </div>
        )}
      </div>
    </div>
  );
}
