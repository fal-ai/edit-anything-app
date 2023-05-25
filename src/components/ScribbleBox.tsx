import { PropsWithChildren } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import * as React from "react";

export interface ScribbleBoxProps {
  handleScrible: (data: any) => void;
  setScriblePaused: (exists: boolean) => void;
}

export default function ScribbleBox(
  props: PropsWithChildren<ScribbleBoxProps>
) {
  const canvasRef: any = React.createRef();

  const { handleScrible, setScriblePaused } = props;

  const onChange = async () => {
    const paths = await canvasRef.current.exportPaths();
    localStorage.setItem("paths", JSON.stringify(paths, null, 2));

    if (!paths.length) return;

    setScriblePaused(true);

    const data = await canvasRef.current.exportImage("png");
    handleScrible(data);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Something Creative.. a turtle in the sky"
        className="input w-full max-w-m mb-5"
        id="single-image-prompt-input"
      />
      <ReactSketchCanvas
        ref={canvasRef}
        className="w-full aspect-square border-none cursor-crosshair"
        strokeWidth={2}
        strokeColor="red"
        onChange={onChange}
      />
    </div>
  );
}
