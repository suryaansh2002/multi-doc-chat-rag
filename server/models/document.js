const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    vectorIds: [{
        type: String  // Store Pinecone vector IDs
    }],
    uploadDate: {
        type: Date,
        default: Date.now
    },
    fileSize: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Document', documentSchema);