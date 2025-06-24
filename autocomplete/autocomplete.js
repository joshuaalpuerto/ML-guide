const MATCH_PUNCTUATION = /\s([?.!,;:])/g;
const MATCH_TERMINATORS = /[.,?!]\s*$/;
const MATCH_CAPITALIZE = /\b[A-Z][a-z]*\b/g;

function Autocomplete(embeddings) {
  return {
    predictNextTokens,
    createCompletionFromPhrase,
    preprocessTokensSuggestion,
  };

  function predictNextTokens(phrase) {
    const words = phrase.split(' ');
    const wordsLength = words?.length;

    if (wordsLength === 1) {
      return _useBigram(phrase);
    } else if (wordsLength === 2) {
      const bigrams = _useBigram(phrase);
      const trigrams = _useTrigram(phrase);

      return [...trigrams, ...bigrams];
    } else if (wordsLength > 2) {
      const bigrams = _useBigram(phrase);
      const trigrams = _useTrigram(phrase);
      const fourgrams = _useFourgram(phrase);

      return [...fourgrams, ...trigrams, ...bigrams];
    } else {
      return [];
    }
  }

  function createCompletionFromPhrase(
    phrase,
    completion = '',
    maxSequence = 2
  ) {
    const suggestedWords = _useFourgram(phrase);

    if (suggestedWords.length === 0) {
      return removeSpaceBeforePunctuation(completion);
    }

    const isNextTokenCapitalize = MATCH_CAPITALIZE.test(suggestedWords[0]);

    // if the phrase contains any terminator sequence(.,!) or it's capitalize
    // there a high probability that its a new sentence/paragraph so just return whatever completion we have.
    if (hasTerminator(phrase) || isNextTokenCapitalize) {
      return removeSpaceBeforePunctuation(completion);
    }

    const nextWord = suggestedWords[0];
    phrase = `${phrase} ${nextWord}`;
    completion += `${nextWord} `;

    return maxSequence === 0
      ? removeSpaceBeforePunctuation(completion)
      : createCompletionFromPhrase(phrase, completion, maxSequence - 1);
  }

  function preprocessTokensSuggestion(tokens) {
    const removePunctuation = (word) =>
      word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');

    const processedWords = tokens
      .map((word) => removePunctuation(word))
      .filter((cleanedWord) => cleanedWord);

    return [...new Set(processedWords)];
  }

  function _useBigram(phrase) {
    const words = phrase.split(' ');
    if (words.length < 1) return [];
    const word = words[words.length - 1];

    const tokens = embeddings.bigrams[word];
    return sortWords(tokens);
  }

  function _useTrigram(phrase, useFallback = false) {
    const words = phrase.split(' ');
    if (words.length < 2) return [];
    const [word1, word2] = words.slice(-2);

    const tokens = embeddings.trigrams[`${word1} ${word2}`];

    if (!tokens && useFallback) {
      return _useBigram(phrase, useFallback);
    }

    return sortWords(tokens);
  }

  function _useFourgram(phrase, useFallback = false) {
    const words = phrase.split(' ');
    if (words.length < 3) return [];
    const [word1, word2, word3] = words.slice(-3);

    const tokens = embeddings.fourgrams[`${word1} ${word2} ${word3}`];

    if (!tokens && useFallback) {
      return _useTrigram(phrase, useFallback);
    }

    return sortWords(tokens);
  }
}

function sortWords(tokens) {
  return Object.entries(tokens || {})
    .sort(([, a], [, b]) => b - a)
    .map(([word]) => word);
}

function removeSpaceBeforePunctuation(word) {
  return word.replace(MATCH_PUNCTUATION, '$1')?.trim();
}

function hasTerminator(phrase) {
  return MATCH_TERMINATORS.test(phrase);
}

module.exports = {
  Autocomplete,
};