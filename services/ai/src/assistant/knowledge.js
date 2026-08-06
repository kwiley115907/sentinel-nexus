const fs = require("fs");
const path = require("path");

const KNOWLEDGE_ROOT = path.resolve(
  __dirname,
  "../../knowledge",
);

const SUPPORTED_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".json",
]);

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "do",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "what",
  "when",
  "where",
  "which",
  "with",
  "you",
  "your",
]);

function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      SUPPORTED_EXTENSIONS.has(
        path.extname(entry.name).toLowerCase(),
      )
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9#%./_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .filter((word) => {
      return (
        word.length > 1 &&
        !STOP_WORDS.has(word)
      );
    });
}

function titleFromPath(filePath) {
  return path
    .basename(filePath, path.extname(filePath))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function relativeSource(filePath) {
  return path
    .relative(KNOWLEDGE_ROOT, filePath)
    .replace(/\\/g, "/");
}

function splitIntoChunks(content, filePath) {
  const normalizedContent = String(content || "")
    .replace(/\r\n/g, "\n")
    .trim();

  if (!normalizedContent) {
    return [];
  }

  const sections = normalizedContent.split(
    /\n(?=#{1,4}\s+)/g,
  );

  const chunks = [];

  for (const section of sections) {
    const cleanSection = section.trim();

    if (!cleanSection) {
      continue;
    }

    const headingMatch = cleanSection.match(
      /^#{1,4}\s+(.+)$/m,
    );

    const title =
      headingMatch?.[1]?.trim() ||
      titleFromPath(filePath);

    /*
     * Keep each section reasonably small so retrieval can select
     * only the relevant material.
     */
    const maximumLength = 2400;

    for (
      let index = 0;
      index < cleanSection.length;
      index += maximumLength
    ) {
      const chunkText = cleanSection
        .slice(index, index + maximumLength)
        .trim();

      if (!chunkText) {
        continue;
      }

      chunks.push({
        id: `${relativeSource(filePath)}:${index}`,
        title,
        source: relativeSource(filePath),
        text: chunkText,
        normalizedText: normalizeText(chunkText),
        tokens: new Set(tokenize(chunkText)),
      });
    }
  }

  return chunks;
}

function loadKnowledgeBase() {
  const files = walkFiles(KNOWLEDGE_ROOT);
  const chunks = [];

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(
        filePath,
        "utf8",
      );

      chunks.push(
        ...splitIntoChunks(content, filePath),
      );
    } catch (error) {
      console.error(
        `Could not read knowledge file ${filePath}:`,
        error,
      );
    }
  }

  return chunks;
}

function scoreChunk(queryTokens, chunk) {
  if (queryTokens.length === 0) {
    return 0;
  }

  let score = 0;

  for (const token of queryTokens) {
    if (chunk.tokens.has(token)) {
      score += 4;
    }

    if (chunk.normalizedText.includes(token)) {
      score += 1;
    }

    if (
      normalizeText(chunk.title).includes(token)
    ) {
      score += 3;
    }

    if (
      normalizeText(chunk.source).includes(token)
    ) {
      score += 2;
    }
  }

  const exactQuery = queryTokens.join(" ");

  if (
    exactQuery.length > 4 &&
    chunk.normalizedText.includes(exactQuery)
  ) {
    score += 12;
  }

  return score;
}

function searchKnowledge(
  query,
  {
    limit = 4,
    minimumScore = 3,
  } = {},
) {
  const queryTokens = tokenize(query);
  const knowledge = loadKnowledgeBase();

  return knowledge
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(queryTokens, chunk),
    }))
    .filter((chunk) =>
      chunk.score >= minimumScore,
    )
    .sort((first, second) =>
      second.score - first.score,
    )
    .slice(0, limit)
    .map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      source: chunk.source,
      text: chunk.text,
      score: chunk.score,
    }));
}

function knowledgeStats() {
  const files = walkFiles(KNOWLEDGE_ROOT);
  const chunks = loadKnowledgeBase();

  return {
    root: KNOWLEDGE_ROOT,
    fileCount: files.length,
    chunkCount: chunks.length,
    files: files.map(relativeSource),
  };
}

module.exports = {
  searchKnowledge,
  knowledgeStats,
};
