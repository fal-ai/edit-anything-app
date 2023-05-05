import { run } from "@fal-ai/serverless-client";

type MakeMasksInput = {
  image: string;
  extension: string;
  x: number;
  y: number;
};

type MakeMaskOutput = {
  image_id: string;
  files: string[];
};

export async function makeMasks(
  input: MakeMasksInput
): Promise<{ result: MakeMaskOutput }> {
  return run("edit_anything_make_masks", {
    input,
  });
}
