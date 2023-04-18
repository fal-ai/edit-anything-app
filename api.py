from fal_serverless import isolated, cached
from PIL import Image
import os
import base64
from flask import Flask, request, jsonify, send_from_directory
from base64 import b64encode
from flask_cors import CORS
import uuid
import zipfile
import re

app = Flask(__name__)
CORS(app)


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


@isolated(requirements=requirements, machine_type="GPU", keep_alive=300)
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

@isolated()
def command(command):
    import os
    os.system(command)

def image_to_base64(path):
    with open(path, 'rb') as f:
        img_data = f.read()
        return base64.b64encode(img_data).decode('utf-8')

def save_base64_zip_as_file(base64_zip_str, output_path):
    zip_data = base64.b64decode(base64_zip_str)

    with open(output_path, 'wb') as f:
        f.write(zip_data)

@app.route('/edit', methods=['POST'])
def handle_request():
    import io
    data = request.get_json()
    image_data = data.get('image')
    circle_x = data.get('x')
    circle_y = data.get('y')
    prompt = data.get('prompt')
    filename = data.get('filename')

    extension = os.path.splitext(filename)[1]

    # Convert image data URL to base64 string
    base64_image = re.sub('^data:image/.+;base64,', '', image_data)

    # Process and store the data as needed

    result = run(base64_image, prompt, extension, circle_x, circle_y)

    result_id = str(uuid.uuid4())

    save_base64_zip_as_file(result, f"{result_id}.zip")
    result_dir = f'results/{result_id}'
    with zipfile.ZipFile(f'{result_id}.zip', 'r') as zip_ref:
        zip_ref.extractall(result_dir)

    file_names = [f for f in os.listdir(result_dir) if os.path.isfile(os.path.join(result_dir, f))]
    file_names = [f"http://127.0.0.1:5000/results/{result_id}/{f}" for f in file_names]

    os.system(f"rm {result_id}.zip")

    return jsonify({"status": "success", "files": file_names})


@app.route('/results/<path:path>')
def serve_files(path):
    return send_from_directory('results', path)

if __name__ == '__main__':
    app.run(debug=True)
