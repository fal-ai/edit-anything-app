import { DocumentDuplicateIcon as CopyIcon, InformationCircleIcon as InfoIcon } from "@heroicons/react/24/outline";
import va from "@vercel/analytics";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Model } from "../data/modelMetadata";
import GitHubIcon from "./GitHubIcon";

export interface ModelCardProps {
  visible: boolean;
  onDismiss: () => void;
  model: Model;
}

export default function ModelCard(props: PropsWithChildren<ModelCardProps>) {
  const { model, onDismiss, visible } = props;
  const [style, setStyle] = useState({});
  useEffect(() => {
    import("react-syntax-highlighter/dist/esm/styles/prism/material-dark").then(
      (mod) => setStyle(mod.default)
    );
  });

  const modalClassName = ["modal", visible ? "modal-open" : ""];
  const copyEndpoint = useCallback(() => {
    navigator.clipboard.writeText(model.apiEndpoint);
  }, [model.apiEndpoint]);

  const selectOnClick = useCallback(
    (event: React.MouseEvent<HTMLInputElement>) => {
      event.currentTarget.select();
    },
    []
  );

  return (
    <dialog className={modalClassName.join(" ")}>
      <div className="modal-box max-w-full w-2/4">
        <div className="prose w-full max-w-full">
          <h3>{model.name}</h3>
          <div className="my-10">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-lg">
                  API Endpoint
                </span>
              </label>
              <div className="join">
                <input
                  className="input input-bordered w-full min-w-fit max-w-full join-item cursor-default"
                  onClick={selectOnClick}
                  readOnly
                  value={model.apiEndpoint}
                />
                <button className="btn join-item" onClick={copyEndpoint}>
                  <CopyIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="rounded-md bg-base-200 border border-base-content/10 p-4 my-6">
              <p className="text-lg font-bold space-x-2">
                <InfoIcon className="stroke-info w-8 h-8 inline-block" />
                <span className="text-info-content dark:text-info">You can call this API right now!</span>
              </p>
              <p>
                You can test this API in your application. All you need
                to do is to sign in and get a token.
              </p>
              <div className="text-center">
                <a
                  className="btn btn-outline btn-active"
                  href="https://serverless.fal.ai/api/auth/login"
                  target="_blank"
                  onClick={() => {
                    va.track("github-login");
                  }}
                >
                  <GitHubIcon />{" "}
                  <span className="ms-3">
                    {" "}
                    Sign in with Github to get a token{" "}
                  </span>
                </a>
              </div>
            </div>
          </div>
          <SyntaxHighlighter
            text={model.pythonCode}
            language={"python"}
            style={style}
          >
            {model.pythonCode}
          </SyntaxHighlighter>
        </div>
        <div className="modal-action">
          <button className="btn btn-outline" onClick={onDismiss}>
            Done
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-black bg-opacity-50">
        <button onClick={onDismiss}>close</button>
      </form>
    </dialog>
  );
}
