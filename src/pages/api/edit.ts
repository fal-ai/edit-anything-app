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

  const maskFileBuffer = await convertImageUrlToBuffer(request.body.mask_url);

  let base64ImageWithoutPrefix = request.body.image_url.data
    .split(";base64,")
    .pop();

  const formData = new FormData();

  formData.append(
    "image_file",
    Buffer.from(base64ImageWithoutPrefix, "base64"),
    "image_file.png"
  );
  formData.append("mask_file", maskFileBuffer, "mask_file.png");

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

async function convertImageUrlToBuffer(
  imageUrl: string
): Promise<Buffer | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to download the image");
    }
    return await response.buffer();
  } catch (error) {
    console.error("Failed to convert image URL to file:", error);
    return null;
  }
}

export default handler;
