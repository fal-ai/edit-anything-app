import { PhotoIcon } from "@heroicons/react/24/outline";
import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";

export interface ImageFile {
  filename: string;
  data: string;
  size: {
    width: number;
    height: number;
  };
}

type OnImageSelect = (image: ImageFile) => void;

export interface ImageSelectorProps {
  disabled: boolean;
  onImageSelect: OnImageSelect;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export default function ImageSelector(props: ImageSelectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { onImageSelect } = props;

  const resizeImage = useCallback((file: File, image: HTMLImageElement) => {
    if (file.size <= MAX_FILE_SIZE) {
      return {
        data: image.src,
        filename: file.name,
        size: { width: image.width, height: image.height },
      } as ImageFile;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error("Canvas element not found");
    }
    const scalingFactor = Math.sqrt(MAX_FILE_SIZE / file.size);
    canvas.width = image.width * scalingFactor;
    canvas.height = image.height * scalingFactor;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context coould not be initialized");
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
      data: canvas.toDataURL("image/jpeg"),
      filename: file.name,
      size: { width: canvas.width, height: canvas.height },
    };
  }, []);

  const readImage = useCallback(
    (file: File, callback: OnImageSelect) => {
      let data = "";
      const image = new Image();
      const reader = new FileReader();
      image.onload = () => {
        callback(resizeImage(file, image));
      };
      reader.onloadend = () => {
        data = reader.result?.toString() ?? data;
        image.src = data;
      };
      reader.readAsDataURL(file);
    },
    [resizeImage]
  );

  const onFileSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        readImage(file, onImageSelect);
      }
    },
    [onImageSelect, readImage]
  );
  const onDrop = useCallback(
    (files: File[]) => {
      if (files && files.length) {
        const file = files[0];
        readImage(file, onImageSelect);
      }
    },
    [onImageSelect, readImage]
  );
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
  });

  return (
    <>
      <label
        {...getRootProps()}
        className="hidden md:display md:flex justify-center w-full h-fill px-4 py-16 transition bg-base-100 bg-opacity-30 border-2 dark:border-base-100 border-dashed rounded-md appearance-none cursor-pointer focus:outline-none"
      >
        <div className="flex flex-col items-center prose">
          <PhotoIcon className="m-auto w-64 h-64 opacity-5" />
          <p className="font-medium text-lg mx-0 mt-6 mb-2">
            Drop image file to begin, or{" "}
            <span className="text-secondary">click</span> to browse
          </p>
          <p id="file_input_help" className="opacity-80 mx-0 mt-0">
            Accepted formats: .jpg, .png (max size: 4MB)
          </p>
        </div>
        <input
          id="file_input"
          type="file"
          name="image"
          {...getInputProps()}
          aria-describedby="file_input_help"
          className="hidden"
          disabled={props.disabled}
        />
      </label>
      <input
        id="file_input"
        type="file"
        name="image"
        accept="image/jpeg,image/jpg,image/png"
        className="md:hidden file-input w-full placeholder-gray-500"
        disabled={props.disabled}
        onChange={onFileSelected}
      />
      <canvas ref={canvasRef} />
    </>
  );
}
