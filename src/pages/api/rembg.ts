import fetch from "cross-fetch";
import { incrementImageCount } from "@/data/storage";

import FormData from "form-data";
import * as fs from "fs";
import axios from "axios";
import type { NextApiHandler, PageConfig } from "next";
import { base64ToFile } from "@/util";

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
  base64ToFile(request.body.base64Image, "base.png");
  let formData = new FormData();
  formData.append("file", fs.createReadStream("base.png"));
  formData.append("fal_token", falToken);

  axios
    .post(`${REMBG_URL}/remove`, formData)
    .then(async (res) => {
      if (res.status == 200) {
        await incrementImageCount({ by: 1 });

        response.status(res.status).send({ imageUrl: res.data });
      }
    })
    .catch((error) => console.error(error));
};

export default handler;
