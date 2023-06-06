import { incrementImageCount } from "@/data/storage";
import { base64ToFile } from "@/util";
import type { NextApiHandler } from "next";
import * as fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const EDIT_FUNCTION_URL = process.env.NEXT_PUBLIC_EDIT_FUNCTION_URL;

const falToken = process.env.FAL_TOKEN;

const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }
  if (!EDIT_FUNCTION_URL) {
    response.status(500).json({ message: "EDIT_FUNCTION_URL not set" });
    return;
  }

  const uuid = uuidv4();

  convertImageUrlToFile(request.body.mask_url, `mask_file_${uuid}.png`);
  base64ToFile(request.body.image_url.data, `image_file_${uuid}.png`);

  const formData = new FormData();
  formData.append("image_file", fs.createReadStream(`mask_file_${uuid}.png`));
  formData.append("mask_file", fs.createReadStream(`image_file_${uuid}.png`));

  formData.append("fal_token", falToken);
  formData.append("prompt", request.body.prompt);
  const res = await fetch(EDIT_FUNCTION_URL, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    response.status(res.status).send(res.statusText);
    return;
  }
  await incrementImageCount();
  response.json(await res.json());
};

async function convertImageUrlToFile(
  imageUrl: string,
  filePath: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to download the image");
    }
    const buffer = await response.buffer();
    fs.writeFileSync(filePath, buffer);
    return path.resolve(filePath);
  } catch (error) {
    console.error("Failed to convert image URL to file:", error);
    return null;
  }
}

export default handler;
