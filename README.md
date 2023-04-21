# edit anything with fal serverless

## Getting started
### Install `fal-serverless` and authenticate
```bash
pip install fal-serverless
```
After installation is complete, you can authenticate:

```bash
fal-serverless auth login
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

### Deploy the `replace_anything` function as a web endpoint

```bash
fal-serverless function serve replace.py run_replace --alias replace
```
And set the provided URL as an environment variable:
```bash
export REPLACE_ANYTHING_URL="your-web-endpoint-url"
```

### Start the local flask server

```bash
python api.py
```

## TODO:
- Build UI app with Next.js
- Automated deployment
