import { incrementImageCount } from "@/data/storage";

import axios from "axios";
import FormData from "form-data";
import type { NextApiHandler } from "next";

const REMBG_URL = process.env.NEXT_PUBLIC_REMBG_URL;

const falToken = process.env.FAL_TOKEN;

const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }
  if (!REMBG_URL) {
    response.status(500).json({ message: "REMBG_URL not set" });
    return;
  }
  // save file
  let base64ImageWithoutPrefix = request.body.base64Image
    .split(";base64,")
    .pop();

  let formData = new FormData();
  formData.append(
    "file",
    Buffer.from(base64ImageWithoutPrefix, "base64"),
    "anything.png"
  );
  formData.append("fal_token", falToken);

  axios
    .post(`${REMBG_URL}/remove`, formData)
    .then(async (res) => {
      if (res.status == 200) {
        await incrementImageCount({ by: 1 });
        const result = await res.data;
        response.status(res.status).send({ imageUrl: res.data });
      }
    })
    .catch((error) => console.error(error));
};

export default handler;
