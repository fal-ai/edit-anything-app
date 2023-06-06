import { PropsWithChildren } from "react";
import Card from "./Card";
import { Model, models } from "../data/modelMetadata";
import { useCallback } from "react";

export interface ModelPickerProps {
  onClick: (model_id: string) => void;
  selectedModel: Model;
}

export default function ModelPicker(
  props: PropsWithChildren<ModelPickerProps>
) {
  const handleMaskClick = (modelId: string) => {
    props.onClick(modelId);
    // hack to close the dropdown
    const elem = document.activeElement;
    // @ts-ignore
    elem?.blur();
  };
  return (
    <div>
      <h3>Currently Serving - {props.selectedModel.name}</h3>
      <div className="dropdown">
        <label tabIndex={0} className="btn m-1">
          Pick another Model
        </label>
        <ul
          tabIndex={0}
          className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
        >
          {Object.values(models).map((model) => (
            <li key={model.id} onClick={() => handleMaskClick(model.id)}>
              <a>{model.name}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
