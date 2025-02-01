import { useState } from 'react';
import { FileText, Check, Trash2, X } from 'lucide-react';

export default function FileList({ documents, selectedDocs, onDocumentSelect, onDocumentsChange }) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleDeleteClick = (doc, e) => {
        e.stopPropagation(); // Prevent document selection when clicking delete
        setDocumentToDelete(doc);
        setDeleteModalOpen(true);
        setError(null);
    };

    const handleDeleteConfirm = async () => {
        if (!documentToDelete) return;

        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:3001/api/upload/${documentToDelete._id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete document');
            }

            // Update the documents list
            onDocumentsChange(documents.filter(doc => doc._id !== documentToDelete._id));
            
            // Remove from selected docs if it was selected
            if (selectedDocs.includes(documentToDelete._id)) {
                onDocumentSelect(documentToDelete._id);
            }
            
            setDeleteModalOpen(false);
        } catch (err) {
            console.error('Error deleting document:', err);
            setError('Failed to delete document. Please try again.');
        } finally {
            setIsDeleting(false);
            setDocumentToDelete(null);
        }
    };

    if (!documents.length) {
        return (
            <div className="text-center text-gray-500 py-8">
                No documents uploaded yet
            </div>
        );
    }

    return (
        <div className="relative">
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <span>{error}</span>
                    <button 
                        onClick={() => setError(null)}
                        className="absolute top-3 right-3 text-red-700 hover:text-red-900"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            
            <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Your Documents</h2>
                </div>
                <ul className="divide-y divide-gray-200">
                    {documents.map((doc) => (
                        <li
                            key={doc._id}
                            className={`flex items-center px-4 py-4 hover:bg-gray-50 ${
                                selectedDocs.includes(doc._id) ? 'bg-blue-50' : ''
                            }`}
                        >
                            <div 
                                className="flex-1 flex items-center cursor-pointer"
                                onClick={() => onDocumentSelect(doc._id)}
                            >
                                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 text-blue-500">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                                        {selectedDocs.includes(doc._id) && (
                                            <Check className="h-5 w-5 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <span>{formatDate(doc.uploadDate)}</span>
                                        <span className="mx-2">•</span>
                                        <span>{formatFileSize(doc.fileSize)}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleDeleteClick(doc, e)}
                                className="ml-4 p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 focus:outline-none"
                                disabled={isDeleting}
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-2">Delete Document</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete "{documentToDelete?.filename}"? 
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setDocumentToDelete(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}