import { incrementImageCount } from "@/data/storage";
import fetch from "node-fetch";
import type { NextApiHandler } from "next";
import FormData from "form-data";

const FILL_FUNCTION_URL = process.env.NEXT_PUBLIC_FILL_FUNCTION_URL;

const falToken = process.env.FAL_TOKEN;

const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }
  if (!FILL_FUNCTION_URL) {
    response.status(500).json({ message: "FILL_FUNCTION_URL not set" });
    return;
  }

  const maskFileBuffer = convertImageUrlToBuffer(request.body.mask_url);

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

  const res = await fetch(FILL_FUNCTION_URL, {
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

export default handler;
function convertImageUrlToBuffer(mask_url: any) {
  throw new Error("Function not implemented.");
}
