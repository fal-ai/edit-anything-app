import * as fs from "fs";

export function base64ToFile(dataurl: string, filename: string) {
  // Extract the base64 data portion
  let base64Data = dataurl.split(",")[1];

  // Write the base64 string to a file
  fs.writeFileSync(filename, base64Data, { encoding: "base64" });
}
