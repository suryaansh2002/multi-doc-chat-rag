import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Chat from '../components/Chat';
import Link from 'next/link';
import { ArrowLeft, LogOut } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

function ChatPage() {
    const router = useRouter();
    const [documentIds, setDocumentIds] = useState([]);
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait for router to be ready
        if (!router.isReady) return;

        if (router.query.docs) {
            setDocumentIds(router.query.docs.split(','));
        } else {
            router.replace('/');
        }
        setLoading(false);
    }, [router.isReady, router.query]);

    if (loading || !documentIds.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col text-gray-900 bg-gray-100">
            <header className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16 items-center">
                        <Link
                            href="/"
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back to Documents
                        </Link>
                        <button
                            onClick={logout}
                            className="inline-flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                        >
                            <LogOut className="h-5 w-5 mr-2" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-200px)]">
                    <Chat documentIds={documentIds} />
                </div>
            </main>
        </div>
    );
}

// Add getServerSideProps to handle SSR
export async function getServerSideProps(context) {
    // Just return empty props, the component will handle the data fetching
    return {
        props: {}
    };
}

export default ProtectedRoute(ChatPage);