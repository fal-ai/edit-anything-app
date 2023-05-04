# edit anything with fal serverless

## Getting started
### Prerequisites
- Python >=3.8
- Node.js >= 18.0

### Install `fal-serverless` and authenticate
```bash
pip install fal-serverless
```
After installation is complete, you can authenticate:

```bash
fal-serverless auth login
```

### Install next.js dependencies
```bash
npm install
```

### Generate authentication keys and set them as environment variables
Generate a secret key for key-based authentication
```bash
fal-serverless key generate
```

Set the generated key ID and secret as environment variables:
```bash
export FAL_KEY_ID="your-key-id" FAL_KEY_SECRET="your-key-secret"
```

### Set Google Cloud Service Account secret

The web endpoint uses Google Cloud Storage for saving the inference results. So it needs access to a service account json. You can provide it to fal-serverless like this:

```bash
fal-serverless secrets set GCLOUD_SA_JSON "$(cat path-to-my-service-account.json)"
```

### Deploy the `edit_image` and `make_masks` functions as a web endpoints

```bash
fal-serverless function serve serverless/app.py edit_image --alias edit_image
fal-serverless function serve serverless/app.py make_masks --alias make_masks
```
And set the provided URL as an environment variable:
```bash
export MASK_FUNCTION_URL=your_mask_endpoint_url EDIT_FUNCTION_URL=your_edit_endpoint_url
```

You can also set these in `.env.local` file:

```text
FAL_KEY_ID=key_id_value
FAL_KEY_SECRET=key_secret_value
MASK_FUNCTION_URL=mask_endpoint_url
EDIT_FUNCTION_URL=edit_endpoint_url
```

### Start the local dev server

```bash
npm run dev
```

## TODO:
- Build UI app with Next.js
- Automated deployment
