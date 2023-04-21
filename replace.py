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
    import sys
    import os
    import io
    import uuid
    import base64
    from PIL import Image

    clone_repo()
    download_model()

    sys.path.append(REPO_PATH)
    os.chdir(REPO_PATH)

    image_id = uuid.uuid4()

    input_img_name = f"{image_id}{extension}"

    image_bytes = base64.b64decode(image_base64_str)

    img = Image.open(io.BytesIO(image_bytes))
    rgb_img = img.convert('RGB')
    rgb_img.save(f"./{input_img_name}")

    command = (
        "python replace_anything.py \\"
        f"--input_img ./{input_img_name} \\"
        f"--point_coords {x} {y} \\"
        "--point_labels 1 \\"
        f"--text_prompt \"{prompt}\" \\"
        "--output_dir /data/edit-results \\"
        "--sam_model_type \"vit_h\" \\"
        "--sam_ckpt /data/models/sam_vit_h_4b8939.pth"
    )

    print('Start run')

    os.system(command)

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
