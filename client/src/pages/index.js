import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "../contexts/AuthContext"
import ProtectedRoute from "../components/ProtectedRoute"
import { LogOut, MessageCircle, Upload, FileText, Check, Trash2, X } from "lucide-react"

function Home() {
  const [documents, setDocuments] = useState([])
  const [selectedDocs, setSelectedDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("pdf")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [youtubeVideos, setYoutubeVideos] = useState([])
  const router = useRouter()
  const { logout } = useAuth()
  const [isDeletingVideo, setIsDeletingVideo] = useState(false)

  useEffect(() => {
    fetchDocuments()
    fetchYoutubeVideos()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch documents")
      }

      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error("Error fetching documents:", error)
      setError("Failed to load documents. Please refresh the page to try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchYoutubeVideos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/videos`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch YouTube videos")
      }

      const data = await response.json()
      setYoutubeVideos(data)
    } catch (error) {
      console.error("Error fetching YouTube videos:", error)
    }
  }

  const handleUploadSuccess = () => {
    fetchDocuments()
  }

  const handleDocumentSelect = (docId) => {
    setSelectedDocs((prev) => {
      if (prev.includes(docId)) {
        return prev.filter((id) => id !== docId)
      }
      return [...prev, docId]
    })
  }

  const handleDocumentsChange = (newDocuments) => {
    setDocuments(newDocuments)
  }

  const startChat = () => {
    if (selectedDocs.length > 0) {
      router.push({
        pathname: "/chat",
        query: { docs: selectedDocs.join("_") },
      })
    }
  }

  const handleYoutubeUpload = async (e) => {
    e.preventDefault()
    const videoId = new URL(youtubeUrl).searchParams.get("v")
    if (!videoId) {
      setError("Invalid YouTube URL")
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ videoId }),
      })

      if (!response.ok) {
        throw new Error("Failed to upload YouTube video")
      }

      setYoutubeUrl("")
      fetchYoutubeVideos()
    } catch (error) {
      console.error("Error uploading YouTube video:", error)
      setError("Failed to upload YouTube video. Please try again.")
    }
  }

  const handleDeleteVideo = async (videoId) => {
    if (isDeletingVideo) return

    setIsDeletingVideo(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/videos/${videoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete YouTube video")
      }

      // Remove the deleted video from the state
      setYoutubeVideos((prevVideos) => prevVideos.filter((video) => video._id !== videoId))
    } catch (error) {
      console.error("Error deleting YouTube video:", error)
      setError("Failed to delete YouTube video. Please try again.")
    } finally {
      setIsDeletingVideo(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <nav className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-white">Document Q&A System</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
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
          <div className="flex border-b border-gray-700">
            <button
              className={`py-2 px-4 ${activeTab === "pdf" ? "border-b-2 border-blue-500" : ""}`}
              onClick={() => setActiveTab("pdf")}
            >
              PDF Documents
            </button>
            <button
              className={`py-2 px-4 ${activeTab === "youtube" ? "border-b-2 border-blue-500" : ""}`}
              onClick={() => setActiveTab("youtube")}
            >
              YouTube Videos
            </button>
          </div>
        </div>

        {activeTab === "pdf" ? (
          <>
            <div className="mb-8">
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-400">Loading documents...</p>
              </div>
            ) : error ? (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded relative" role="alert">
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
                  className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 shadow-lg flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Start Chat with Selected Documents</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-8">
            <form onSubmit={handleYoutubeUpload} className="flex gap-4">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Enter YouTube URL"
                className="flex-grow px-4 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {youtubeVideos.map((video) => (
                <div key={video._id} className="bg-gray-800 rounded-lg overflow-hidden relative">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{video.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{video.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteVideo(video._id)}
                    className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                    disabled={isDeletingVideo}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function FileUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file")
      return
    }

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      onUploadSuccess(data)
      event.target.value = null // Reset file input
    } catch (err) {
      setError("Error uploading file. Please try again.")
      console.error("Upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
          <Upload className="w-12 h-12 text-gray-400 mb-3" />
          <span className="text-gray-300">{uploading ? "Uploading..." : "Click to upload PDF"}</span>
        </label>
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </div>
    </div>
  )
}

function FileList({ documents, selectedDocs, onDocumentSelect, onDocumentsChange }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDeleteClick = (doc, e) => {
    e.stopPropagation() // Prevent document selection when clicking delete
    setDocumentToDelete(doc)
    setDeleteModalOpen(true)
    setError(null)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/${documentToDelete._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete document")
      }

      // Update the documents list
      onDocumentsChange(documents.filter((doc) => doc._id !== documentToDelete._id))

      // Remove from selected docs if it was selected
      if (selectedDocs.includes(documentToDelete._id)) {
        onDocumentSelect(documentToDelete._id)
      }

      setDeleteModalOpen(false)
    } catch (err) {
      console.error("Error deleting document:", err)
      setError("Failed to delete document. Please try again.")
    } finally {
      setIsDeleting(false)
      setDocumentToDelete(null)
    }
  }

  if (!documents.length) {
    return <div className="text-center text-gray-400 py-8">No documents uploaded yet</div>
  }

  return (
    <div className="relative">
      {error && (
        <div className="mb-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded relative">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="absolute top-3 right-3 text-red-100 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Your Documents</h2>
        </div>
        <ul className="divide-y divide-gray-700">
          {documents.map((doc) => (
            <li
              key={doc._id}
              className={`flex items-center px-4 py-4 hover:bg-gray-700 ${
                selectedDocs.includes(doc._id) ? "bg-blue-900" : ""
              }`}
            >
              <div className="flex-1 flex items-center cursor-pointer" onClick={() => onDocumentSelect(doc._id)}>
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-900 text-blue-300">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{doc.filename}</p>
                    {selectedDocs.includes(doc._id) && <Check className="h-5 w-5 text-blue-400" />}
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <span>{formatDate(doc.uploadDate)}</span>
                    <span className="mx-2">•</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteClick(doc, e)}
                className="ml-4 p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700 focus:outline-none"
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
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2 text-white">Delete Document</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete "{documentToDelete?.filename}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setDocumentToDelete(null)
                }}
                className="px-4 py-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProtectedRoute(Home)

