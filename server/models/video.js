const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    videoId: String,
    
    title: String,
    thumbnail: String,    
    summary: String,
    transcript: String,
    
    vectorIds: [String],
  });

module.exports = mongoose.model('Video', videoSchema);