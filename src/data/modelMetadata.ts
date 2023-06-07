export type Model = {
  id: string;
  name: string;
  apiEndpoint: string;
  pythonCode: string;
  jsCode: string;
};

const regmbModel: Model = {
  id: "rembg",
  name: "Rembg",
  apiEndpoint: process.env.NEXT_PUBLIC_REMBG_URL || "",
  pythonCode: `
import requests

rembg_base_url = "${process.env.NEXT_PUBLIC_REMBG_URL}"
fal_token = "<YOUR_TOKEN_HERE>"
rembg_response = requests.post(
    f"{rembg_base_url}/remove",
    files={"file": open("image.png", "rb")},
    data={"fal_token": fal_token},
)
    `,
  jsCode: "",
};

const segmentAnything: Model = {
  id: "sam",
  name: "Segment Anything",
  apiEndpoint: process.env.NEXT_PUBLIC_MASK_FUNCTION_URL || "",
  pythonCode: `
import requests

sam_base_url = "${process.env.NEXT_PUBLIC_MASK_FUNCTION_URL}" 
fal_token = "<YOUR_TOKEN_HERE>"
sam_response = requests.post(
    f"{sam_base_url}/masks",
    files={"file": open("image.png", "rb")},
    data={"fal_token": fal_token},
)
`,
  jsCode: "",
};

const controlnet: Model = {
  id: "controlnet",
  name: "lllyasviel/sd-controlnet-scribble",
  apiEndpoint: process.env.NEXT_PUBLIC_CONTROLNET_SCRIBBLE_URL || "",
  pythonCode: `
import requests

url = "${process.env.NEXT_PUBLIC_CONTROLNET_SCRIBBLE_URL}"

response = requests.post(
    f"{url}/generate",
    files={"file": open("turtle.png", "rb")},
    data={
        "prompt": "turle on the sky",
        "num_samples": 1,
        "fal_token": "fal_token",
    },
)
`,
  jsCode: "",
};

type ModelRegistry = {
  [key: string]: Model;
};

export const models: ModelRegistry = {
  rembg: regmbModel,
  sam: segmentAnything,
  controlnet: controlnet,
};
