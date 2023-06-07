import va from "@vercel/analytics";
import { PropsWithChildren, useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Model } from "../data/modelMetadata";
import Card from "./Card";
import GitHubIcon from "./GitHubIcon";

export interface ModelPickerProps {
  model: Model;
  modelCardHidden: boolean;
  setModelCardHidden: any;
}

export default function ModelCard(props: PropsWithChildren<ModelPickerProps>) {
  const modelCardHiddenText = props.modelCardHidden
    ? "Show me the code"
    : "Hide the code";
  const modelCardHiddenClass = props.modelCardHidden ? "hidden" : "";

  const onClick = () => {
    va.track("show-code-toggle");
    props.setModelCardHidden(!props.modelCardHidden);
  };

  const [style, setStyle] = useState({});
  useEffect(() => {
    import("react-syntax-highlighter/dist/esm/styles/prism/material-dark").then(
      (mod) => setStyle(mod.default)
    );
  });

  return (
    <div>
      <div className="flex flex-row-reverse">
        <button
          className="btn btn-active btn-secondary mb-10"
          onClick={onClick}
        >
          {modelCardHiddenText}
        </button>
      </div>
      <Card classNames={modelCardHiddenClass}>
        <div className="grid-container grid grid-cols-5 ">
          <div className="col-span-2">
            <p>
              <b>Current Model:</b> {props.model.name}
            </p>
            <p>
              <b>API Endpoint:</b> {props.model.apiEndpoint}{" "}
            </p>
            <div className="mt-20">
              Get a fal token to use this model in your app:{" "}
            </div>
            <a
              className="btn btn-active mb-10 mt-5"
              href="https://serverless.fal.ai/api/auth/login"
              target="_blank"
              onClick={() => {
                va.track("github-login");
              }}
            >
              <GitHubIcon />{" "}
              <span className="ms-3"> Sign in with Github to get a token </span>
            </a>
          </div>
          <div className="col-span-3">
            <div className="flex flex-row-reverse">
              <span className="flex-end">
                {" "}
                js | <b>py</b> | curl | model{" "}
              </span>
            </div>
            <SyntaxHighlighter
              text={props.model.pythonCode}
              language={"python"}
              style={style}
            >
              {props.model.pythonCode}
            </SyntaxHighlighter>
          </div>
        </div>
      </Card>
    </div>
  );
}
