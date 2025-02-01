import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Chat from '../components/Chat';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ChatPage() {
    const router = useRouter();
    const [documentIds, setDocumentIds] = useState([]);

    useEffect(() => {
        if (router.query.docs) {
            setDocumentIds(router.query.docs.split('_'));
        }
    }, [router.query]);

    if (!documentIds.length) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <Link
                        href="/"
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Documents
                    </Link>
                </div>
            </header>

            <div className="flex-1 container mx-auto px-4 py-8 ">
                <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-200px)]">
                    <Chat documentIds={documentIds} />
                </div>
            </div>
        </div>
    );
}