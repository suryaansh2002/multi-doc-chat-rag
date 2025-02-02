import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function SourceViewer({ sources }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3 border-t border-gray-600 pt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center text-sm text-gray-300 hover:text-white transition-colors duration-200"
      >
        {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
        {`${sources.length} source${sources.length > 1 ? "s" : ""}`}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {sources.map((source, index) => (
            <div key={index} className="bg-gray-700 border border-gray-600 rounded p-3 text-sm">
              <div className="text-xs text-gray-400 mb-1">Relevance: {Math.round(source.score * 100)}%</div>
              <p className="text-gray-200">{source.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

