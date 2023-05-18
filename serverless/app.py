from typing import List
from fal_serverless import isolated, cached

import base64
import os
import re
import uuid

REPO_PATH = "/data/repos/inpaint-anyting"

BASE_GCS_URL = "https://storage.googleapis.com/fal_edit_anything_results"

segment_anything_repo = (
    "https://github.com/geekyutao/Inpaint-Anything.git"
    "#egg=segment_anything&subdirectory=segment_anything"
)

MODEL_PATH = "/data/models/sam_vit_h_4b8939.pth"

MODEL_URL = (
    "https://huggingface.co/spaces/facebook/ov-seg/resolve/main/sam_vit_h_4b8939.pth"
)

BIG_LAMA_URL = (
    "https://huggingface.co/camenduru/big-lama/resolve/main/big-lama/models/best.ckpt"
)

BIG_LAMA_CONFIG = (
    "https://huggingface.co/camenduru/big-lama/raw/main/big-lama/config.yaml"
)


requirements = [
    "flask",
    "torch",
    "torchvision",
    "torchaudio",
    "diffusers",
    "transformers",
    "accelerate",
    "scipy",
    "safetensors",
    "opencv-python",
    "matplotlib",
    f"git+{segment_anything_repo}",
    "pyyaml",
    "tqdm",
    "easydict==1.9.0",
    "scikit-learn==0.24.2",
    "tensorflow",
    "joblib",
    "pandas",
    "albumentations==0.5.2",
    "hydra-core==1.1.0",
    "pytorch-lightning==1.2.9",
    "tabulate",
    "kornia==0.5.0",
    "webdataset",
    "packaging",
    "google-cloud-storage",
]


@cached
def clone_repo():
    print("---> This is clone_repo()")
    import os

    if not os.path.exists(REPO_PATH):
        print("Cloning inpaint repository")
        command = f"git clone --depth=1 https://github.com/geekyutao/Inpaint-Anything {REPO_PATH}"
        os.system(command)


@cached
def download_model():
    print("---> This is download_model()")
    import os

    if not os.path.exists("/data/models"):
        os.system("mkdir /data/models")
    if not os.path.exists(MODEL_PATH):
        print("Downloading SAM model.")
        os.system(f"cd /data/models && wget {MODEL_URL}")


@cached
def download_big_lama_model():
    import os

    if not os.path.exists("/data/models/big_lama/models"):
        os.system("mkdir -p /data/models/big_lama/models")
    if not os.path.exists("/data/models/big_lama/models/best.ckpt"):
        print("Downloading Big Lama model.")
        os.system(f"cd /data/models/big_lama && wget {BIG_LAMA_CONFIG}")
        os.system(f"cd /data/models/big_lama/models && wget {BIG_LAMA_URL}")


@cached
def get_gcs_bucket():
    print("---> This is get_gcs_bucket()")
    import os
    import json

    sa = os.environ.get("GCLOUD_SA_JSON")
    loaded = json.loads(sa, strict=False)

    with open("/root/gcp_sa.json", "w") as f:
        json.dump(loaded, f)

    from google.cloud import storage

    try:
        storage_client = storage.Client.from_service_account_json("/root/gcp_sa.json")
        bucket = storage_client.get_bucket("fal_edit_anything_results")
        return bucket
    except Exception as e:
        # Stringify original error so that it can be passed to the fal-serverless client
        raise Exception(str(e))


def upload_to_gcs(directory_path: str, dest_blob_name: str, bucket):
    import glob
    import os
    from google.cloud import storage

    for f in os.listdir(directory_path):
        remote_path = f"{dest_blob_name}/{f}"
        blob = bucket.blob(remote_path)
        blob.upload_from_filename(os.path.join(directory_path, f))


@cached
def sam_predictor(
    model_type: str,
    ckpt_p: str,
):
    from segment_anything import SamPredictor, sam_model_registry

    print("---> This is inside sam predictor")

    sam = sam_model_registry[model_type](checkpoint=ckpt_p)
    sam.to(device="cuda")
    return SamPredictor(sam)


