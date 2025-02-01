const express = require('express');
const router = express.Router();
const { PineconeService } = require('../services/pinecone');
const { OpenAIService } = require('../services/openai');

const pineconeService = new PineconeService();
const openaiService = new OpenAIService();

router.post('/query', async (req, res) => {
    try {
        const { query, documentIds } = req.body;

        if (!query || !documentIds || !Array.isArray(documentIds)) {
            return res.status(400).json({ error: 'Invalid request parameters' });
        }

        // Get relevant context from Pinecone
        const relevantContexts = await pineconeService.queryVectors(query, documentIds);

        // Combine contexts
        const combinedContext = relevantContexts
            .map(context => context.text)
            .join('\n\n');

        // Generate response using OpenAI
        const response = await openaiService.generateResponse(query, combinedContext);

        res.json({
            response,
            sources: relevantContexts
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Error processing chat query' });
    }
});

module.exports = router;