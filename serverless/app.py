from fal_serverless import isolated, cached

import base64
import os
import re
import uuid

# from flask import Flask, request, jsonify, send_from_directory
# from flask_cors import CORS
# import zipfile
# import time

# app = Flask(__name__)
# CORS(app)

REPO_PATH = "/data/repos/inpaint-anyting"

BASE_GCS_URL = "https://storage.googleapis.com/fal_edit_anything_results"

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


@isolated(requirements=requirements, machine_type="GPU-T4", serve=True)
def make_masks(image: str, extension: str, x: int, y: int):
    import sys
    import numpy as np
    import io
    from PIL import Image
    from pathlib import Path
    from matplotlib import pyplot as plt

    image = re.sub('^data:image/.+;base64,', '', image)

    os.environ['TRANSFORMERS_CACHE'] = '/data/models'
    os.environ['HF_HOME'] = '/data/models'

    clone_repo()
    download_model()

    sys.path.append(REPO_PATH)
    os.chdir(REPO_PATH)

    from sam_segment import predict_masks_with_sam
    from utils import load_img_to_array, save_array_to_img, \
        show_mask, show_points

    image_id = uuid.uuid4()
    print(f"image_id: {image_id}")

    input_img_name = f"{image_id}{extension}"

    image_bytes = base64.b64decode(image)

    img_raw = Image.open(io.BytesIO(image_bytes))
    rgb_img = img_raw.convert('RGB')

    print('Saving image')
    print(f"./{input_img_name}")
    rgb_img.save(f"./{input_img_name}")
    img = load_img_to_array(f"./{input_img_name}")
    print('Generating masks')
    masks, _, _ = predict_masks_with_sam(
        img,
        [[float(x), float(y)]],
        [1],
        model_type="vit_h",
        ckpt_p="/data/models/sam_vit_h_4b8939.pth",
    )
    print('Done')
    masks = masks.astype(np.uint8) * 255

    img_stem = Path(f"./{input_img_name}").stem
    out_dir = Path("/data/edit-results") / img_stem
    out_dir.mkdir(parents=True, exist_ok=True)

    for i, mask in enumerate(masks):
        mask = masks[i]
        mask_p = out_dir / f"mask_{i}.png"
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

    print("Upload results to GCS")
    bucket = get_gcs_bucket()

    file_names = [f for f in os.listdir(out_dir) if os.path.isfile(os.path.join(out_dir, f))]

    try:
        upload_to_gcs(str(out_dir), str(image_id), bucket)
    except Exception as e:
        raise Exception(str(e))

    print('Done')

    file_names = [
        f"{BASE_GCS_URL}/{image_id}/{f}"
        for f in file_names
        if "with_mask" in f
    ]
    return {
        "status": "success",
        "files": file_names,
        "image_id": image_id
    }


@isolated(requirements=requirements, machine_type="GPU-T4", serve=True)
def edit_image(image_id, mask_id, prompt, extension):
    import sys

    os.environ['TRANSFORMERS_CACHE'] = '/data/models'
    os.environ['HF_HOME'] = '/data/models'

    sys.path.append(REPO_PATH)
    os.chdir(REPO_PATH)

    from stable_diffusion_inpaint import replace_img_with_sd
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
    img_replaced = replace_img_with_sd(
        img, mask, prompt, device="cuda")
    save_array_to_img(img_replaced, img_replaced_p)

    print("Upload results to GCS")
    bucket = get_gcs_bucket()

    file_names = [f for f in os.listdir(replaced_dir) if os.path.isfile(os.path.join(replaced_dir, f))]

    try:
        upload_to_gcs(replaced_dir, image_id, bucket)
    except Exception as e:
        raise Exception(str(e))


    file_names = [
        f"{BASE_GCS_URL}/{image_id}/{f}"
        for f in file_names
        if "with_mask" in f
    ]

    return {
        "status": "success",
        "files": file_names,
    }


# @app.route('/make_masks', methods=['POST'])
# def handle_make_masks():
#     print('Handling make masks')
#     data = request.get_json()
#     image_data = data.get('image')
#     extension = data.get('extension')
#     circle_x = data.get('x')
#     circle_y = data.get('y')

#     # Process and store the data as needed
#     start = time.time()
#     result = make_masks(
#         image_data, extension, circle_x, circle_y)

#     print(f'it took {time.time() - start} seconds')

#     return jsonify({ "result": result })


# @app.route("/edit", methods=['POST'])
# def handle_edit():
#     data = request.get_json()
#     image_id = data.get('image_id')
#     extension = data.get('extension')
#     mask_id = data.get('mask_id')
#     prompt = data.get('prompt')

#     start = time.time()
#     result = edit_image(
#         image_id, mask_id, prompt, extension)

#     print(f'it took {time.time() - start} seconds')

#     return jsonify({ "result": result })


# @app.route('/results/<path:path>')
# def serve_files(path):
#     return send_from_directory('results', path)

# if __name__ == '__main__':
#     app.run(debug=True)
