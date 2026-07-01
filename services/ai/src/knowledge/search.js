async function searchKnowledgeBase(query) {
  return {
    type: "knowledge-search",
    query,
    matches: [],
    note: "Vector database not connected yet. Add Qdrant later when running on VPS/server.",
  };
}

module.exports = { searchKnowledgeBase };
