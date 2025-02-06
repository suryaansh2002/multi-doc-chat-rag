import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Chat from '../components/Chat';
import Link from 'next/link';
import { ArrowLeft, LogOut } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import VideoChat from '@/components/VideoChat';

function ChatPage() {
    const router = useRouter();
    const [videoId, setVideoId] = useState([]);
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!router.isReady) return;

        if (router.query.video) {
            setVideoId(router.query.video);
        } else {
            router.replace('/', undefined, { shallow: true }); // Added shallow: true to prevent full page reload
        }
        setLoading(false);
    }, [router.isReady, router.query, router.replace]); // Added router.replace to dependencies

    if (loading || !videoId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-300">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col text-gray-100 bg-gray-900">
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between h-16 items-center">
                        <Link
                            href="/"
                            className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            Back to Home
                        </Link>
                        <button
                            onClick={logout}
                            className="inline-flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
                        >
                            <LogOut className="h-5 w-5 mr-2" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="bg-gray-800 rounded-lg shadow-lg h-[calc(100vh-200px)]">
                    <VideoChat videoId={videoId} />
                </div>
            </main>
        </div>
    );
}

export async function getServerSideProps(context) {
    return {
        props: {}
    };
}

export default ProtectedRoute(ChatPage);
