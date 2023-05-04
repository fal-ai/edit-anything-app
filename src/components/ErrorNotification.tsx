import { XCircleIcon } from "@heroicons/react/24/outline";

export interface ErrorNotificationProps {
  message: string;
  details?: string;
  onDismiss?: () => void;
}

export default function ErrorNotification(props: ErrorNotificationProps) {
  return (
    <div className="toast toast-top toast-center md:toast-end">
      <div className="alert alert-error rounded-md space-y-4">
        <div>
          <XCircleIcon className="flex-shrink-0 h-6 w-6" />
          <span>{props.message}</span>
        </div>
        {props.details && (
          <div>
            <span>{props.details}</span>
          </div>
        )}
      </div>
    </div>
  );
}
