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
    <div className="toast toast-top toast-center w-full md:w-auto md:toast-end p-2 md:p-4">
      <div
        className="alert alert-error rounded-md shadow-md space-y-2 md:space-y-4 flex-column items-start"
        onClick={handleDismiss}
      >
        <div className="items-start">
          <XCircleIcon className="flex-shrink-0 h-6 w-6" />
          <div>
            <p className="font-semibold">{message}</p>
            {details && <p>{details}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
