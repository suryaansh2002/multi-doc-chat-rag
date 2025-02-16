// Helper to get overlapping sentences within token limit
function getOverlapSentences(sentences, maxOverlapTokens) {
    let accumulatedTokens = 0;
    const overlap = [];
    // Iterate from last sentence backwards
    for (let i = sentences.length - 1; i >= 0; i--) {
        const tokens = estimateTokenCount(sentences[i]);
        if (accumulatedTokens + tokens > maxOverlapTokens) break;
        overlap.unshift(sentences[i]);
        accumulatedTokens += tokens;
    }
    return overlap;
}

// Sentence segmentation using Intl.Segmenter
function segmentSentences(text) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
    return Array.from(segmenter.segment(text), s => s.segment.trim()).filter(Boolean);
}

// Simple token estimation (words)
function estimateTokenCount(text) {
    return text.split(/\s+/).filter(t => t.length > 0).length;
}

// Clean text while preserving structure
function cleanProcessText(text) {
    return text
        .replace(/\r\n/g, '\n')         // Normalize line breaks
        .replace(/(\n\s*){2,}/g, '\n\n') // Preserve paragraph breaks
        .replace(/[^\S\n]+/g, ' ')       // Collapse multiple spaces
        .trim();
}

// Remove empty chunks only
function postProcessChunks(chunks) {
    return chunks.filter(chunk => chunk.trim().length > 0);
}

function splitIntoChunks(text) {
    const cleanText = cleanProcessText(text);
    const sections = splitIntoSections(cleanText);
    const chunkSize = 512;
    const chunkOverlap = 50;

    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionTokens = estimateTokenCount(section);

        if (currentSize + sectionTokens > chunkSize) {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.join('\n\n'));
                
                // Smart overlap: Take last N% of current chunk instead of fixed tokens
                const overlapContent = getStructuralOverlap(currentChunk, 0.2); // 20% overlap
                currentChunk = [overlapContent];
                currentSize = estimateTokenCount(overlapContent);
            }
            
            // Add section to new chunk if it fits
            if (sectionTokens <= chunkSize) {
                currentChunk.push(section);
                currentSize += sectionTokens;
            }
        } else {
            currentChunk.push(section);
            currentSize += sectionTokens;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
    }

    return chunks.filter(chunk => chunk.trim().length > 0);
}

// Split text into logical sections based on headings
function splitIntoSections(text) {
    const sectionPattern = /([A-Z]+\n-+\n|[A-Z ]+:\n|•)/g;
    return text.split(sectionPattern)
        .filter(section => section && !section.match(sectionPattern))
        .reduce((acc, val, i, arr) => {
            if (i % 2 === 0) acc.push(val + (arr[i+1] || ''));
            return acc;
        }, []);
}

// Get overlap that respects section boundaries
function getStructuralOverlap(chunks, overlapRatio) {
    const fullText = chunks.join('\n\n');
    const targetTokens = Math.floor(overlapRatio * estimateTokenCount(fullText));
    
    let overlap = [];
    let tokenCount = 0;
    
    // Work backwards through sections
    for (let i = chunks.length - 1; i >= 0; i--) {
        const sectionTokens = estimateTokenCount(chunks[i]);
        if (tokenCount + sectionTokens > targetTokens) break;
        overlap.unshift(chunks[i]);
        tokenCount += sectionTokens;
    }
    
    return overlap.join('\n\n');
}

// Keep other helper functions the same
module.exports = { splitIntoChunks };