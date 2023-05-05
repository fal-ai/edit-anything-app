import { run } from "@fal-ai/serverless-client";

type EditImageInput = {
  image_id: string;
  extension: string;
  mask_id: string;
  prompt: string;
};

type EditImageOutput = {
  image_id: string;
  files: string[];
};

export async function editImage(
  input: EditImageInput
): Promise<{ result: EditImageOutput }> {
  return run("edit_anything_edit_image", {
    input,
  });
}
