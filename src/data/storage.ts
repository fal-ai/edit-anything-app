import kv from "@vercel/kv";

const NUMBER_OF_IMAGES_KEY = "numberOfImages";

export function isAvailable(): boolean {
  return process.env.KV_REST_API_URL !== undefined;
}

type IncrementArgs = {
  by: number;
};

export function incrementImageCount(
  { by }: IncrementArgs = { by: 1 }
): Promise<number> {
  if (!isAvailable()) {
    console.warn("KV storage is disabled.");
    return Promise.resolve(0);
  }
  if (by < 1) {
    throw new Error("Increment cannot be less than 1");
  }
  return kv.incrby(NUMBER_OF_IMAGES_KEY, by);
}

export function getImageCount(): Promise<number | null> {
  if (!isAvailable()) {
    console.warn("KV storage is disabled.");
    return Promise.resolve(null);
  }
  return kv.get(NUMBER_OF_IMAGES_KEY);
}
