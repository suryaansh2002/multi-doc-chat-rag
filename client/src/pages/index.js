import { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import { useRouter } from 'next/router';
import { MessageCircle } from 'lucide-react';

export default function Home() {
    const [documents, setDocuments] = useState([]);
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`http://localhost:3001/api/upload`);
            if (!response.ok) {
                throw new Error('Failed to fetch documents');
            }
            const data = await response.json();
            setDocuments(data);
        } catch (error) {
            console.error('Error fetching documents:', error);
            setError('Failed to load documents. Please refresh the page to try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = () => {
        fetchDocuments();
    };

    const handleDocumentSelect = (docId) => {
        setSelectedDocs(prev => {
            if (prev.includes(docId)) {
                return prev.filter(id => id !== docId);
            }
            return [...prev, docId];
        });
    };

    const handleDocumentsChange = (newDocuments) => {
        setDocuments(newDocuments);
    };

    const startChat = () => {
        if (selectedDocs.length > 0) {
            router.push({
                pathname: '/chat',
                query: { docs: selectedDocs.join('_') }
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">Document Q&A System</h1>
                    
                    <div className="mb-8">
                        <FileUpload onUploadSuccess={handleUploadSuccess} />
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading documents...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="mb-8">
                            <FileList 
                                documents={documents}
                                selectedDocs={selectedDocs}
                                onDocumentSelect={handleDocumentSelect}
                                onDocumentsChange={handleDocumentsChange}
                            />
                        </div>
                    )}
                    
                    {selectedDocs.length > 0 && (
                        <div className="fixed bottom-8 right-8">
                            <button
                                onClick={startChat}
                                className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 shadow-lg flex items-center space-x-2 transition-all hover:scale-105"
                            >
                                <MessageCircle className="h-5 w-5" />
                                <span>Start Chat with Selected Documents</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}