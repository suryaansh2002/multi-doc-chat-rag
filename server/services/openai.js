const { Configuration, OpenAIApi } = require("openai");

class OpenAIService {
  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.client = new OpenAIApi(configuration);
  }

  async createEmbedding(text) {
    const response = await this.client.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  }

  async generateResponse(query, context) {
    const response = await this.client.chat.completions.create({
      model: "gpt-4-turbo-preview",
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
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  }
}

module.exports = { OpenAIService };
