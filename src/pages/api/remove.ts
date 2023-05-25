import { incrementImageCount } from "@/data/storage";
import fetch from "cross-fetch";
import type { NextApiHandler } from "next";

const REMOVE_FUNCTION_URL = process.env.NEXT_PUBLIC_REMOVE_FUNCTION_URL;

const falToken = process.env.FAL_TOKEN;

const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST" && request.method !== "OPTIONS") {
    response.status(405).json({ message: "Method not allowed" });
    return;
  }
  if (!REMOVE_FUNCTION_URL) {
    response.status(500).json({ message: "REMOVE_FUNCTION_URL not set" });
    return;
  }

  const res = await fetch(REMOVE_FUNCTION_URL, {
    method: "POST",
    body: JSON.stringify(request.body),
    headers: {
      "content-type": "application/json",
      "x-fal-key-id": process.env.FAL_KEY_ID ?? "",
      "x-fal-key-secret": process.env.FAL_KEY_SECRET ?? "",
    },
  });
  if (!res.ok) {
    response.status(res.status).send(res.statusText);
    return;
  }
  await incrementImageCount();
  const { result } = await res.json();
  response.json(result);
};

export default handler;
