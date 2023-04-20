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

def image_to_base64(path):
    with open(path, 'rb') as f:
        img_data = f.read()
        return base64.b64encode(img_data).decode('utf-8')

def save_base64_zip_as_file(base64_zip_str, output_path):
    zip_data = base64.b64decode(base64_zip_str)

    with open(output_path, 'wb') as f:
        f.write(zip_data)

def generate_response(base64_image, prompt, extension, circle_x, circle_y):
    import requests
    import json
    import os

    url = 'https://38204337-faledit.gateway.shark.fal.ai'

    payload = {
        'image_base64_str': base64_image,
        'prompt': prompt,
        'extension': extension,
        'x': circle_x,
        'y': circle_y
    }

    headers = {
        'X-Fal-Key-Id': os.environ['FAL_KEY_ID'],
        'X-Fal-Key-Secret': os.environ['FAL_KEY_SECRET'],
        'Content-Type': 'application/json'}

    print('Sending request to fal serverless web endpoint')
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print('Result received')
    response_dict = json.loads(response.text)
    return response_dict

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

    result = generate_response(base64_image, prompt, extension, circle_x, circle_y)

    result_id = str(uuid.uuid4())

    save_base64_zip_as_file(result["result"], f"{result_id}.zip")
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