@cached
def stable_diffusion_pipe():
    import torch
    from diffusers import StableDiffusionInpaintPipeline

    return StableDiffusionInpaintPipeline.from_pretrained(
        "stabilityai/stable-diffusion-2-inpainting",
        torch_dtype=torch.float32,
    ).to("cuda")


def predict_masks_with_sam(
    img,
    point_coords: List[List[float]],
    point_labels: List[int],
    model_type: str,
    ckpt_p: str,
    device="cuda",
):
    import numpy as np

    point_coords = np.array(point_coords)
    point_labels = np.array(point_labels)
    predictor = sam_predictor(model_type, ckpt_p)

    predictor.set_image(img)
    masks, scores, logits = predictor.predict(
        point_coords=point_coords,
        point_labels=point_labels,
        multimask_output=True,
    )
    return masks, scores, logits


def replace_img_with_sd(img, mask, text_prompt: str, step: int = 50):
    from utils.crop_for_replacing import recover_size, resize_and_pad
    import PIL.Image as Image
    import numpy as np

    pipe = stable_diffusion_pipe()
    img_padded, mask_padded, padding_factors = resize_and_pad(img, mask)
    img_padded = pipe(
        prompt=text_prompt,
        image=Image.fromarray(img_padded),
        mask_image=Image.fromarray(255 - mask_padded),
        num_inference_steps=step,
    ).images[0]
    height, width, _ = img.shape
    img_resized, mask_resized = recover_size(
        np.array(img_padded), mask_padded, (height, width), padding_factors
    )
    mask_resized = np.expand_dims(mask_resized, -1) / 255
    img_resized = img_resized * (1 - mask_resized) + img * mask_resized
    return img_resized


def fill_img_with_sd(img, mask, text_prompt):
    import numpy as np
    import PIL.Image as Image
    from utils.mask_processing import crop_for_filling_pre, crop_for_filling_post

    pipe = stable_diffusion_pipe()
    img_crop, mask_crop = crop_for_filling_pre(img, mask)
    img_crop_filled = pipe(
        prompt=text_prompt,
        image=Image.fromarray(img_crop),
        mask_image=Image.fromarray(mask_crop),
    ).images[0]
    img_filled = crop_for_filling_post(img, mask, np.array(img_crop_filled))
    return img_filled


