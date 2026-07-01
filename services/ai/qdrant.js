const { QdrantClient } = require("@qdrant/js-client-rest");

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

async function searchCodeDocs(query) {
  return {
    query,
    matches: [],
    note: "Qdrant search scaffold ready. Add embeddings next.",
  };
}

module.exports = { qdrant, searchCodeDocs };
