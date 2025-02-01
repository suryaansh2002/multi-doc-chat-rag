const express = require('express');
const router = express.Router();
const multer = require('multer');
const Document = require('../models/document');
const { PineconeService } = require('../services/pinecone');
const pdf = require('pdf-parse');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const pineconeService = new PineconeService();

// Upload route
router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Parse PDF content
        const pdfData = await pdf(req.file.buffer);
        const textContent = pdfData.text;

        // Create document in MongoDB
        const document = new Document({
            filename: req.file.originalname,
            content: textContent,
            fileSize: req.file.size
        });

        // Split content into chunks
        const chunks = pineconeService.splitIntoChunks(textContent);

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

// Get all documents
router.get('/', async (req, res) => {
    try {
        const documents = await Document.find({}, {
            filename: 1,
            uploadDate: 1,
            fileSize: 1
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Delete document
router.delete('/:documentId', async (req, res) => {
    try {
        const documentId = req.params.documentId;

        // Find the document
        const document = await Document.findById(documentId);
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