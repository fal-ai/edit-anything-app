import { PhotoIcon } from "@heroicons/react/24/outline";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

export interface ImageFile {
  filename: string;
  data: string;
  size: {
    width: number;
    height: number;
  };
}

export interface ImageSelectorProps {
  disabled: boolean;
  onImageSelect: (image: ImageFile) => void;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export default function ImageSelector(props: ImageSelectorProps) {
  const { onImageSelect } = props;
  const onDrop = useCallback(
    (files: File[]) => {
      if (files && files.length) {
        const file = files[0];

        let data = "";
        const image = new Image();
        const reader = new FileReader();
        image.onload = () => {
          onImageSelect({
            data,
            filename: file.name,
            size: { width: image.width, height: image.height },
          });
        };
        reader.onloadend = () => {
          data = reader.result?.toString() ?? data;
          image.src = data;
        };
        reader.readAsDataURL(file);
      }
    },
    [onImageSelect]
  );
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  return (
    <label
      {...getRootProps()}
      className="flex justify-center w-full h-fill px-4 py-16 transition bg-base-100 bg-opacity-30 border-2 border-dashed rounded-md appearance-none cursor-pointer focus:outline-none"
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
  );
}
