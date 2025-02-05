const { Configuration, OpenAIApi } = require('openai');

class OpenAIService {
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.client = new OpenAIApi(configuration);
  }

  async createEmbedding(text) {
    try {
      const response = await this.client.createEmbedding({
        model: "text-embedding-ada-002",
        input: text,
      });
      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  async generateResponse(query, context) {
    try {
      const response = await this.client.createChatCompletion({
        model: "gpt-4-0125-preview", // Base GPT-4, often faster than turbo
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Use the provided context to answer questions accurately. If you're not sure about something, say so. Return your answer in well structured, and formatted markdown.",
          },
          {
            role: "user",
            content: `Context: ${context}\n\nQuestion: ${query}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 400,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }


  async generateSummary(transcript) {
    try {
      const response = await this.client.createChatCompletion({
        model: "gpt-4-0125-preview", // Base GPT-4, often faster than turbo
        messages: [
          {
            role: "system",
            content:
              "Understand the transcript of the video given by the user and generate a short summary of the youtube video. Return your answer in well structured, and formatted markdown.",
          },
          {
            role: "user",
            content: `Transcript: ${transcript}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }
}

module.exports = { OpenAIService };
