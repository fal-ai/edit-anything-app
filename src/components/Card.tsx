import { Model } from "@/data/modelMetadata";
import { PropsWithChildren } from "react";

export interface CardProps {
  classNames?: string;
  title?: string;
}

export default function Card(props: PropsWithChildren<CardProps>) {
  return (
    <div
      className={`prose card rounded-none md:rounded-md bg-base-200 shadow-sm md:shadow max-w-full ${
        props.classNames ?? ""
      }`}
    >
      <div className="card-body p-4 md:p-8">
        {props.title && (
          <h3 className="card-title text-sm md:text-lg font-light uppercase opacity-60 mt-0">
            {props.title}
          </h3>
        )}
        {props.children}
      </div>
    </div>
  );
}
