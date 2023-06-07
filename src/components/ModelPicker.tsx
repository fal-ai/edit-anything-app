import { PropsWithChildren, SyntheticEvent, useCallback } from "react";
import { Model, models } from "../data/modelMetadata";

export interface ModelPickerProps {
  onSelect: (modelId: string) => void;
  selectedModel: Model;
}

export default function ModelPicker(
  props: PropsWithChildren<ModelPickerProps>
) {
  const { onSelect, selectedModel } = props;
  const handleOnModelSelect = useCallback(
    (event: SyntheticEvent<HTMLSelectElement>) => {
      const modelId = event.currentTarget.value;
      onSelect(modelId);
    },
    [onSelect]
  );
  return (
    <div>
      <select
        className="select select-bordered"
        onChange={handleOnModelSelect}
        value={selectedModel.id}
      >
        {Object.values(models).map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
}
