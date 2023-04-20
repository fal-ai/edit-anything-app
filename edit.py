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
    f"git+{segment_anything_repo}"
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

def path_to_base64_zip(path):
    import os
    import zipfile
    import base64
    from io import BytesIO

    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        if os.path.isfile(path):
            zf.write(path, os.path.basename(path))
        else:
            for root, _, files in os.walk(path):
                for file in files:
                    file_path = os.path.join(root, file)
                    archive_path = os.path.relpath(file_path, start=path)
                    zf.write(file_path, archive_path)

    zip_buffer.seek(0)
    zip_data = zip_buffer.read()
    return base64.b64encode(zip_data).decode('utf-8')


@isolated(requirements=requirements, machine_type="GPU", keep_alive=300, serve=True)
def run(image_base64_str, prompt, extension, x, y):
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

    print('Packaging result')
    result = path_to_base64_zip(f'/data/edit-results/{image_id}')

    print('Cleaning up')
    os.system(f'rm ./{input_img_name}')
    os.system(f'rm -rf /data/edit-results/{image_id}')

    print('Done')
    return result
