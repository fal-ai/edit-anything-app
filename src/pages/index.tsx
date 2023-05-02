import * as fal from "@fal-ai/serverless-client";
import { withNextProxy } from "@fal-ai/serverless-nextjs";
import { InformationCircleIcon, PhotoIcon } from "@heroicons/react/24/outline";
import Head from "next/head";
import { useState } from "react";

import Card from "@/components/Card";
import ImageSpot, { ImageSpotPosition } from "@/components/ImageSpot";

fal.config({
  userId: "github|319413",
  host: "gateway.shark.fal.ai",
  requestMiddleware: withNextProxy(),
});

const Home = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ height: 0, width: 0 });
  const [position, setPosition] = useState<ImageSpotPosition | undefined>(
    undefined
  );
  const [prompt, setPrompt] = useState("");
  const [filename, setFilename] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);

      const image = new Image();
      image.src = imageUrl;
      const reader = new FileReader();
      image.onload = () => {
        setFilename(file.name);
        setImageSize({ width: image.width, height: image.height });
      };
      reader.onloadend = () => {
        setSelectedImage(reader.result?.toString() ?? "");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (position: ImageSpotPosition) => {
    setPosition(position);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedImage || !position || !prompt) {
      return;
    }
    setIsLoading(true);

    try {
      const { result }: any = await fal.run("run_replace", {
        input: {
          image_base64_str: selectedImage,
          extension: filename.split(".").pop(),
          prompt,
          x: position.x,
          y: position.y,
        },
      });
      console.log("Result:", result);
      setImageUrls(result.files);
    } catch (error) {
      console.error("Error submitting the form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPrompt = prompt && prompt.trim().length > 0;
  const canSubmit = !isLoading && selectedImage && hasPrompt && position;

  return (
    <main className="min-h-screen py-16">
      <Head>
        <title>Edit Anything | fal-serverless</title>
      </Head>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        <div className="md:col-span-1">
          <Card title="Edit image">
            <form onSubmit={handleSubmit}>
              <div>
                <label className="label" htmlFor="file_input">
                  <span className="label-text">Choose a starting image</span>
                </label>
                <input
                  id="file_input"
                  type="file"
                  name="image"
                  accept="image/jpeg,image/jpg,image/png"
                  aria-describedby="file_input_help"
                  onChange={handleImageSelected}
                  className="file-input file-input-bordered w-full placeholder-gray-500"
                  disabled={isLoading}
                />
                <p
                  id="file_input_help"
                  className="text-xs prose prose-slate opacity-80 mt-2"
                >
                  Accepted formats: .jpg, .png (max size: 4MB)
                </p>
              </div>
              <div>
                <label htmlFor="prompt_input" className="label">
                  <span className="label-text">Prompt</span>
                </label>
                <input
                  id="prompt_input"
                  type="text"
                  name="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Something creative, e.g. 'a bus on the moon'"
                  className="input input-bordered w-full placeholder-gray-500"
                  disabled={isLoading}
                />
              </div>
              <div className="card-actions justify-end mt-8">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!canSubmit}
                >
                  Edit it!
                </button>
              </div>
            </form>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card title="Image">
            {selectedImage && (
              <>
                <ImageSpot
                  imageUrl={selectedImage}
                  height={imageSize.height}
                  width={imageSize.width}
                  onClick={handleImageClick}
                />
                <p className="font-light text-sm mb-0 opacity-50">
                  Hint: click to place a point of reference on a
                  point-of-interest to define the mask
                </p>
              </>
            )}
            {!selectedImage && (
              <div className="mx-auto py-16">
                <PhotoIcon className="h-64 w-64 opacity-10" />
              </div>
            )}
          </Card>
        </div>
      </div>
      <div className="container mx-auto pt-8 w-full">
        <Card title="Generated images">
          {imageUrls.length === 0 && (
            <div className="text-center font-light prose prose-slate opacity-60 max-w-full my-8">
              <InformationCircleIcon className="h-6 w-6 opacity-80 inline-block me-4" />
              Nothing to see here just yet
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {imageUrls.map((url, index) => (
              <img key={index} src={url} alt={`Generated Image ${index + 1}`} />
            ))}
          </div>
        </Card>
      </div>
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="alert max-w-md shadow-lg">
            <div className="animate-spin inline-flex rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
            <p className="ms-2">Hold on tight, we&apos;re working on it</p>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
