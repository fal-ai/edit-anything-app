from fal_serverless import isolated, cached

REPO_PATH = "/data/repos/inpaint-anyting"

segment_anything_repo = (
    "https://github.com/geekyutao/Inpaint-Anything.git"
    "#egg=segment_anything&subdirectory=segment_anything"
)

MODEL_PATH = "/data/models/sam_vit_h_4b8939.pth"

MODEL_URL = "https://huggingface.co/spaces/facebook/ov-seg/resolve/main/sam_vit_h_4b8939.pth"

requirements = [
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
    "google-cloud-storage"
]

@cached
def clone_repo():
    import os
    if not os.path.exists(REPO_PATH):
        print("Cloning inpaint repository")
        command = (
            f"git clone --depth=1 https://github.com/geekyutao/Inpaint-Anything {REPO_PATH}")
        os.system(command)

@cached
def download_model():
    import os
    if not os.path.exists("/data/models"):
        os.system("mkdir /data/models")
    if not os.path.exists(MODEL_PATH):
        print("Downloading SAM model.")
        os.system(f"cd /data/models && wget {MODEL_URL}")

@cached
def get_gcs_bucket():
    import os
    import json

    sa = os.environ.get("GCLOUD_SA_JSON")
    loaded = json.loads(sa, strict=False)

    with open('/root/gcp_sa.json', 'w') as f:
        json.dump(loaded, f)

    from google.cloud import storage
    try:
        storage_client = storage.Client.from_service_account_json('/root/gcp_sa.json')
        bucket = storage_client.get_bucket('fal_edit_anything_results')
        return bucket
    except Exception as e:
        # Stringify original error so that it can be passed to the fal-serverless client
        raise Exception(str(e))


def upload_to_gcs(directory_path: str, dest_blob_name: str, bucket):
    import glob
    import os
    from google.cloud import storage
    for f in os.listdir(directory_path):
        remote_path = f'{dest_blob_name}/{f}'
        blob = bucket.blob(remote_path)
        blob.upload_from_filename(os.path.join(directory_path, f))


@isolated(requirements=requirements, machine_type="GPU", serve=True)
def run_replace(image_base64_str, prompt, extension, x, y):
    import cv2
    import sys
    import os
    import numpy as np
    import torch
    import io
    from pathlib import Path
    from matplotlib import pyplot as plt
    from typing import Any, Dict, List
    import uuid
    import base64
    from PIL import Image

    os.environ['TRANSFORMERS_CACHE'] = '/data/models'
    os.environ['HF_HOME'] = '/data/models'

    device = "cuda" if torch.cuda.is_available() else "cpu"

    clone_repo()
    download_model()

    sys.path.append(REPO_PATH)
    os.chdir(REPO_PATH)

    from sam_segment import predict_masks_with_sam
    from stable_diffusion_inpaint import replace_img_with_sd
    from utils import load_img_to_array, save_array_to_img, dilate_mask, \
        show_mask, show_points

    image_id = uuid.uuid4()

    input_img_name = f"{image_id}{extension}"

    image_bytes = base64.b64decode(image_base64_str)

    img_raw = Image.open(io.BytesIO(image_bytes))
    rgb_img = img_raw.convert('RGB')
    rgb_img.save(f"./{input_img_name}")
    img = load_img_to_array(f"./{input_img_name}")

    masks, _, _ = predict_masks_with_sam(
        img,
        [[float(x), float(y)]],
        [1],
        model_type="vit_h",
        ckpt_p="/data/models/sam_vit_h_4b8939.pth",
        device=device,
    )

    masks = masks.astype(np.uint8) * 255

    img_stem = Path(f"./{input_img_name}").stem
    out_dir = Path("/data/edit-results") / img_stem
    out_dir.mkdir(parents=True, exist_ok=True)

    mask = masks[0]

    mask_p = out_dir / f"mask_{0}.png"
    img_points_p = out_dir / f"with_points.png"
    img_mask_p = out_dir / f"with_{Path(mask_p).name}"

    # save the mask
    save_array_to_img(mask, mask_p)

    # save the pointed and masked image
    dpi = plt.rcParams['figure.dpi']
    height, width = img.shape[:2]
    plt.figure(figsize=(width/dpi/0.77, height/dpi/0.77))
    plt.imshow(img)
    plt.axis('off')
    show_points(plt.gca(), [x, y], 1,
                size=(width*0.04)**2)
    plt.savefig(img_points_p, bbox_inches='tight', pad_inches=0)
    show_mask(plt.gca(), mask, random_color=False)
    plt.savefig(img_mask_p, bbox_inches='tight', pad_inches=0)
    plt.close()

    mask_p = out_dir / f"mask_{0}.png"
    img_replaced_p = out_dir / f"replaced_with_{Path(mask_p).name}"
    img_replaced = replace_img_with_sd(
        img, mask, prompt, device=device)
    save_array_to_img(img_replaced, img_replaced_p)

    print('Done')

    print("Upload results to GCS")
    bucket = get_gcs_bucket()

    result_dir = f'/data/edit-results/{image_id}'

    file_names = [f for f in os.listdir(result_dir) if os.path.isfile(os.path.join(result_dir, f))]

    try:
        upload_to_gcs(result_dir, image_id, bucket)
    except Exception as e:
        raise Exception(str(e))

    return image_id, file_names
