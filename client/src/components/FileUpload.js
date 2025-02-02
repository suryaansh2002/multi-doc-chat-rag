import { useState } from 'react';
import { Upload } from 'lucide-react';

export default function FileUpload({ onUploadSuccess }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.includes('pdf')) {
            setError('Please upload a PDF file');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            onUploadSuccess(data);
            event.target.value = null; // Reset file input
        } catch (err) {
            setError('Error uploading file. Please try again.');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                />
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center"
                >
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-gray-600">
                        {uploading ? 'Uploading...' : 'Click to upload PDF'}
                    </span>
                </label>
                {error && (
                    <p className="text-red-500 mt-2">{error}</p>
                )}
            </div>
        </div>
    );
}