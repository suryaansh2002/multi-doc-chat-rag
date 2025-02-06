import { useState, useRef, useEffect } from "react"
import { Send, Loader } from "lucide-react"
import Markdown from "react-markdown"
import BeatLoader from "react-spinners/BeatLoader"
import SourceViewer from "./SourceViewer"

export default function VideoChat({ videoId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
        type: "user",
        content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {

        // First, get the relevant context
        const contextResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/videoChat/query/context`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                query: input,
                videoIds: [videoId],
            }),
        });

        if (!contextResponse.ok) {
            throw new Error("Failed to get context");
        }

        const contextData = await contextResponse.json();


        // Then, get the LLM response
        const responseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/videoChat/query/response`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                query: input,
                context: contextData.context,
            }),
        });

        if (!responseResponse.ok) {
            throw new Error("Failed to get response");
        }

        const responseData = await responseResponse.json();
        // Update with final message
        const assistantMessage = {
          type: "assistant",
          content: responseData.response,
          sources: contextData.sources
      }
        setMessages((prev) => [...prev, assistantMessage]);

   

    } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => [
            ...prev,
            {
                type: "error",
                content: "Sorry, there was an error processing your request.",
            },
        ]);
    } finally {
        setLoading(false);
    }
};

  return (
    <div className="flex flex-col h-full text-gray-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            Start a conversation by asking a question about your video.
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-3xl rounded-lg px-4 py-2 ${
                message.type === "user"
                  ? "bg-blue-600 text-white"
                  : message.type === "error"
                    ? "bg-red-600 text-white"
                    : "bg-gray-700 text-gray-100"
              }`}
            >
              <p className="text-sm">
                <Markdown>{message.content}</Markdown>
              </p>
              {/* {message.sources && message.sources.length > 0 && <SourceViewer sources={message.sources} />} */}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-center">
            <BeatLoader color="#60A5FA" loading={true} size={10} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </div>
  )
}

