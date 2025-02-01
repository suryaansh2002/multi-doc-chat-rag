const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');

class PineconeService {
    constructor() {
        this.pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY
        });

        this.index = this.pc.index(process.env.PINECONE_INDEX_NAME);

        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.embedBatchSize = 100;
        this.upsertBatchSize = 100;
        this.chunkSize = 512;
        this.overlapSize = 50;
    }

    splitIntoChunks(text) {
        // First, ensure we're working with clean text but preserve important line breaks
        const cleanText = text.replace(/\r\n/g, '\n')
                             .replace(/\n\s*\n/g, '\n')  // Remove multiple consecutive line breaks
                             .trim();
    
        // Initialize chunks array
        const chunks = [];
    
        // If text is shorter than chunk size, return it as a single chunk
        if (cleanText.length <= this.chunkSize) {
            return [cleanText];
        }
    
        // Split text into segments based on multiple criteria
        // This regex matches sentences and bullet points
        const segmentPattern = /(?:[^.!?\n]+[.!?]+)|(?:^•[^\n]+$)|(?:^[A-Z][^:\n]+:.*$)/gm;
        let segments = cleanText.match(segmentPattern);
    
        // Fallback to line breaks if regex matching fails
        if (!segments) {
            segments = cleanText.split("\n").filter(line => line.trim().length > 0);
        }
    
        let currentChunk = [];
        let currentLength = 0;
    
        const processCurrentChunk = () => {
            if (currentChunk.length > 0) {
                const chunkText = currentChunk.join(' ').trim();
                if (chunkText.length > 0) {
                    chunks.push(chunkText);
                }
                currentChunk = [];
                currentLength = 0;
            }
        };
    
        for (let i = 0; i < segments.length; i++) {
            let segment = segments[i].trim();
            
            // Skip empty segments
            if (segment.length === 0) continue;
    
            const segmentWords = segment.split(' ');
            const segmentLength = segmentWords.length;
    
            // If adding this segment would exceed chunk size
            if (currentLength + segmentLength > this.chunkSize) {
                // Process current chunk
                processCurrentChunk();
                
                // If the segment itself is too large, split it
                if (segmentLength > this.chunkSize) {
                    let j = 0;
                    while (j < segmentWords.length) {
                        const chunkWords = segmentWords.slice(j, j + this.chunkSize);
                        chunks.push(chunkWords.join(' ').trim());
                        j += (this.chunkSize - this.overlapSize);
                    }
                } else {
                    // Start new chunk with this segment
                    currentChunk = [segment];
                    currentLength = segmentLength;
                }
            } else {
                // Add segment to current chunk
                currentChunk.push(segment);
                currentLength += segmentLength;
            }
    
            // Check if we need to process chunk due to reaching size limit
            if (currentLength >= this.chunkSize - this.overlapSize) {
                processCurrentChunk();
            }
        }
    
        // Process any remaining text
        processCurrentChunk();
    
        // Post-process chunks to remove duplicates and ensure proper content
        return chunks
            .filter((chunk, index, self) => 
                // Remove exact duplicates
                index === self.findIndex((c) => c === chunk))
            .filter(chunk => chunk.trim().length > 0);
    }
        
    async createEmbeddings(texts) {
        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: texts // Send all chunks at once
            });
            console.log(`Generated ${response.data.length} embeddings`);
            return response.data.map(item => item.embedding);
        } catch (error) {
            console.error('Error creating embeddings:', error);
            throw error;
        }
    }

    async embedAndStore(chunks, documentId) {
        try {
            const vectorIds = [];
            console.log(`Processing ${chunks.length} chunks for document ${documentId}`);
            
            // Process embeddings in batches
            for (let i = 0; i < chunks.length; i += this.embedBatchSize) {
                const embeddingBatch = chunks.slice(i, i + this.embedBatchSize);
                console.log(`Creating embeddings for batch ${Math.floor(i/this.embedBatchSize) + 1}`);
                
                const embeddings = await this.createEmbeddings(embeddingBatch);
                
                const vectors = embeddingBatch.map((chunk, index) => ({
                    id: `${documentId}-${i + index}`,
                    values: embeddings[index],
                    metadata: {
                        text: chunk,
                        documentId,
                        chunkIndex: i + index
                    }
                }));

                for (let j = 0; j < vectors.length; j += this.upsertBatchSize) {
                    const upsertBatch = vectors.slice(j, j + this.upsertBatchSize);
                    await this.index.upsert(upsertBatch);
                    vectorIds.push(...upsertBatch.map(v => v.id));
                    
                    console.log(`Upserted vectors ${j + 1} to ${Math.min(j + this.upsertBatchSize, vectors.length)}`);
                    
                    if (j + this.upsertBatchSize < vectors.length) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }

            console.log(`Successfully processed document ${documentId}`);
            return vectorIds;

        } catch (error) {
            console.error('Error in embedAndStore:', error);
            throw error;
        }
    }

     async deleteDocumentVectors(documentId) {
        try {
            console.log(`Deleting vectors for document ${documentId}`);
            
            // First, fetch all vector IDs for this document
            const queryResponse = await this.index.query({
                vector: Array(1536).fill(0), // Zero vector for querying
                filter: {
                    documentId: documentId
                },
                topK: 10000, // Get all vectors for this document
                includeMetadata: false
            });

            if (queryResponse.matches && queryResponse.matches.length > 0) {
                const vectorIds = queryResponse.matches.map(match => match.id);
                
                // Delete vectors in batches to avoid rate limits
                const batchSize = 100;
                for (let i = 0; i < vectorIds.length; i += batchSize) {
                    const batch = vectorIds.slice(i, i + batchSize);
                    await this.index.deleteMany(batch);
                    console.log(`Deleted batch of ${batch.length} vectors`);
                    
                    // Add a small delay between batches
                    if (i + batchSize < vectorIds.length) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }
            
            console.log(`Successfully deleted all vectors for document ${documentId}`);
        } catch (error) {
            console.error('Error deleting document vectors:', error);
            throw error;
        }
    }


    async queryVectors(query, documentIds, limit = 3) {
        try {
            console.log(`Querying vectors for ${documentIds.length} documents`);
            
            const [queryEmbedding] = await this.createEmbeddings([query]);

            const queryResponse = await this.index.query({
                vector: queryEmbedding,
                filter: {
                    documentId: { $in: documentIds }
                },
                topK: limit,
                includeMetadata: true
            });

            const matches = queryResponse.matches
                .sort((a, b) => b.score - a.score)
                .filter((match, index, self) => 
                    index === self.findIndex(m => m.metadata.text === match.metadata.text)
                );

            console.log(`Found ${matches.length} unique matches`);
            return matches.map(match => ({
                text: match.metadata.text,
                score: match.score,
                documentId: match.metadata.documentId,
                chunkIndex: match.metadata.chunkIndex
            }));
        } catch (error) {
            console.error('Error in queryVectors:', error);
            throw error;
        }
    }
}

module.exports = { PineconeService };