const { QdrantClient } = require("@qdrant/js-client-rest");

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

async function searchKnowledgeBase(query) {
  return {
    query,
    matches: [],
    note: "Qdrant is wired but embeddings/indexing are not enabled yet.",
  };
}

module.exports = { qdrant, searchKnowledgeBase };
