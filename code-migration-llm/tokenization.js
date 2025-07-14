const WHITESPACE_RE = /^\s+$/;
const CJK_RE =
  /[\u4E00-\u9FFF\u3400-\u4DBF\u3000-\u303F\uFF00-\uFFEF\u30A0-\u30FF\u2E80-\u2EFF\u31C0-\u31EF\u3200-\u32FF\u3300-\u33FF\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;
const NUMERIC_SEQUENCE_RE = /^\d+(?:[.,]\d+)?$/;
const PUNCTUATION_RE = /[.,!?;'"„“”‘’\-(){}[\]<>:/\\|@#$%^&*+=`~]/;
const CACHED_SPLIT_REGEX = new RegExp(`(\\s+|${PUNCTUATION_RE.source}+)`);
// Pattern for spoken words, including accented characters
const ALPHANUMERIC_RE = /^[a-zA-Z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]+$/;

const DEFAULT_AVERAGE_CHARS_PER_TOKEN = 6;

function approximateTokenSize(input) {
  // Early return for empty strings
  if (!input) return 0;

  // Split by whitespace, punctuation, and other special characters
  const tokenizedInput = input.split(CACHED_SPLIT_REGEX).filter(Boolean);

  let tokenCount = 0;
  for (const token of tokenizedInput) {
    let averageCharsPerToken;

    if (WHITESPACE_RE.test(token)) {
      // Don't count whitespace as a token
      continue;
    } else if (CJK_RE.test(token)) {
      // For CJK languages, each character is usually a separate token
      tokenCount += Array.from(token).length;
    } else if (NUMERIC_SEQUENCE_RE.test(token)) {
      // Numeric sequences are often a single token, regardless of length
      tokenCount += 1;
    } else if (token.length <= 3) {
      // Short tokens are often a single token
      tokenCount += 1;
    } else if (PUNCTUATION_RE.test(token)) {
      // Punctuation is often a single token, but multiple punctuations are often split
      tokenCount += token.length > 1 ? Math.ceil(token.length / 2) : 1;
    } else if (ALPHANUMERIC_RE.test(token) || averageCharsPerToken) {
      // Use language-specific average characters per token or default to average
      tokenCount += Math.ceil(token.length / DEFAULT_AVERAGE_CHARS_PER_TOKEN);
    } else {
      // For other characters (like emojis or special characters), or
      // languages like Arabic, Hebrew and Greek, count each as a token
      tokenCount += Array.from(token).length;
    }
  }

  return tokenCount;
}

module.exports = {
  approximateTokenSize,
};
