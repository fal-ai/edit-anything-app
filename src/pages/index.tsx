import { CodeBracketIcon } from "@heroicons/react/24/outline";
import Head from "next/head";
import { useEffect, useState } from "react";

import Card from "@/components/Card";
import ErrorNotification from "@/components/ErrorNotification";
import ImageCountDisplay from "@/components/ImageCountDisplay";
import ImageSelector from "@/components/ImageSelector";
import ImageSpot, { ImageSpotPosition } from "@/components/ImageSpot";
import MaskPicker from "@/components/MaskPicker";
import ModelCard from "@/components/ModelCard";
import ModelPicker from "@/components/ModelPicker";
import ScribbleBox from "@/components/ScribbleBox";
import SingleImageResult from "@/components/SingleImageResult";
import { StableDiffusionInput } from "@/components/StableDiffusion";
import Steps, { StepName } from "@/components/Steps";
import { ImageFile } from "@/data/image";
import { Model, models } from "@/data/modelMetadata";
import va from "@vercel/analytics";

type ErrorMessage = {
  message: string;
  details?: string;
};

const Home = () => {
  const [error, setError] = useState<ErrorMessage | null>(null);
  const [step, setStep] = useState<StepName>(StepName.ChooseImage);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [position, setPosition] = useState<ImageSpotPosition | null>(null);
  // masks are the black and white images display masks are the blue ones we show to the user
  const [masks, setMasks] = useState<string[]>([]);
  const [displayMasks, setDisplayMasks] = useState<string[]>([]);
  const [selectedMask, setSelectedMask] = useState<string | null>(null);
  const [selectedDisplayMask, setSelectedDisplayMask] = useState<string | null>(
    null
  );
  const [prompt, setPrompt] = useState("");
  const [fillPrompt, setFillPrompt] = useState("");
  const [replacedImageUrls, setReplacedImageUrls] = useState<string[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [filledImageUrls, setFilledImageUrls] = useState<string[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [dilation, setDilation] = useState(0);
  const [activeTab, setActiveTab] = useState("replace");
  const [selectedModel, setSelectedModel] = useState<Model>(models["sam"]);
  const [singleImageResultUrl, setSingleImageResultUrl] = useState<
    string | null
  >(null);
  const [scribblePaused, setScriblePaused] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);

  const reset = () => {
    setStep(StepName.ChooseImage);
    setError(null);
    setSelectedImage(null);
    setPosition(null);
    setMasks([]);
    setDisplayMasks([]);
    setSelectedMask(null);
    setPrompt("");
    setReplacedImageUrls([]);
    setRemovedImageUrls([]);
    setLoading(false);
    setSelectedModel(models["sam"]);
    setSingleImageResultUrl(null);
    setScriblePaused(false);
    setShowModelDetails(false);
  };

  useEffect(() => {
    setError(null);
    getNumberOfImages().then((data) => {
      setImageCount(data["numberOfImages"]);
    });
  }, [step, selectedImage, position, selectedMask, imageCount]);

  const dismissError = () => {
    setError(null);
  };

  const handleImageSelected = (image: ImageFile) => {
    setSelectedImage(image);
    setStep(StepName.SetMaskPoint);
  };

  const handleImageClick = (position: ImageSpotPosition) => {
    setPosition(position);
    setStep(StepName.GenerateMask);
  };

  const generateSingleImageResult = async () => {
    setLoading(true);
    if (selectedImage) {
      try {
        const promptEl: HTMLInputElement = document.getElementById(
          "single-image-prompt-input"
        ) as HTMLInputElement;
        const promtValue = promptEl ? promptEl.value : null;
        const response = await fetch(`/api/${selectedModel.id}`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            base64Image: selectedImage.data,
            prompt: promtValue,
          }),
        });
        const data = await response.json();
        setSingleImageResultUrl(data["imageUrl"]);
      } catch (e: any) {
        setError({ message: "Failed to generate masks", details: e.message });
      } finally {
        setLoading(false);
      }
    }
  };

  const generateMasks = async () => {
    setLoading(true);
    try {
      if (!selectedImage || !position) {
        setError({
          message: "You must add an image and select a mask position",
        });
        return;
      }
      const response = await fetch("/api/masks", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          image: selectedImage.data,
          extension: "." + selectedImage.filename.split(".").pop(),
          x: position.x,
          y: position.y,
          dilation: dilation,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      setDisplayMasks(data.displayMasks);
      setMasks(data.masks);
      setStep(StepName.ChooseMask);
    } catch (e: any) {
      setError({ message: "Failed to generate masks", details: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMaskSelected = (mask: string) => {
    // TODO: find mask index in a better way
    const index = displayMasks.indexOf(mask);
    setSelectedDisplayMask(mask);
    setSelectedMask(masks[index]);
    setStep(StepName.DefinePrompt);
  };

  const validateInputs = (): string | null => {
    if (!position || !selectedMask) {
      return "You must add an image and select a mask before.";
    }
    return null;
  };

  const fetchData = async (apiPath: string, body: object) => {
    const response = await fetch(apiPath, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    // TODO: removed the timestamp
    const images = data.map((imageUrl: string) => `${imageUrl}`);
    return images;
  };

  const handleAction = async (
    apiPath: string,
    body: object,
    setImageUrls: Function
  ) => {
    setLoading(true);
    try {
      const validationError = validateInputs();
      if (validationError) {
        setError({ message: validationError });
        return;
      }
      const images = await fetchData(apiPath, body);
      setImageUrls(images);
      setStep(StepName.Generate);
    } catch (e: any) {
      setError({ message: "Failed to generate images", details: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (selectedImage && selectedMask) {
      const body = {
        mask_url: selectedMask,
        image_url: selectedImage,
      };
      await handleAction("/api/remove", body, setRemovedImageUrls);
    }
  };

  const handleReplace = async () => {
    if (selectedImage && selectedMask) {
      const body = {
        mask_url: selectedMask,
        image_url: selectedImage,
        prompt,
      };
      await handleAction("/api/edit", body, setReplacedImageUrls);
    }
  };

  const handleFill = async () => {
    if (selectedImage && selectedMask) {
      const body = {
        mask_url: selectedMask,
        image_url: selectedImage,
        prompt,
      };
      await handleAction("/api/fill", body, setFilledImageUrls);
    }
  };

  const handleModelSelected = (modelId: string) => {
    va.track("model-selected-" + modelId);
    setSelectedModel(models[modelId]);
    setSelectedImage(null);
  };

  const handleScrible = async (data: string) => {
    const image: ImageFile = {
      data: data,
      filename: "scribble.png",
      size: { width: 512, height: 512 },
    };
    setSelectedImage(image);
  };

  async function getNumberOfImages() {
    const response = await fetch("/api/images", {
      method: "GET",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    });
    return await response.json();
  }

  const hasPrompt = prompt && prompt.trim().length > 0;

  const hasFillPrompt = fillPrompt && fillPrompt.trim().length > 0;

  return (
    <main className="min-h-screen md:py-12">
      <Head>
        <title>Edit Anything | fal-serverless</title>
      </Head>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        <div className="max-md:px-2 md:display md:col-span-2 flex items-end">
          <ModelPicker
            onSelect={handleModelSelected}
            selectedModel={selectedModel}
          />
        </div>
        <div className="hidden md:flex items-end justify-end">
          <button
            className="btn btn-outline"
            onClick={() => setShowModelDetails(true)}
          >
            <CodeBracketIcon className="h-6 w-6" />
            Show code
          </button>
        </div>
        <div className="hidden md:display md:col-span-3">
          <Card>
            <Steps currentStep={step} />
          </Card>
        </div>
        <div className="md:col-span-2">
          {selectedModel.id === "controlnet" && (
            <Card title="Scribble" classNames="min-h-full">
              <ScribbleBox
                handleScrible={handleScrible}
                setScriblePaused={setScriblePaused}
              ></ScribbleBox>
            </Card>
          )}
          {(selectedModel.id === "rembg" || selectedModel.id === "sam") && (
            <Card title="Source image" classNames="min-h-full">
              {!selectedImage && (
                <ImageSelector
                  onImageSelect={handleImageSelected}
                  disabled={isLoading}
                />
              )}
              {selectedImage && (
                <>
                  <div className="flex justify-between">
                    {selectedModel.id === "sam" && (
                      <span className="font-light mb-0 inline-block opacity-70">
                        <strong>Hint:</strong> click on the image to set the
                        mask reference point
                      </span>
                    )}
                    <button
                      className="btn btn-outline btn-sm self-end"
                      onClick={reset}
                      disabled={isLoading}
                    >
                      Reset
                    </button>
                  </div>
                  <ImageSpot
                    imageUrl={selectedImage.data}
                    height={selectedImage.size.height}
                    width={selectedImage.size.width}
                    onClick={handleImageClick}
                  />
                </>
              )}
            </Card>
          )}
        </div>
        <div className="md:col-span-1">
          {(selectedModel.id === "rembg" ||
            selectedModel.id === "controlnet") && (
            <SingleImageResult
              isLoading={isLoading}
              selectedImage={selectedImage}
              generateSingleImageResult={generateSingleImageResult}
              singleImageResultUrl={singleImageResultUrl}
            />
          )}
          {selectedModel.id === "sam" && (
            <MaskPicker
              selectedModel={selectedModel}
              displayMasks={displayMasks}
              masks={masks}
              dilation={dilation}
              isLoading={isLoading}
              setDilation={setDilation}
              selectedImage={selectedImage}
              position={position}
              generateMasks={generateMasks}
              selectedMask={selectedDisplayMask}
              handleMaskSelected={handleMaskSelected}
            />
          )}
        </div>
      </div>
      <div>
        {selectedModel.id === "sam" && (
          <StableDiffusionInput
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setPrompt={setPrompt}
            prompt={prompt}
            fillPrompt={fillPrompt}
            hasFillPrompt={hasFillPrompt}
            isLoading={isLoading}
            handleReplace={handleReplace}
            handleRemove={handleRemove}
            handleFill={handleFill}
            setFillPrompt={setFillPrompt}
            selectedMask={selectedMask}
            hasPrompt={hasPrompt}
            replacedImageUrls={replacedImageUrls}
            removedImageUrls={removedImageUrls}
            filledImageUrls={filledImageUrls}
          />
        )}
      </div>
      <ImageCountDisplay count={imageCount} />
      <ModelCard
        model={selectedModel}
        onDismiss={() => setShowModelDetails(false)}
        visible={showModelDetails}
      />
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="alert max-w-md shadow-lg p-6 md:p-12 mx-4 md:mx-0">
            <div className="flex-col items-center pt-6 w-full">
              <progress className="progress progress-primary w-max-[60%]"></progress>
              <p className="my-4">Hold on tight, we&apos;re working on it!</p>
            </div>
          </div>
        </div>
      )}
      {error && <ErrorNotification {...error} onDismiss={dismissError} />}
    </main>
  );
};

export default Home;
