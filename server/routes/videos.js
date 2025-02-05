const express = require('express');
const router = express.Router();
const { OpenAIService } = require('../services/openai');
const { PineconeService } = require('../services/pinecone');
const { getVideoTranscript, getVideoDetails } = require('../services/youtube');
const Video = require('../models/video');
const {splitIntoChunks} = require('../services/utils')

const openAIService = new OpenAIService();
const pineconeService = new PineconeService();
const fs = require('fs');

// Endpoint to process a new video
router.post('/', async (req, res) => {
  try {
    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ error: 'Missing videoId' });
    // Fetch video details and transcript
    let details = await getVideoDetails(videoId);
    const transcript = await getVideoTranscript(videoId);
    if (!transcript) return res.status(400).json({ error: 'Transcript not available' });

    console.log("Transcript Generated. Length: ", transcript.length)
    // Generate summary
    const summary = await openAIService.generateSummary(transcript);
    console.log("Summary Generated. Length: ", summary.length)
    details  = {
        ...details, 
        transcript, 
        summary
    }

    const chunks = splitIntoChunks(details.transcript);
    console.log("Chunks: ", chunks.length)
    const vectorIds = await pineconeService.embedAndStore(chunks, videoId);

    // Save to MongoDB
    const video = new Video({ videoId, ...details,  vectorIds });
    await video.save();

    res.json({ message: 'Video processed successfully', video });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get all videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get a video by ID
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.id });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to chat with a video
router.post('/:id/chat', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    const video = await Video.findOne({ videoId: req.params.id });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    const matches = await pineconeService.queryVectors(query, [video.videoId]);
    const context = matches.map(m => m.text).join('\n');
    const response = await openAIService.generateResponse(query, context);

    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
    try {
        const videoObjId = req.params.id;

        // Find the document and ensure it belongs to the user
        const document = await Video.findOne({
            _id: videoObjId,
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete vectors from Pinecone
        await pineconeService.deleteDocumentVectors(videoObjId);

        // Delete document from MongoDB
        await Video.findByIdAndDelete(videoObjId);

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Error deleting document' });
    }
});

module.exports = router;
