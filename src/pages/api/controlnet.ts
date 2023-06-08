import { incrementImageCount } from "@/data/storage";
import fetch from "node-fetch";
import FormData from "form-data";
import type { NextApiHandler } from "next";
import { v4 as uuidv4 } from "uuid";

const CONTROLNET_URL = process.env.NEXT_PUBLIC_CONTROLNET_URL;

const falToken = process.env.FAL_TOKEN;

const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }
  if (!CONTROLNET_URL) {
    response.status(500).json({ message: "REMBG_URL not set" });
    return;
  }
  // save file
  const uuid = uuidv4();

  let formData = new FormData();
  formData.append(
    "file",
    Buffer.from(request.body.base64Image, "base64"),
    `base_${uuid}.png`
  );
  // TODO: these need to change
  formData.append("fal_token", falToken);
  formData.append("prompt", request.body.prompt);

  const res = await fetch(CONTROLNET_URL, {
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