def make_masks(image: str, extension: str, x: int, y: int, dilation: int):
    import sys
    import numpy as np
    import io
    from PIL import Image
    from pathlib import Path
    from matplotlib import pyplot as plt

    image = re.sub("^data:image/.+;base64,", "", image)

    os.environ["TRANSFORMERS_CACHE"] = "/data/models"
    os.environ["HF_HOME"] = "/data/models"

    print("=== Cloning inpaint repository")
    clone_repo()

    print("=== Downloading SAM model")
    download_model()

    sys.path.append(REPO_PATH)
    os.chdir(REPO_PATH)

    from utils import (
        load_img_to_array,
        save_array_to_img,
        show_mask,
        show_points,
        dilate_mask,
    )

    image_id = uuid.uuid4()
    print(f"image_id: {image_id}")

    input_img_name = f"{image_id}{extension}"

    image_bytes = base64.b64decode(image)

    img_raw = Image.open(io.BytesIO(image_bytes))
    rgb_img = img_raw.convert("RGB")

    print("Saving image")
    print(f"./{input_img_name}")
    rgb_img.save(f"./{input_img_name}")
    img = load_img_to_array(f"./{input_img_name}")
    print("Generating masks")
    masks, _, _ = predict_masks_with_sam(
        img,
        [[float(x), float(y)]],
        [1],
        model_type="vit_h",
        ckpt_p="/data/models/sam_vit_h_4b8939.pth",
    )
    print("Done")

    masks = masks.astype(np.uint8) * 255

    img_stem = Path(f"./{input_img_name}").stem
    out_dir = Path("/data/edit-results") / img_stem
    out_dir.mkdir(parents=True, exist_ok=True)

    for i, mask in enumerate(masks):
        mask = masks[i]
        if dilation:
            mask = dilate_mask(mask, dilation)
        mask_p = out_dir / f"mask_{i}.png"
        img_points_p = out_dir / f"with_points.png"
        img_mask_p = out_dir / f"with_{Path(mask_p).name}"

        # save the mask
        save_array_to_img(mask, mask_p)

        # save the pointed and masked image
        dpi = plt.rcParams["figure.dpi"]
        height, width = img.shape[:2]
        plt.figure(figsize=(width / dpi / 0.77, height / dpi / 0.77))
        plt.imshow(img)
        plt.axis("off")
        show_points(plt.gca(), [x, y], 1, size=(width * 0.04) ** 2)
        plt.savefig(img_points_p, bbox_inches="tight", pad_inches=0)
        show_mask(plt.gca(), mask, random_color=False)
        plt.savefig(img_mask_p, bbox_inches="tight", pad_inches=0)
        plt.close()

    print("Upload results to GCS")
    bucket = get_gcs_bucket()

    file_names = [
        f for f in os.listdir(out_dir) if os.path.isfile(os.path.join(out_dir, f))
    ]

    try:
        upload_to_gcs(str(out_dir), str(image_id), bucket)
    except Exception as e:
        raise Exception(str(e))

    print("Done")

    file_names = [
        f"{BASE_GCS_URL}/{image_id}/{f}" for f in file_names if "with_mask" in f
    ]

    return {"status": "success", "files": file_names, "image_id": image_id}


def edit_image(image_id, mask_id, prompt, extension):
    import sys

    os.environ["TRANSFORMERS_CACHE"] = "/data/models"
    os.environ["HF_HOME"] = "/data/models"

    sys.path.append(REPO_PATH)
    os.chdir(REPO_PATH)

    from utils import load_img_to_array, save_array_to_img
    from pathlib import Path

    input_img_name = f"{image_id}{extension}"
    out_dir = Path("/data/edit-results") / image_id
    mask_p = out_dir / f"mask_{mask_id}.png"
    mask = load_img_to_array(mask_p)
    replaced_dir = out_dir / "replaced"
    replaced_dir.mkdir(parents=True, exist_ok=True)

    img_replaced_p = replaced_dir / f"replaced_with_{Path(mask_p).name}"
    img = load_img_to_array(f"./{input_img_name}")
    img_replaced = replace_img_with_sd(img, mask, prompt)
    save_array_to_img(img_replaced, img_replaced_p)

    print("Upload results to GCS")
    bucket = get_gcs_bucket()

    file_names = [
        f
        for f in os.listdir(replaced_dir)
        if os.path.isfile(os.path.join(replaced_dir, f))
    ]

    try:
        upload_to_gcs(replaced_dir, image_id, bucket)
    except Exception as e:
        raise Exception(str(e))

    file_names = [
        f"{BASE_GCS_URL}/{image_id}/{f}" for f in file_names if "with_mask" in f
    ]

    return {
        "status": "success",
        "files": file_names,
    }


