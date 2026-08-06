function formatWebResults(searchResponse) {
  if (!searchResponse?.success) {
    return {
      success: false,
      reply:
        searchResponse?.error ||
        "The web search could not be completed.",
      sources: [],
    };
  }

  const results = Array.isArray(searchResponse.results)
    ? searchResponse.results
    : [];

  if (results.length === 0) {
    return {
      success: true,
      reply:
        "I searched the web but did not find a reliable source that answered the question.",
      sources: [],
    };
  }

  const sourceSections = results.map(
    (result, index) => {
      const trustLabel = result.trusted
        ? "Official or trusted domain"
        : "Unverified domain";

      return [
        `[${index + 1}] ${result.title}`,
        `Domain: ${result.domain}`,
        `Status: ${trustLabel}`,
        result.content ||
          "No searchable excerpt was returned.",
      ].join("\n");
    },
  );

  return {
    success: true,
    reply: [
      "Web research results:",
      "",
      ...sourceSections,
      "",
      "Review the original source before using the information for design, installation, programming, testing, or AHJ submission.",
    ].join("\n\n"),
    sources: results.map((result, index) => ({
      number: index + 1,
      title: result.title,
      url: result.url,
      domain: result.domain,
      trusted: result.trusted,
    })),
  };
}

module.exports = {
  formatWebResults,
};
