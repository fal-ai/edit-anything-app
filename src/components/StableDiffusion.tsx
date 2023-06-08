import NextImage from "next/image";
import Card from "./Card";
import EmptyMessage from "./EmptyMessage";

interface StableDiffusionButtonGroupProps {
  setActiveTab: (tab: string) => void;
  activeTab: string;
}

export const StableDiffusionOptionsButtonGroup = (
  props: StableDiffusionButtonGroupProps
) => {
  const { setActiveTab, activeTab } = props;
  const tabClass = (tabName: string) =>
    props.activeTab === tabName ? "btn-primary" : "";

  return (
    <div className="max-md:px-2 flex container mx-auto pt-8 w-full">
      <div className="join">
        <button
          onClick={() => setActiveTab("replace")}
          className={`btn ${tabClass("replace")} join-item`}
        >
          Replace
        </button>
        <button
          onClick={() => setActiveTab("remove")}
          className={`btn ${tabClass("remove")} join-item`}
        >
          Remove
        </button>
        <button
          onClick={() => setActiveTab("fill")}
          className={`btn ${tabClass("fill")} join-item`}
        >
          Fill
        </button>
      </div>
    </div>
  );
};

interface StableDiffusionInputProps {
  setActiveTab: (tab: string) => void;
  activeTab: string;
  setPrompt: (prompt: string) => void;
  setFillPrompt: (prompt: string) => void;
  prompt: string;
  fillPrompt: string;
  isLoading: boolean;
  selectedMask: string | null;
  hasPrompt: boolean | string;
  hasFillPrompt: boolean | string;
  handleReplace: () => void;
  handleRemove: () => void;
  handleFill: () => void;
  replacedImageUrls: string[];
  removedImageUrls: string[];
  filledImageUrls: string[];
}
export const StableDiffusionInput = (props: StableDiffusionInputProps) => {
  const {
    activeTab,
    setActiveTab,
    setPrompt,
    prompt,
    fillPrompt,
    hasFillPrompt,
    isLoading,
    handleReplace,
    handleRemove,
    handleFill,
    setFillPrompt,
    selectedMask,
    hasPrompt,
    replacedImageUrls,
    removedImageUrls,
    filledImageUrls,
  } = props;

  return (
    <div>
      <StableDiffusionOptionsButtonGroup
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {activeTab === "replace" && (
        <div className="container mx-auto pt-8 w-full">
          <Card title="Replace...">
            <div className="flex flex-col md:flex-row md:space-x-6">
              <div className="form-control w-full md:w-3/5 max-w-full">
                <label>
                  <input
                    id="prompt_input"
                    type="text"
                    name="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="something creative, like 'a bus on the moon'"
                    className="input placeholder-gray-400 dark:placeholder-gray-600 w-full"
                    disabled={isLoading}
                  />
                </label>
              </div>
              <button
                className="btn btn-primary max-sm:btn-wide mt-4 mx-auto md:mx-0 md:mt-0"
                disabled={isLoading || !selectedMask || !hasPrompt}
                onClick={handleReplace}
              >
                {selectedMask ? "Generate" : "Pick one of the mask options"}
              </button>
            </div>
            {replacedImageUrls.length === 0 && (
              <div className="my-12">
                <EmptyMessage message="Nothing to see just yet" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 mt-4 md:mt-6 lg:p-12 mx-auto">
              {replacedImageUrls.map((url, index) => (
                <NextImage
                  key={index}
                  src={url}
                  alt={`Generated Image ${index + 1}`}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: "100%", height: "auto" }}
                  className="my-0"
                />
              ))}
            </div>
          </Card>
        </div>
      )}
      {activeTab === "remove" && (
        <div className="container mx-auto pt-8 w-full">
          <Card title="Remove...">
            <div className="flex flex-col md:flex-row md:space-x-6">
              <button
                className="btn btn-primary max-sm:btn-wide mt-4 mx-auto md:mx-0 md:mt-0"
                disabled={isLoading || !selectedMask}
                onClick={handleRemove}
              >
                {selectedMask ? "Remove" : "Pick one of the mask options"}
              </button>
            </div>
            {removedImageUrls.length === 0 && (
              <div className="my-12">
                <EmptyMessage message="Nothing to see just yet" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 mt-4 md:mt-6 lg:p-12 mx-auto">
              {removedImageUrls.map((url, index) => (
                <NextImage
                  key={index}
                  src={url}
                  alt={`Generated Image ${index + 1}`}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: "100%", height: "auto" }}
                  className="my-0"
                />
              ))}
            </div>
          </Card>
        </div>
      )}
      {activeTab === "fill" && (
        <div className="container mx-auto pt-8 w-full">
          <Card title="Fill...">
            <div className="flex flex-col md:flex-row md:space-x-6">
              <div className="form-control w-full md:w-3/5 max-w-full">
                <label>
                  <input
                    id="fill_prompt_input"
                    type="text"
                    name="fill_prompt"
                    value={fillPrompt}
                    onChange={(e) => setFillPrompt(e.target.value)}
                    placeholder="something creative, like 'an alien'"
                    className="input placeholder-gray-400 dark:placeholder-gray-600 w-full"
                    disabled={isLoading}
                  />
                </label>
              </div>
              <button
                className="btn btn-primary max-sm:btn-wide mt-4 mx-auto md:mx-0 md:mt-0"
                disabled={isLoading || !selectedMask || !hasFillPrompt}
                onClick={handleFill}
              >
                {selectedMask ? "Fill" : "Pick one of the mask options"}
              </button>
            </div>
            {filledImageUrls.length === 0 && (
              <div className="my-12">
                <EmptyMessage message="Nothing to see just yet" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 mt-4 md:mt-6 lg:p-12 mx-auto">
              {filledImageUrls.map((url, index) => (
                <NextImage
                  key={index}
                  src={url}
                  alt={`Generated Image ${index + 1}`}
                  width={0}
                  height={0}
                  sizes="100vw"
                  style={{ width: "100%", height: "auto" }}
                  className="my-0"
                />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