def remove_from_image(image_id, mask_id, extension):
    import sys

    os.environ["TRANSFORMERS_CACHE"] = "/data/models"
    os.environ["HF_HOME"] = "/data/models"

    download_big_lama_model()

    sys.path.append(REPO_PATH)
    os.chdir(REPO_PATH)

    from utils import load_img_to_array, save_array_to_img
    from lama_inpaint import inpaint_img_with_lama
    from pathlib import Path

    input_img_name = f"{image_id}{extension}"
    out_dir = Path("/data/edit-results") / image_id
    mask_p = out_dir / f"mask_{mask_id}.png"
    mask = load_img_to_array(mask_p)
    removed_dir = out_dir / "removed"
    removed_dir.mkdir(parents=True, exist_ok=True)

    img_removed_p = removed_dir / f"removed_with_{Path(mask_p).name}"
    img = load_img_to_array(f"./{input_img_name}")
    img_removed = inpaint_img_with_lama(
        img,
        mask,
        "./lama/configs/prediction/default.yaml",
        "/data/models/big_lama",
        device="cuda",
    )
    save_array_to_img(img_removed, img_removed_p)

    print("Upload results to GCS")
    bucket = get_gcs_bucket()

    file_names = [
        f
        for f in os.listdir(removed_dir)
        if os.path.isfile(os.path.join(removed_dir, f))
    ]

    try:
        upload_to_gcs(removed_dir, image_id, bucket)
    except Exception as e:
        raise Exception(str(e))

    file_names = [
        f"{BASE_GCS_URL}/{image_id}/{f}" for f in file_names if "with_mask" in f
    ]

    return {
        "status": "success",
        "files": file_names,
    }


def fill_image(image_id, mask_id, prompt, extension):
    import sys

    os.environ["TRANSFORMERS_CACHE"] = "/data/models"
    os.environ["HF_HOME"] = "/data/models"

    sys.path.append(REPO_PATH)
    os.chdir(REPO_PATH)

    from utils import load_img_to_array, save_array_to_img
    from pathlib import Path

    input_img_name = f"{image_id}{extension}"
    out_dir = Path("/data/edit-results") / image_id
    mask_p = out_dir / f"mask_{mask_id}.png"
    mask = load_img_to_array(mask_p)
    filled_dir = out_dir / "filled"
    filled_dir.mkdir(parents=True, exist_ok=True)

    img_filled_p = filled_dir / f"filled_with_{Path(mask_p).name}"
    img = load_img_to_array(f"./{input_img_name}")
    img_filled = fill_img_with_sd(img, mask, prompt)
    save_array_to_img(img_filled, img_filled_p)

    print("Upload results to GCS")
    bucket = get_gcs_bucket()

    file_names = [
        f for f in os.listdir(filled_dir) if os.path.isfile(os.path.join(filled_dir, f))
    ]

    try:
        upload_to_gcs(filled_dir, image_id, bucket)
    except Exception as e:
        raise Exception(str(e))

    file_names = [
        f"{BASE_GCS_URL}/{image_id}/{f}" for f in file_names if "with_mask" in f
    ]

    return {
        "status": "success",
        "files": file_names,
    }


# ------ Flask app ------


@isolated(
    requirements=requirements,
    machine_type="GPU",
    keep_alive=300,
    exposed_port=8080,
)
def app():
    from flask import Flask, jsonify, request

    app = Flask("fal-editanything")

    @app.route("/masks", methods=["POST"])
    def masks():
        data = request.get_json()
        image = data["image"]
        x = data["x"]
        y = data["y"]
        dilation = data["dilation"]
        extension = data["extension"]

        result = make_masks(image, extension, x, y, dilation)
        return jsonify({"result": result})

    @app.route("/edit", methods=["POST"])
    def edit():
        data = request.get_json()
        image_id = data["image_id"]
        mask_id = data["mask_id"]
        prompt = data["prompt"]
        extension = data["extension"]

        result = edit_image(image_id, mask_id, prompt, extension)
        return jsonify({"result": result})

    @app.route("/fill", methods=["POST"])
    def fill():
        data = request.get_json()
        image_id = data["image_id"]
        mask_id = data["mask_id"]
        prompt = data["prompt"]
        extension = data["extension"]

        result = fill_image(image_id, mask_id, prompt, extension)
        return jsonify({"result": result})

    @app.route("/remove", methods=["POST"])
    def remove():
        data = request.get_json()
        image_id = data["image_id"]
        mask_id = data["mask_id"]
        extension = data["extension"]

        result = remove_from_image(image_id, mask_id, extension)
        return jsonify({"result": result})

    @app.route("/test", methods=["POST"])
    def test():
        return jsonify({"result": "hello 4"})

    app.run(host="0.0.0.0", port=8080)
