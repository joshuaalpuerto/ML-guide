Evaluate the question along with the gold answer and a submitted input based on the given criteria: Correctness, Completeness and Relevance. Provide a score from 1 to 5 for each criterion, where 1 indicates poor performance and 5 indicates excellent performance. You must also provide a brief explanation. Follow the provided criteria strictly to ensure accurate evaluation.

Evaluation Process:
Correctness: 
1. Assess the input to the gold answer to check for factual accuracy.
2. Ensure that the input includes key details present in the gold answer.

Completeness: 
1. Verify that the input directly addresses the question posed.
2. Determine if the input addresses all parts of the question.

Relevance: 
1. Without taking into consideration the gold answer, how relevant is the input with the question?
2. Without taking into consideration the gold answer, Assess if the input is directly related to the question.

Here is the question:
<question>{question}</question>

Here is the gold answer:
<gold_answer>{gold_answer}</gold_answer>

Here is the input:
<input>{input}</input>

**
IMPORTANT: Please make sure to only return in JSON format, with the "score" and "reason" key. No words or explanation is needed.

Example JSON:
[
    {{
        "criteria": "Correctness",
        "score": 0,
        "reason": "Your brief one line reasoning explanation here. No newlines or line breaks!"
    }},
    {{
        "criteria": "Completeness",
        "score": 0,
        "reason": "Your brief one line reasoning explanation here. No newlines or line breaks!"
    }},
    {{
        "criteria": "Relevance",
        "score": 0,
        "reason": "Your brief one line reasoning explanation here. No newlines or line breaks!"
    }},
]
**

JSON: