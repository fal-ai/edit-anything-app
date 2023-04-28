import NextImage from "next/image";
import React, { useEffect, useRef, useState } from "react";

export interface ImageSpotPosition {
  readonly x: number;
  readonly y: number;
}

interface ImageSpotProps {
  imageUrl: string;
  height: number;
  width: number;
  position?: ImageSpotPosition | undefined;
  onClick: (coordinates: ImageSpotPosition) => void;
}

export default function ImageSpot(props: ImageSpotProps) {
  const [position, setPosition] = useState<ImageSpotPosition | undefined>(
    props.position
  );
  const imageRef = useRef<HTMLImageElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  const adjustPosition = (
    position: ImageSpotPosition,
    image: HTMLImageElement
  ) => {
    const imageRect = image.getBoundingClientRect();
    const renderedWidth = imageRect.width;
    const renderedHeight = imageRect.height;

    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;

    const scaleX = originalWidth / renderedWidth;
    const scaleY = originalHeight / renderedHeight;

    return {
      x: Math.trunc(position.x * scaleX),
      y: Math.trunc(position.y * scaleY),
    };
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    const image = imageRef.current;
    if (image) {
      const imageRect = image.getBoundingClientRect();
      const circleRadius = 8;
      const x = event.clientX - imageRect.left - circleRadius;
      const y = event.clientY - imageRect.top - circleRadius;
      setPosition({ x, y });
      if (props.onClick) {
        props.onClick(adjustPosition({ x, y }, image));
      }
    }
  };

  useEffect(() => {
    const marker = markRef.current;
    if (marker && position) {
      marker.style.left = `${position.x}px`;
      marker.style.top = `${position.y}px`;
    }
  }, [position]);

  return (
    <div className="relative w-full">
      <NextImage
        ref={imageRef}
        onClick={handleImageClick}
        src={props.imageUrl}
        width={props.width}
        height={props.height}
        alt="Selected image"
        className="m-0"
      />
      {position && (
        <div ref={markRef} className="absolute w-4 h-4">
          <span className="animate-ping absolute inline-flex mt-1 justify-center align-middle h-full w-full rounded-full bg-fuchsia-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-fuchsia-500 border-2 border-fuchsia-700 shadow"></span>
        </div>
      )}
    </div>
  );
}
