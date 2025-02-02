const express = require('express');
const router = express.Router();
const { PineconeService } = require('../services/pinecone');
const { OpenAIService } = require('../services/openai');
const Document = require('../models/document');
const auth = require('../middleware/auth');

const pineconeService = new PineconeService();
const openaiService = new OpenAIService();

// Add auth middleware
router.use(auth);

router.post('/query', async (req, res) => {
    try {
        const { query, documentIds } = req.body;

        if (!query || !documentIds || !Array.isArray(documentIds)) {
            return res.status(400).json({ error: 'Invalid request parameters' });
        }

        // Verify user has access to these documents
        const documents = await Document.find({
            _id: { $in: documentIds },
            userId: req.user._id
        });

        if (documents.length !== documentIds.length) {
            return res.status(403).json({ error: 'Access denied to one or more documents' });
        }

        // Get relevant context from Pinecone
        const relevantContexts = await pineconeService.queryVectors(query, documentIds);

        // Combine contexts with a maximum length limit
        const maxContextLength = 4000; // Adjust based on your needs
        let combinedContext = '';
        let usedContexts = [];

        for (const context of relevantContexts) {
            if (combinedContext.length + context.text.length <= maxContextLength) {
                combinedContext += context.text + '\n\n';
                usedContexts.push(context);
            }
        }

        // Generate response using OpenAI service
        const response = await openaiService.generateResponse(query, combinedContext);

        res.json({
            response,
            sources: usedContexts
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Error processing chat query' });
    }
});

module.exports = router;