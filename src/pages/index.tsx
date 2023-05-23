import Head from "next/head";
import NextImage from "next/image";
import { useEffect, useState } from "react";

import Card from "@/components/Card";
import EmptyMessage from "@/components/EmptyMessage";
import ErrorNotification from "@/components/ErrorNotification";
import ImageCountDisplay from "@/components/ImageCountDisplay";
import ImageMask from "@/components/ImageMask";
import ImageSelector, { ImageFile } from "@/components/ImageSelector";
import ImageSpot, { ImageSpotPosition } from "@/components/ImageSpot";
import Steps, { StepName } from "@/components/Steps";
import MaskPicker from "@/components/MaskPicker";

type ErrorMessage = {
  message: string;
  details?: string;
};

const Home = () => {
  const [error, setError] = useState<ErrorMessage | null>(null);
  const [step, setStep] = useState<StepName>(StepName.ChooseImage);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [position, setPosition] = useState<ImageSpotPosition | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [masks, setMasks] = useState<string[]>([]);
  const [selectedMask, setSelectedMask] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [fillPrompt, setFillPrompt] = useState("");
  const [replacedImageUrls, setReplacedImageUrls] = useState<string[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [filledImageUrls, setFilledImageUrls] = useState<string[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [number, setNumber] = useState(0);
  const [dilation, setDilation] = useState(0);
  const [activeTab, setActiveTab] = useState("replace")

  const reset = () => {
    setStep(StepName.ChooseImage);
    setError(null);
    setSelectedImage(null);
    setPosition(null);
    setImageId(null);
    setMasks([]);
    setSelectedMask(null);
    setPrompt("");
    setReplacedImageUrls([]);
    setRemovedImageUrls([]);
    setLoading(false);
  };

  useEffect(() => {
    setError(null);
    getNumberOfImages().then((data) => {
      setNumber(data["numberOfImages"]);
    });
  }, [step, selectedImage, position, selectedMask, number]);

  const dismissError = () => {
    setError(null);
  };

  const tabClass = (tabName: string) => activeTab === tabName ? 'btn btn-primary' : 'btn';

  const handleImageSelected = (image: ImageFile) => {
    setSelectedImage(image);
    setStep(StepName.SetMaskPoint);
  };

  const handleImageClick = (position: ImageSpotPosition) => {
    setPosition(position);
    setStep(StepName.GenerateMask);
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
          dilation: dilation
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      setMasks(data.files);
      setImageId(data.image_id);
      setStep(StepName.ChooseMask);
    } catch (e: any) {
      setError({ message: "Failed to generate masks", details: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMaskSelected = (mask: string) => {
    setSelectedMask(mask);
    setStep(StepName.DefinePrompt);
  };

  const validateInputs = (): string | null => {
    if (!selectedImage || !position || !selectedMask) {
      return "You must add an image and select a mask before.";
    }

    const maskId = selectedMask.match(/with_mask_(\d+)/)?.[1];
    if (!maskId) {
      return "Failed to extract mask id from mask url";
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
    const timestamp = Date.now();
    const images = data.files.map(
      (imageUrl: string) => `${imageUrl}?t=${timestamp}`
    );
    return images;
  };

  const handleAction = async (apiPath: string, body: object, setImageUrls: Function) => {
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
        image_id: imageId,
        extension: "." + selectedImage.filename.split(".").pop(),
        mask_id: selectedMask.match(/with_mask_(\d+)/)?.[1],
      };
      await handleAction("/api/remove", body, setRemovedImageUrls);

    }
  };

  const handleGenerate = async () => {
    if (selectedImage && selectedMask) {
      const body = {
        image_id: imageId,
        extension: "." + selectedImage.filename.split(".").pop(),
        mask_id: selectedMask.match(/with_mask_(\d+)/)?.[1],
        prompt,
      };
      await handleAction("/api/edit", body, setReplacedImageUrls);
    }
  };

  const handleFill = async () => {
    if (selectedImage && selectedMask) {
      const body = {
        image_id: imageId,
        extension: "." + selectedImage.filename.split(".").pop(),
        mask_id: selectedMask.match(/with_mask_(\d+)/)?.[1],
        prompt: fillPrompt,
      };
      await handleAction("/api/fill", body, setFilledImageUrls);
    }
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
      <div>
        <ImageCountDisplay count={number} />
      </div>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        <div className="hidden md:display md:col-span-3">
          <Card>
            <Steps currentStep={step} />
          </Card>
        </div>
        <div className="md:col-span-2">
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
                  <span className="font-light mb-0 inline-block opacity-70">
                    <strong>Hint:</strong> click on the image to set the mask
                    reference point
                  </span>
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
        </div>
        <div className="md:col-span-1">
          <MaskPicker
            masks={masks}
            dilation={dilation}
            isLoading={isLoading}
            setDilation={setDilation}
            selectedImage={selectedImage}
            position={position}
            generateMasks={generateMasks}
            selectedMask={selectedMask}
            handleMaskSelected={handleMaskSelected}
          />
        </div>
      </div>
      <div className="flex container mx-auto pt-8 w-full">
        <button
          onClick={() => setActiveTab('replace')}
          className={`btn ${tabClass('replace')} mx-2`}
        >
          Replace
        </button>
        <button
          onClick={() => setActiveTab('remove')}
          className={`btn ${tabClass('remove')} mx-2`}
        >
          Remove
        </button>
        <button
          onClick={() => setActiveTab('fill')}
          className={`btn ${tabClass('fill')} mx-2`}
        >
          Fill
        </button>
      </div>
      {activeTab === 'replace' && (
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
              onClick={handleGenerate}
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
      {activeTab === 'remove' && (
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
      {activeTab === 'fill' && (
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
