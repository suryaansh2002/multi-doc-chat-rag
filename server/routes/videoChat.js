const express = require('express');
const router = express.Router();
const { PineconeService } = require('../services/pinecone');
const { OpenAIService } = require('../services/openai');
const Video = require('../models/video');
const auth = require('../middleware/auth');

const pineconeService = new PineconeService();
const openaiService = new OpenAIService();

// Add auth middleware
router.use(auth);

router.post('/query/context', async (req, res) => {
    try {
        const { query, videoIds } = req.body;

        if (!query || !videoIds) {
            return res.status(400).json({ error: 'Invalid request parameters' });
        }
        console.log(req.user, 'user')
        // Verify user has access to these documents
        const videos = await Video.find({
            videoId: { $in: videoIds },
            userId: req.user._id
        });

        console.log(videos, videoIds)

        if (videos.length !== videoIds.length) {
            return res.status(403).json({ error: 'Access denied to one or more documents' });
        }

        // Get relevant context from Pinecone
        const relevantContexts = await pineconeService.queryVectors(query, videoIds);
        // Combine contexts with a maximum length limit
        const maxContextLength = 4000;
        let combinedContext = '';
        let usedContexts = [];

        for (const context of relevantContexts) {
            // if (combinedContext.length + context.text.length <= maxContextLength) {
                combinedContext += context.text + '\n\n';
                usedContexts.push(context);
            // }
        }

        res.json({
            context: combinedContext,
            sources: usedContexts
        });
    } catch (error) {
        console.error('Context fetch error:', error);
        res.status(500).json({ error: 'Error fetching context' });
    }
});

// Second endpoint to get LLM response
router.post('/query/response', async (req, res) => {
    try {
        const { query, context } = req.body;

        if (!query || !context) {
            return res.status(400).json({ error: 'Invalid request parameters' });
        }

        const response = await openaiService.generateResponse(query, context);
        res.json({ response });
    } catch (error) {
        console.error('Response generation error:', error);
        res.status(500).json({ error: 'Error generating response' });
    }
});


module.exports = router;