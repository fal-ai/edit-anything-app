import { InformationCircleIcon } from "@heroicons/react/24/outline";

export interface EmptyMessageProps {
  message: string;
}

export default function EmptyMessage(props: EmptyMessageProps) {
  return (
    <div className="text-center font-light prose prose-slate max-w-full my-4 md:my-8">
      <InformationCircleIcon className="h-6 w-6 opacity-40 inline-block me-2" />
      {props.message}
    </div>
  );
}
