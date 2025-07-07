import { Autocomplete, Embeddings } from '../autocomplete.js';

interface MessageAccuracy {
  message: string;
  score: number;
}

interface Predictions {
  [key: string]: number;
}

// You'll need to define or import MESSAGES array
// For now, I'll add a placeholder that you can replace
const MESSAGES: string[] = [
  // Add your test messages here
  "Hello world how are you",
  "This is a test message for autocomplete",
  // ... more messages
];

// Messages has \n we will create sentences from those .
// Because in our implementation we reset is the message has \n
// As we don't really need to include the previous paragraph
function preprocessMessage(message: string): string[] {
  const sentences = message.split("\n");
  // Filter out empty strings from the list
  return sentences.map(sentence => sentence.trim()).filter(sentence => sentence);
}

function computeAccuracyFromPrediction(predictions: Predictions): number {
  // Calculate the accuracy
  const totalItems = Object.keys(predictions).length;
  const correctItems = Object.values(predictions).reduce((sum, value) => sum + value, 0);
  return correctItems / totalItems;
}

function overallAccuracy(messagesAccuracy: MessageAccuracy[]): number {
  const scores = messagesAccuracy.map(message => message.score);
  return scores.reduce((sum, score) => sum + score, 0) / messagesAccuracy.length;
}

function main(): void {
  // You'll need to provide the embeddings object for the Autocomplete
  // This should match the structure expected by your autocomplete.js
  const embeddings: Embeddings = {
    bigrams: {},
    trigrams: {},
    fourgrams: {}
    // Load your actual embeddings data here
  };

  const autoCompleteLm = Autocomplete(embeddings);
  const messagesAccuracy: MessageAccuracy[] = [];

  for (let index = 0; index < MESSAGES.length; index++) {
    const message = MESSAGES[index];
    const sentences = preprocessMessage(message);
    const predictions: Predictions = {};

    for (const sentence of sentences) {
      const words = sentence.split(" ");
      
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = words.slice(0, i + 1).join(" ");
        const target = words[i + 1];

        // The JavaScript autocomplete returns an array of words directly
        // Unlike the Python version which expected {tokens: [(word, score), ...]}
        const tokens = autoCompleteLm.predictNextTokens(phrase);

        // Convert all words in the list to lowercase for case-insensitive comparison
        const caseInsensitiveTokens = tokens.map(token => token.toLowerCase());
        const highestPrediction = caseInsensitiveTokens.length > 0 ? caseInsensitiveTokens[0] : null;
        const targetLower = target.toLowerCase();

        // prediction is 100%
        if (targetLower === highestPrediction) {
          // very useful
          predictions[target] = 1;
        } else if (caseInsensitiveTokens.includes(targetLower)) {
          // somewhat useful (its part of the suggestion) but user still needs to type
          predictions[target] = 0.5;
        } else {
          // does not exist
          predictions[target] = 0;
        }
      }
    }

    messagesAccuracy.push({
      message: message,
      score: computeAccuracyFromPrediction(predictions)
    });
  }

  const overall = overallAccuracy(messagesAccuracy);
  console.log(messagesAccuracy);
  console.log(overall);
}

if (require.main === module) {
  main();
}

