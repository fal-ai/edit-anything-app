import { PropsWithChildren } from "react";

export interface CardProps {
  classNames?: string;
  title?: string;
}

export default function Card(props: PropsWithChildren<CardProps>) {
  return (
    <div
      className={`card bg-base-200 prose shadow max-w-full ${
        props.classNames ?? ""
      }`}
    >
      <div className="card-body">
        {props.title && (
          <h3 className="card-title font-light uppercase opacity-60 mt-0">
            {props.title}
          </h3>
        )}
        {props.children}
      </div>
    </div>
  );
}
