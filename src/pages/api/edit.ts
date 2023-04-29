import axios from "axios";
import { promises as fs } from "fs";
import { Form, File } from "multiparty";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

const runReplace = async (
  imageData: string,
  prompt: string,
  extension: string,
  x: number,
  y: number
): Promise<{ result: string }> => {
  const url = process.env.REPLACE_ANYTHING_URL as string;

  const payload = {
    image_base64_str: imageData,
    prompt: prompt,
    extension: extension,
    x,
    y,
  };

  const headers = {
    "X-Fal-Key-Id": process.env.FAL_KEY_ID,
    "X-Fal-Key-Secret": process.env.FAL_KEY_SECRET,
    "Content-Type": "application/json",
  };
  const response = await axios.post<{ result: string }>(url, payload, {
    headers,
  });
  return response.data;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST" && req.method !== "OPTIONS") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const form = new Form();
  const data: any = await new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) reject({ error });
      resolve({ fields, files });
    });
  });
  const image: File = data.files.image[0];
  const filename = image.originalFilename;
  const { prompt, x, y } = JSON.parse(data.fields.data[0]);
  const extension = path.extname(filename);

  // Convert image data URL to base64 string
  const fileBuffer = await fs.readFile(image.path);
  const base64Image = fileBuffer.toString("base64");

  // Process and store the data as needed
  console.log("starting generation");
  const result = await runReplace(base64Image, prompt, extension, x, y);
  console.log(result);
  const result_id = result["result"][0];

  const BASE_URL: string =
    "https://storage.googleapis.com/fal_edit_anything_results";

  const files: string[] = [
    `${BASE_URL}/${result_id}/replaced_with_mask_0.png`,
    `${BASE_URL}/${result_id}/with_mask_0.png`,
  ];

  console.log("done");
  res.status(200).json({ status: "success", files: files });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
