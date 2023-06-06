import fetch from "cross-fetch";
import { incrementImageCount } from "@/data/storage";

import FormData from "form-data";
import * as fs from "fs";
import axios from "axios";
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
  base64ToFile(request.body.base64Image, `base_${uuid}.png`);
  let formData = new FormData();
  formData.append("file", fs.createReadStream(`base_${uuid}.png`));
  // TODO: these need to change
  formData.append("fal_token", falToken);
  formData.append("num_samples", request.body.num_samples);
  formData.append("prompt", request.body.prompt);

  axios
    .post(`${CONTROLNET_URL}/generate`, formData)
    .then(async (res) => {
      if (res.status == 200) {
        await incrementImageCount({ by: 1 });
        response.status(res.status).send({ imageUrl: res.data[0] });
      }
    })
    .catch((error) => console.error(error));
};

function base64ToFile(dataurl: string, filename: string) {
  // Extract the base64 data portion
  let base64Data = dataurl.split(",")[1];

  // Write the base64 string to a file
  fs.writeFileSync(filename, base64Data, { encoding: "base64" });
}
export default handler;
