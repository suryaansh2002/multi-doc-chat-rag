import { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import SourceViewer from './SourceViewer';
import Markdown from 'react-markdown'
import BeatLoader from "react-spinners/BeatLoader";

export default function Chat({ documentIds }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = {
            type: 'user',
            content: input,
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/chat/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: input,
                    documentIds: documentIds,
                }),
            });

            const data = await response.json();
            console.log(data)
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            const assistantMessage = {
                type: 'assistant',
                content: data.response,
                sources: data.sources,
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                type: 'error',
                content: 'Sorry, there was an error processing your request.',
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex text-black ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-3xl rounded-lg px-4 py-2 ${
                                message.type === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : message.type === 'error'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100'
                            }`}
                        >
                            <p className="text-sm"><Markdown>{message.content}</Markdown></p>
                            {message.sources && (
                                <SourceViewer sources={message.sources} />
                            )}
                        </div>
                    </div>
                ))}
                {
                    loading ? <>
                    <div>
                    <BeatLoader loading={true} size={5}/>
                    </div>
                    </>
                    :<></>
                }
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex space-x-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}