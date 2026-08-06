const TRUSTED_FIRE_ALARM_DOMAINS = [
  "nfpa.org",
  "notifier.com",
  "buildings.honeywell.com",
  "docs.johnsoncontrols.com",
  "edwardsfiresafety.com",
  "firelite.com",
  "systemsensoreurope.com",
  "systemsensor.com",
  "ul.com",
  "codes.iccsafe.org",
];

const BLOCKED_DOMAINS = [
  "pinterest.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
];

function normalizeDomain(urlValue) {
  try {
    return new URL(urlValue).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isTrustedDomain(urlValue) {
  const domain = normalizeDomain(urlValue);

  return TRUSTED_FIRE_ALARM_DOMAINS.some(
    (trustedDomain) =>
      domain === trustedDomain ||
      domain.endsWith(`.${trustedDomain}`),
  );
}

function isBlockedDomain(urlValue) {
  const domain = normalizeDomain(urlValue);

  return BLOCKED_DOMAINS.some(
    (blockedDomain) =>
      domain === blockedDomain ||
      domain.endsWith(`.${blockedDomain}`),
  );
}

function cleanResult(result) {
  const url = String(result?.url || "");
  const title = String(result?.title || "Untitled source");
  const content = String(
    result?.content ||
    result?.raw_content ||
    "",
  )
    .replace(/\s+/g, " ")
    .trim();

  return {
    title,
    url,
    domain: normalizeDomain(url),
    content: content.slice(0, 3000),
    score:
      typeof result?.score === "number"
        ? result.score
        : null,
    trusted: isTrustedDomain(url),
  };
}

async function searchWeb(
  query,
  {
    maxResults = 5,
    trustedOnly = false,
    includeDomains = [],
  } = {},
) {
  const webSearchEnabled =
    String(process.env.WEB_SEARCH_ENABLED || "")
      .trim()
      .toLowerCase() === "true";

  if (!webSearchEnabled) {
    return {
      success: false,
      error: "Web search is disabled.",
      results: [],
    };
  }

  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "TAVILY_API_KEY is not configured.",
      results: [],
    };
  }

  const requestedDomains =
    includeDomains.length > 0
      ? includeDomains
      : trustedOnly
        ? TRUSTED_FIRE_ALARM_DOMAINS
        : [];

  const response = await fetch(
    "https://api.tavily.com/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        topic: "general",
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: false,
        include_raw_content: false,
        include_domains: requestedDomains,
      }),
      signal: AbortSignal.timeout(30000),
    },
  );

  const responseText = await response.text();

  let data;

  try {
    data = responseText
      ? JSON.parse(responseText)
      : {};
  } catch {
    return {
      success: false,
      error: "The web-search service returned invalid JSON.",
      details: responseText.slice(0, 500),
      results: [],
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error:
        data?.detail ||
        data?.error ||
        `Web search failed with status ${response.status}.`,
      results: [],
    };
  }

  const results = Array.isArray(data.results)
    ? data.results
        .map(cleanResult)
        .filter((result) => result.url)
        .filter((result) => !isBlockedDomain(result.url))
        .filter((result) =>
          trustedOnly ? result.trusted : true,
        )
    : [];

  return {
    success: true,
    query,
    answer: data.answer || null,
    results,
  };
}

module.exports = {
  searchWeb,
  isTrustedDomain,
  TRUSTED_FIRE_ALARM_DOMAINS,
};
