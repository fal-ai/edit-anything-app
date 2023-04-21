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

    url = os.environ['REPLACE_ANYTHING_URL']

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
    try:
        result = generate_response(base64_image, prompt, extension, circle_x, circle_y)
    except Exception as e:
        print(e)
        return jsonify({"status": "error", "message": str(e)})

    result_id = result.get('result', [None])[0]
    if result_id:
        BASE_URL = "https://storage.googleapis.com/fal_edit_anything_results"
        filenames = [f"replaced_with_mask_{i}.png" for i in range(3)]
        files = [f"{BASE_URL}/{result_id}/{filename}" for filename in filenames]

        return jsonify({"status": "success", "files": files})
    return jsonify({"status": "error"})


@app.route('/results/<path:path>')
def serve_files(path):
    return send_from_directory('results', path)

if __name__ == '__main__':
    app.run(debug=True)
