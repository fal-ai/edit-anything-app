import type { NextApiHandler } from "next";
import kv from "@vercel/kv";

const handler: NextApiHandler = async (request, response) => {
  const numberOfImages = await kv.get("numberOfImages");
  return response.json({ numberOfImages });
};

export default handler;
