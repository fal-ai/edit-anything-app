import { PropsWithChildren } from "react";
import NextImage from "next/image";
import { ImageFile } from "../data/image";

export interface SingleImageResultProps {
  isLoading: boolean;
  selectedImage: ImageFile | null;
  generateSingleImageResult: () => void;
  singleImageResultUrl: string | null;
}

export default function SingleImageResult(
  props: PropsWithChildren<SingleImageResultProps>
) {
  const {
    isLoading,
    selectedImage,
    generateSingleImageResult,
    singleImageResultUrl,
  } = props;

  return (
    <div>
      <button
        className="btn btn-primary max-sm:btn-wide mb-10 md:mb-10"
        disabled={isLoading || !selectedImage}
        onClick={generateSingleImageResult}
      >
        Generate
      </button>
      {singleImageResultUrl && (
        <NextImage
          src={singleImageResultUrl}
          alt="bla"
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: "100%", height: "auto" }}
        ></NextImage>
      )}
    </div>
  );
}
