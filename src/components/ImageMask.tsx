import NextImage from "next/image";
import { useCallback } from "react";

export interface ImageMaskProps {
  mask: string;
  alt: string;
  selected: boolean;
  onClick: (mask: string) => void;
}

export default function ImageMask(props: ImageMaskProps) {
  const borderClasses = [
    "border-transparent",
    "hover:border-neutral-400",
    "hover:cursor-pointer",
    "dark:hover:border-slate-500",
  ].join(" ");
  const selectedBorderClasses = [
    "border-secondary",
    "dark:border-secondary",
  ].join(" ");

  const { alt, mask, onClick, selected } = props;
  const handleMaskClick = useCallback(() => {
    onClick(mask);
  }, [mask, onClick]);
  return (
    <div
      className={`border-2 p-2 ${
        selected ? selectedBorderClasses : borderClasses
      }`}
      onClick={handleMaskClick}
    >
      <NextImage
        src={mask}
        alt={alt}
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
        className="my-0"
      />
    </div>
  );
}
