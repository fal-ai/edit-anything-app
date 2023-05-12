import { getImageCount } from "@/data/storage";
import type { NextApiHandler } from "next";

const handler: NextApiHandler = async (request, response) => {
  const numberOfImages = await getImageCount();
  return response.json({ numberOfImages });
};

export default handler;
