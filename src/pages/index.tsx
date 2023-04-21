import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Home = () => {
    const [image, setImage] = useState<string | null>(null);
    const [x, setX] = useState(0);
    const [y, setY] = useState(0);
    const [prompt, setPrompt] = useState('');
    const [filename, setFilename] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
	if (image) {
	    drawImage();
	}
    }, [image]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
	if (e.target.files && e.target.files[0]) {
	    setFilename(e.target.files[0].name);
	    const reader = new FileReader();
	    reader.onload = (event) => {
		if (event.target) {
		    setImage(event.target.result as string);
		}
	    };
	    reader.readAsDataURL(e.target.files[0]);
	}
    };

    const drawImage = () => {
	if (canvasRef.current && image) {
	    const ctx = canvasRef.current.getContext('2d');
	    if (ctx) {
		const img = new Image();
		img.src = image;
		img.onload = () => {
		    canvasRef.current!.width = img.width;
		    canvasRef.current!.height = img.height;
		    ctx.drawImage(img, 0, 0);
		};
	    }
	}
    };

    const drawDot = (x: number, y: number) => {
	const ctx = canvasRef.current!.getContext('2d')!;
	ctx.beginPath();
	ctx.arc(x, y, 5, 0, 2 * Math.PI);
	ctx.fillStyle = 'blue';
	ctx.fill();
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
	const rect = canvasRef.current!.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	setX(x);
	setY(y);

	const ctx = canvasRef.current!.getContext('2d')!;
	const img = new Image();
	img.src = image!;

	ctx.drawImage(img, 0, 0);
	drawDot(x, y);
    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
	e.preventDefault();

	setIsLoading(true);

	if (!image) {
	    alert('Please upload an image.');
	    return;
	}

	try {
	    const response = await axios.post('/api/edit', { image, x, y, prompt, filename });
	    setImageUrls(response.data.files);
	} catch (error) {
	    console.error('Error submitting the form', error);
	} finally {
	    setIsLoading(false)
	}
    };

    return (
      <div className={`container mx-auto px-4 py-8 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <h1 className="text-4xl font-bold mb-8">Edit Image</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-lg font-medium">Image:</label>
                <input type="file" onChange={handleImageUpload} className="mt-1" />
            </div>
            <div>
                <label className="block text-lg font-medium">Prompt:</label>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-1 w-full p-2 border-2 border-gray-300 rounded-md"
                />
            </div>
            <button
                type="submit"
                className="bg-blue-600 text-white font-semibold p-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
                Submit
            </button>
        </form>
        {image && (
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Click on the image to place the blue dot</h2>
                <canvas ref={canvasRef} onClick={handleCanvasClick} className="border-2 border-gray-300 rounded-md"></canvas>
            </div>
        )}
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Generated Images</h2>
            <div className="grid grid-cols-2 gap-4">
                {imageUrls.map((url, index) => (
                    <img
                        key={index}
                        src={url}
                        alt={`Generated Image ${index + 1}`}
                        className="rounded-md shadow-md"
                    />
                ))}
            </div>
        </div>
	{isLoading && (
            <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-8 rounded-md shadow-md">
                  <h3 className="text-xl font-semibold mb-4">Loading</h3>
                  <p>Please wait...</p>
                </div>
             </div>
         )}
    </div>
  );

};

export default Home;
