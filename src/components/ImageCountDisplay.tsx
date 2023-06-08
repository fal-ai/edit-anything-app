import CountUp from "react-countup";

export interface ImageCountDisplayProps {
  count: number;
}

export default function ImageCountDisplay(props: ImageCountDisplayProps) {
  return (
    <div className="text-center font-light prose prose-slate max-w-full mt-4 md:mt-12">
      <p>
        {props.count > 0 ? (
          <>
            A total of{" "}
            <strong>
              <CountUp start={props.count - 5} end={props.count} /> images{" "}
            </strong>
            created, and counting!
          </>
        ) : (
          ""
        )}
      </p>
    </div>
  );
}
