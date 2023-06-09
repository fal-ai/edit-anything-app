import { incrementImageCount } from "@/data/storage";
import FormData from "form-data";
import type { NextApiHandler, PageConfig } from "next";
import fetch from "node-fetch";

const falToken = process.env.FAL_TOKEN;

const MASK_FUNCTION_URL = process.env.NEXT_PUBLIC_MASK_FUNCTION_URL;
const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }
  if (!MASK_FUNCTION_URL) {
    response.status(500).json({ message: "MASK_FUNCTION_URL not set" });
    return;
  }
  let base64ImageWithoutPrefix = request.body.image.split(";base64,").pop();

  const formData = new FormData();
  formData.append(
    "file",
    Buffer.from(base64ImageWithoutPrefix, "base64"),
    "base.png"
  );

  formData.append("fal_token", falToken);
  formData.append("x", request.body.x);
  formData.append("y", request.body.y);
  formData.append("extension", request.body.extension);
  formData.append("dilation", request.body.dilation);
  const res = await fetch(MASK_FUNCTION_URL, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    response.status(res.status).send(res.statusText);
    return;
  }
  await incrementImageCount({ by: 3 });
  const imagesList: string[] = (await res.json()) as string[];

  // masks are returned as the 3rd, 6th, and 9th images
  const images = {
    displayMasks: [imagesList[2], imagesList[5], imagesList[8]],
    masks: [imagesList[0], imagesList[3], imagesList[6]],
  };
  response.json(images);
};

export const config: PageConfig = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default handler;
