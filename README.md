# edit anything with fal serverless

This is a reference implementation of a Next.js and fal-serverless, to demonstrate how ML models running on serverless GPUs can be used within a web application using Next.js. You can also see a [video about it here](https://youtu.be/ob_WOogJn_A).

You can see a live demo on [editanything.ai](https://editanything.ai). In case you want to run the project yourself, follow the instructions below.

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

### Deploy the `edit_image` and `make_masks` as web endpoints

```bash
fal-serverless function serve serverless/app.py app --alias edit_anything_app
```
And set the provided URL as an environment variable:
```bash
export MASK_FUNCTION_URL=`your_app_endpoint_url`/masks EDIT_FUNCTION_URL=`your_app_endpoint_url`/edit
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

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Make sure you read our [Code of Conduct](https://github.com/fal-ai/edit-anything-app/blob/main/CODE_OF_CONDUCT.md)
2. Fork the project and clone your fork
3. Setup the local environment with `npm install`
4. Create a feature branch (`git checkout -b feature/add-cool-thing`) or a bugfix branch (`git checkout -b fix/smash-that-bug`)
5. Commit the changes (`git commit -m 'feat(client): added a cool thing'`) - use [conventional commits](https://conventionalcommits.org)
6. Push to the branch (`git push --set-upstream origin feature/add-cool-thing`)
7. Open a Pull Request

Check the [good first issue queue](https://github.com/fal-ai/edit-anything-app/labels/good+first+issue), your contribution will be welcome!

## License

Distributed under the Apache-2.0 License. See [LICENSE](https://github.com/fal-ai/edit-anything-app/blob/main/LICENSE) for more information.
