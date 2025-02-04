const express = require('express');
const router = express.Router();
const multer = require('multer');
const Document = require('../models/document');
const { PineconeService } = require('../services/pinecone');
const auth = require('../middleware/auth');
const pdfParse = require('pdf-parse');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const pineconeService = new PineconeService();
const Tiktoken = require('@dqbd/tiktoken');

// Add auth middleware to all routes
router.use(auth);


function splitIntoChunks(text) {
    // Clean text while preserving structure
    const cleanText = cleanProcessText(text);
    
    // Initialize OpenAI tokenizer
    const encoder = Tiktoken.get_encoding("cl100k_base");
    const tokens = encoder.encode(cleanText);
    
    // Chunking configuration
    const chunkSize = 512;
    const chunkOverlap = 50;
    const chunks = [];
    
    // Generate chunks with overlap
    let start = 0;
    while (start < tokens.length) {
        const end = Math.min(start + chunkSize, tokens.length);
        const chunkTokens = tokens.slice(start, end);
        chunks.push(encoder.decode(chunkTokens));
        
        // Move window with overlap, ensuring we don't go backward
        start = end - chunkOverlap;
        if (start < (end - chunkOverlap)) break; // Prevent infinite loops
    }
    
    // Clean up tokenizer resources
    encoder.free();

    // Post-process chunks
    return postProcessChunks(chunks);
}

function cleanProcessText(text) {
    return text
        .replace(/\r\n/g, '\n') // Normalize line breaks
        .replace(/(\n\s*){2,}/g, '\n\n') // Preserve paragraph breaks
        .replace(/[^\S\n]+/g, ' ') // Collapse multiple spaces
        .trim();
}

function  postProcessChunks(chunks) {
    const seen = new Set();
    return chunks.filter(chunk => {
        const content = chunk.trim();
        // Remove empty chunks and duplicates (case-sensitive)
        return content.length > 0 && !seen.has(content) && seen.add(content);
    });
}


router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { text } = await pdfParse(req.file.buffer);
        // Create document in MongoDB with user ID
        console.log(text)
        const document = new Document({
            filename: req.file.originalname,
            content: text,
            fileSize: req.file.size,
            userId: req.user._id  // Add user ID from auth middleware
        });

        // // Split content into chunks
        const chunks = await splitIntoChunks(text);
        console.log(chunks)
        console.log(`Created ${chunks.length} chunks from document`);
        // Store vectors and get vector IDs
        const vectorIds = await pineconeService.embedAndStore(chunks, document._id.toString());
        
        // Store vector IDs in document
        document.vectorIds = vectorIds;
        await document.save();
        res.status(200).json({
            message: 'File uploaded successfully',
            documentId: document._id
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Error uploading file' });
    }
});

// Get all documents for the user
router.get('/', async (req, res) => {
    try {
        const documents = await Document.find(
            { userId: req.user._id },
            {
                filename: 1,
                uploadDate: 1,
                fileSize: 1
            }
        ).sort({ uploadDate: -1 });
        
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Delete document
router.delete('/:documentId', async (req, res) => {
    try {
        const documentId = req.params.documentId;

        // Find the document and ensure it belongs to the user
        const document = await Document.findOne({
            _id: documentId,
            userId: req.user._id
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete vectors from Pinecone
        await pineconeService.deleteDocumentVectors(documentId);

        // Delete document from MongoDB
        await Document.findByIdAndDelete(documentId);

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Error deleting document' });
    }
});

module.exports = router;