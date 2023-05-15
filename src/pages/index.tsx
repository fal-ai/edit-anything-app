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
  const [replacedImageUrls, setReplacedImageUrls] = useState<string[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [number, setNumber] = useState(0);
  const [dilation, setDilation] = useState(0);

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
          dilation: parseInt(dilation)
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

  const handleRemove = async () => {
    setLoading(true);
    try {
	    if (!selectedImage || !position || !selectedMask) {
	      setError({
		      message: "You must add an image and select a mask before.",
	      });
	      return;
	    }

	    // extract the maskId from the mask url using the with_mask_(\d+) pattern
	    const maskId = selectedMask.match(/with_mask_(\d+)/)?.[1];
	    if (!maskId) {
	      setError({ message: "Failed to extract mask id from mask url" });
	      return;
	    }
	    const response = await fetch("/api/remove", {
	      method: "POST",
	      headers: {
		      accept: "application/json",
		      "content-type": "application/json",
	      },
	      body: JSON.stringify({
		      image_id: imageId,
		      extension: "." + selectedImage.filename.split(".").pop(),
		      mask_id: maskId,
	      }),
	    });

	    if (!response.ok) {
	      throw new Error(`Request failed with status ${response.status}`);
	    }
	    const data = await response.json();
	    const timestamp = Date.now();
	    const images = data.files.map(
	      (imageUrl: string) => `${imageUrl}?t=${timestamp}`
	    );
	    setRemovedImageUrls(images);
	    setStep(StepName.Generate);
    } catch (e: any) {
	    setError({ message: "Failed to generate images", details: e.message });
    } finally {
	    setLoading(false);
    }
  }

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (!selectedImage || !position || !selectedMask) {
        setError({
          message: "You must add an image and select a mask before.",
        });
        return;
      }
      // extract the maskId from the mask url using the with_mask_(\d+) pattern
      const maskId = selectedMask.match(/with_mask_(\d+)/)?.[1];
      if (!maskId) {
        setError({ message: "Failed to extract mask id from mask url" });
        return;
      }
      const response = await fetch("/api/edit", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          image_id: imageId,
          extension: "." + selectedImage.filename.split(".").pop(),
          mask_id: maskId,
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      const timestamp = Date.now();
      const images = data.files.map(
        (imageUrl: string) => `${imageUrl}?t=${timestamp}`
      );
      setReplacedImageUrls(images);
      setStep(StepName.Generate);
    } catch (e: any) {
      setError({ message: "Failed to generate images", details: e.message });
    } finally {
      setLoading(false);
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
          <Card title="Masks" classNames="min-h-full">
            <label>
              Dilation:
              <input
                id="mask_dilation"
                type="number"
                name="dilation"
                value={dilation}
                onChange={(e) => setDilation(e.target.value)}
                className="input placeholder-gray-400 dark:placeholder-gray-600 w-full"
                disabled={isLoading}
              />
            </label>

	          {masks.length === 0 && (
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
                    {position
                      ? "Generate masks"
                      : "Set the mask reference point"}
                  </button>
                </div>
              </div>
            )}

            {masks.length > 0 && (
              <>
                <span className="font-light mb-0 inline-block opacity-70">
                  <strong>Hint:</strong> click on the image select a mask
                </span>
                <div className="grid grid-cols-1 space-y-2">
                  {masks.map((mask, index) => (
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
                  {position
                    ? "Regenerate"
                    : "Set the mask reference point"}
                </button>
              </>
            )}
          </Card>
        </div>
      </div>
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
