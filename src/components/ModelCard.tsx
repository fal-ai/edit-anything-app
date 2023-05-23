import { PropsWithChildren, useEffect } from "react";
import Card from "./Card";
import { Model } from "../data/modelMetadata";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

export interface ModelPickerProps {
  model: Model;
}

export default function ModelCard(props: PropsWithChildren<ModelPickerProps>) {

  return (
    <Card>
        <div className="grid-container grid grid-cols-5">
          <div className="col-span-2">
              <p><b>Current Model:</b> {props.model.name}</p>
              <p><b>API Endpoint:</b> {props.model.apiEndpoint} </p>
              <p>
                <b>Example Usage: </b> 
                <a href={props.model.pythonExampleEndpoint}>Python</a>{" | " } 
                <a href={props.model.javascriptExampleEndpoint}>Javascript</a>
              </p>
          </div>
          <div className="col-span-3">
            <div className="flex flex-row-reverse">
              <span className="flex-end"> js | <b>py</b> | curl | model </span>
            </div>
            <SyntaxHighlighter text={props.model.code} language={"python"}>
              {props.model.code}
            </SyntaxHighlighter>
          </div>
        </div>
    </Card>
  );
}
