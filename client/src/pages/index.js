import { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { LogOut, MessageCircle } from 'lucide-react';

function Home() {
    const [documents, setDocuments] = useState([]);
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { logout } = useAuth();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
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
                query: { docs: selectedDocs.join(',') }
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Document Q&A System</h1>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={logout}
                                className="inline-flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-8">
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
            </main>
        </div>
    );
}

export default ProtectedRoute(Home);