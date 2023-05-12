import CountUp from "react-countup";

export interface ImageCountDisplayProps {
  count: number;
}

export default function EmptyMessage(props: ImageCountDisplayProps) {
  return (
    <div className="text-center font-light prose prose-slate max-w-full my-4 md:my-8">
      <p>
        {props.count > 0 ? (
          <div>
            Number of Images Created -
            <CountUp start={props.count - 5} end={props.count} />
          </div>
        ) : (
          ""
        )}
      </p>
    </div>
  );
}
