import { ImageFile } from "@/data/image";
import { Model } from "@/data/modelMetadata";
import { PropsWithChildren } from "react";
import Card from "./Card";
import EmptyMessage from "./EmptyMessage";
import ImageMask from "./ImageMask";

export interface MaskPickerProps {
  displayMasks: string[];
  masks: string[];
  dilation: number;
  isLoading: boolean;
  setDilation: (dilation: number) => void;
  selectedImage: ImageFile | null;
  position: { x: number; y: number } | null;
  generateMasks: () => void;
  selectedMask: string | null;
  handleMaskSelected: (mask: string) => void;
  selectedModel: Model;
}

export default function MaskPicker(props: PropsWithChildren<MaskPickerProps>) {
  const {
    displayMasks,
    masks,
    dilation,
    isLoading,
    setDilation,
    selectedImage,
    position,
    generateMasks,
    selectedMask,
    handleMaskSelected,
  } = props;
  return (
    <Card title="Masks" classNames="min-h-full">
      <label>
        Dilation:
        <input
          id="mask_dilation"
          type="number"
          name="dilation"
          value={dilation}
          onChange={(e) => setDilation(parseInt(e.target.value))} // @ts-nocheck
          className="input placeholder-gray-400 dark:placeholder-gray-600 w-full"
          disabled={isLoading}
        />
      </label>

      {displayMasks.length === 0 && (
        <div className="items-center mt-0 md:mt-12">
          <div className="hidden md:display">
            <EmptyMessage message="No masks generated yet" />
          </div>
          <div className="flex flex-col items-center">
            <button
              className="btn btn-primary max-sm:btn-wide mb-4 md:mb-0"
              disabled={isLoading || !selectedImage || !position}
              onClick={generateMasks}
            >
              {position ? "Generate masks" : "Set the mask reference point"}
            </button>
          </div>
        </div>
      )}

      {displayMasks.length > 0 && (
        <>
          {props.selectedModel.id === "sam" && (
            <span className="font-light mb-0 inline-block opacity-70">
              <strong>Hint:</strong> click on the image select a mask
            </span>
          )}
          <div className="grid grid-cols-1 space-y-2">
            {displayMasks.map((mask, index) => (
              <ImageMask
                key={index}
                alt={`Mask ${index}`}
                mask={mask}
                selected={selectedMask === mask}
                onClick={handleMaskSelected}
              />
            ))}
          </div>
          <button
            className="btn btn-primary max-sm:btn-wide mb-4 md:mb-0"
            disabled={isLoading || !selectedImage || !position}
            onClick={generateMasks}
          >
            {position ? "Regenerate" : "Set the mask reference point"}
          </button>
        </>
      )}
    </Card>
  );
}
