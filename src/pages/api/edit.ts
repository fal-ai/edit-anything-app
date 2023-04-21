import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import yauzl from 'yauzl';
import { Buffer } from 'buffer';

const image_to_base64 = (imagePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
	fs.readFile(imagePath, 'base64')
	    .then((data) => resolve(data))
	    .catch((error) => reject(error));
    });
};

const generate_response = async (
    base64_image: string,
    prompt: string,
    extension: string,
    circle_x: number,
    circle_y: number
): Promise<{ result: string }> => {
    const url = process.env.REPLACE_ANYTHING_URL as string;

    const payload = {
	image_base64_str: base64_image,
	prompt: prompt,
	extension: extension,
	x: circle_x,
	y: circle_y,
    };

    const headers = {
	'X-Fal-Key-Id': process.env.FAL_KEY_ID,
	'X-Fal-Key-Secret': process.env.FAL_KEY_SECRET,
	'Content-Type': 'application/json',
    };
    const response = await axios.post<{ result: string }>(url, payload, { headers });
    return response.data;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
	const { image, x, y, prompt, filename } = req.body;

	const extension = path.extname(filename);

	// Convert image data URL to base64 string
	const base64Image = image.replace(/^data:image\/.+;base64,/, '');

	// Process and store the data as needed
	console.log("starting generation")
	const result = await generate_response(base64Image, prompt, extension, x, y);
	console.log(result)
	const result_id = result['result'][0]

	const BASE_URL:string = "https://storage.googleapis.com/fal_edit_anything_results";
	const filenames:string[] = Array.from({ length: 3 }, (_, i) => `replaced_with_mask_${i}.png`);
	const files:string[] = filenames.map(filename => `${BASE_URL}/${result_id}/${filename}`);

	console.log("done")
	res.status(200).json({ status: 'success', files: files });
    } else {
	res.status(405).json({ message: 'Method not allowed' });
    }
}
