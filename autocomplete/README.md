# N-Gram Autocomplete System

A web-based autocomplete system that uses statistical language modeling with n-gram frequency distributions for next-token prediction.

## 🚀 Features

- **Multi-level N-gram Support**: Uses bigrams (2-word sequences), trigrams (3-word sequences), and 4-grams (4-word sequences)
- **Real-time Autocomplete**: Provides instant word suggestions as you type
- **Hierarchical Prediction**: Falls back from 4-grams → trigrams → bigrams forpredictions
- **Smart Completion**: Generates multi-word completions based on sentence context
- **TAB Navigation**: Use TAB key to accept suggestions quickly
- **Frequency-based Ranking**: Suggestions ranked by statistical occurrence in training data

## 📁 Project Structure

```
autocomplete/
├── index.html              # Main web interface
├── autocomplete.js          # Core autocomplete logic
├── middleware.js            # Vercel Edge middleware
├── package.json            # Dependencies
├── scripts/
│   └── generate_ngram_frequency_distribution.py  # N-gram generation script
└── README.md               # This file
```

## 🛠️ How It Works

### 1. N-Gram Generation
The system analyzes training text data to create frequency distributions:

- **Bigrams**: Track word pairs (e.g., "machine learning")
- **Trigrams**: Track 3-word sequences (e.g., "machine learning algorithm")
- **4-grams**: Track 4-word sequences (e.g., "machine learning algorithm performance")

### 2. Prediction Algorithm
The autocomplete engine uses a hierarchical approach:

1. **4-gram lookup**: For phrases with 3+ words, check 4-gram patterns
2. **Trigram fallback**: If no 4-gram match, use trigram patterns
3. **Bigram fallback**: Final fallback to bigram patterns
4. **Frequency ranking**: Sort suggestions by occurrence frequency

## 🚀 Quick Start

### Prerequisites
- Python 3.7+ (for generating frequency distributions)
- NLTK library
- Web browser
- Basic web server (for serving files)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd autocomplete
   ```

2. **Install Python dependencies**
   ```bash
   pip install nltk
   ```

3. **Prepare your training data**
   Create a JSON file with your text data in this format:
   ```json
   [
     {"content": "Your training text goes here"},
     {"content": "More training text for better predictions"}
   ]
   ```

4. **Generate frequency distributions**
   ```bash
   cd scripts
   python generate_ngram_frequency_distribution.py
   ```

5. **Serve the application**
   ```bash
   # Using Python's built-in server
   python -m http.server 8000
   
   # Or using Node.js
   npx serve .
   ```

6. **Open in browser**
   Navigate to `http://localhost:8000`

## 📊 Usage

1. **Start typing**: Enter at least 3 words to trigger autocomplete
2. **View suggestions**: Word suggestions appear below the input field
3. **Accept suggestions**: Press TAB to accept the first suggestion
4. **Continue typing**: The system adapts to your input context

### Example Usage
```
Input: "machine learning algorithm"
Suggestions: ["performance", "optimization", "implementation"]

Input: "the quick brown"
Suggestions: ["fox", "dog", "cat"]
```

## 🔧 Configuration

### Customizing N-gram Generation

Edit `scripts/generate_ngram_frequency_distribution.py`:

```python
def execute(file_name):
    # Update this path to your data location
    base_path = os.path.join("your_data_path", "datasets")
    
    # Modify data processing according to your JSON structure
    for message in data:
        formatted_text = message["your_content_field"]
        # ... rest of processing
```

### Adjusting Prediction Behavior

Modify `autocomplete.js`:

```javascript
// Change maximum completion length
function createCompletionFromPhrase(phrase, completion = '', maxSequence = 2)

// Adjust minimum words for API request
const shouldRequestToAPI = value?.split(" ")?.length >= 3;
```

## 🎯 Performance Tips

1. **Training Data Quality**: Use clean, well-formatted text data
2. **Data Volume**: More training data = better predictions
3. **Domain Specificity**: Train on domain-specific text for better results
4. **Frequency Thresholds**: Filter low-frequency n-grams to reduce noise

## 🔬 Technical Details

### N-gram Frequency Structure
```json
{
  "bigrams": {
    "machine": {"learning": 150, "vision": 75},
    "learning": {"algorithm": 200, "model": 180}
  },
  "trigrams": {
    "machine learning": {"algorithm": 120, "model": 90},
    "learning algorithm": {"performance": 80, "optimization": 60}
  },
  "fourgrams": {
    "machine learning algorithm": {"performance": 45, "optimization": 30}
  }
}
```

### Prediction Flow
1. User types text → Extract last 1-3 words
2. Query appropriate n-gram level
3. Retrieve candidate words + frequencies
4. Sort by frequency (descending)
5. Filter and present top suggestions

## 🚧 Limitations

- **Cold Start**: Poor performance with unseen word combinations
- **Context Window**: Limited to 4-word context maximum
- **Memory Usage**: Large datasets require substantial memory
- **Static Model**: No real-time learning from user input

## 🔮 Future Enhancements

- **Dynamic Learning**: Update frequencies based on user input
- **Neural Integration**: Combine with transformer models
- **Multi-language Support**: Extend to other languages
- **Semantic Similarity**: Use word embeddings for better fallbacks
- **Personalization**: User-specific autocomplete models


## 🤝 Contributing

All contribution are welcome!
