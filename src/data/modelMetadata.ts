export type Model = {
  id: string;
  name: string;
  apiEndpoint: string;
  pythonExampleEndpoint: string;
  javascriptExampleEndpoint: string;
  code: string;
};

const regmbModel: Model = {
  id: "rembg",
  name: "Rembg",
  apiEndpoint: "https://103961668-rembg.gateway.alpha.fal.ai",
  pythonExampleEndpoint:
    "https://gist.github.com/turbo1912/c0783e17d706a955fe4a9354a9bdf227",
  javascriptExampleEndpoint:
    "https://gist.github.com/turbo1912/2f8138370c8e189fcd961c273628689a",
  code: `
import requests

rembg_base_url = "https://103961668-rembg.gateway.alpha.fal.ai"
fal_token = "<YOUR_TOKEN_HERE>"
rembg_response = requests.post(
    f"{rembg_base_url}/remove",
    files={"file": open("sodacan.png", "rb")},
    data={"fal_token": fal_token},
)
    `,
};

const segmentAnything: Model = {
  id: "sam",
  name: "Segment Anything",
  apiEndpoint: "https://103961668-sam.gateway.alpha.fal.ai",
  pythonExampleEndpoint:
    "https://gist.github.com/turbo1912/c0783e17d706a955fe4a9354a9bdf227",
  javascriptExampleEndpoint:
    "https://gist.github.com/turbo1912/2f8138370c8e189fcd961c273628689a",
  code: `
import requests

sam_base_url = "https://103961668-sam.gateway.alpha.fal.ai"
fal_token = "<YOUR_TOKEN_HERE>"
sam_response = requests.post(
    f"{rembg_base_url}/masks",
    files={"file": open("sodacan.png", "rb")},
    data={"fal_token": fal_token},
)
`,
};

type ModelRegistry = {
  [key: string]: Model;
};

export const models: ModelRegistry = {
  rembg: regmbModel,
  sam: segmentAnything,
};
