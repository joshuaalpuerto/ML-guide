export interface Embeddings {
  bigrams: { [key: string]: { [word: string]: number } };
  trigrams: { [key: string]: { [word: string]: number } };
  fourgrams: { [key: string]: { [word: string]: number } };
}

export interface AutocompleteInstance {
  predictNextTokens(phrase: string): string[];
  createCompletionFromPhrase(phrase: string, completion?: string, maxSequence?: number): string;
  preprocessTokensSuggestion(tokens: string[]): string[];
}

export function Autocomplete(embeddings: Embeddings): AutocompleteInstance; 