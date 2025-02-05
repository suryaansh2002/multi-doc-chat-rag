
function splitIntoChunks(text) {
    // Clean text while preserving structure
    const cleanText = cleanProcessText(text);

    // Segment text into sentences
    const sentences = segmentSentences(cleanText);

    // Chunking configuration
    const chunkSize = 512;  // Approximate token limit per chunk
    const chunkOverlap = 50; // Overlap to maintain context

    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const sentenceSize = estimateTokenCount(sentence);

        // If adding the sentence exceeds chunk size, finalize the current chunk
        if (currentSize + sentenceSize > chunkSize) {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.join(' '));
            }
            
            // Start a new chunk with overlap
            const overlap = currentChunk.slice(-chunkOverlap).join(' ');
            currentChunk = overlap ? [overlap, sentence] : [sentence];
            currentSize = estimateTokenCount(overlap) + sentenceSize;
        } else {
            // Add sentence to the current chunk
            currentChunk.push(sentence);
            currentSize += sentenceSize;
        }
    }

    // Add the last chunk if non-empty
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }

    return postProcessChunks(chunks);
}

// Helper function to segment text into sentences
function segmentSentences(text) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    return Array.from(segmenter.segment(text), seg => seg.segment.trim()).filter(Boolean);
}

// Simple function to estimate token count
function estimateTokenCount(text) {
    return text.split(/\s+/).length; // Roughly count words as tokens
}

// Clean text while preserving structure
function cleanProcessText(text) {
    return text
        .replace(/\r\n/g, '\n') // Normalize line breaks
        .replace(/(\n\s*){2,}/g, '\n\n') // Preserve paragraph breaks
        .replace(/[^\S\n]+/g, ' ') // Collapse multiple spaces
        .trim();
}

// Remove empty chunks and duplicates
function postProcessChunks(chunks) {
    const seen = new Set();
    return chunks.filter(chunk => {
        const content = chunk.trim();
        return content.length > 0 && !seen.has(content) && seen.add(content);
    });
}


module.exports = { splitIntoChunks }