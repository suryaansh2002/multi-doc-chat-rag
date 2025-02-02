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
        type: String
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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