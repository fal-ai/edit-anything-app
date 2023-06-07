import * as fs from "fs";
import fetch from "node-fetch";

export function base64ToFile(dataurl: string, filename: string) {
  // Extract the base64 data portion
  let base64Data = dataurl.split(",")[1];

  // Write the base64 string to a file
  fs.writeFileSync(filename, base64Data, { encoding: "base64" });
}

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
