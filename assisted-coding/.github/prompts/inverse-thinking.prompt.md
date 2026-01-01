---
mode: agent
model: Claude Sonnet 4.5
description: 'Use inverse thinking to identify potential failure modes and generate actionable solutions to mitigate risks.'
---

# Inverse Thinking Brainstorming Prompt

## Goal
- Use inverse thinking methodology to identify potential pitfalls and transform them into actionable solutions.
- Help prevent common mistakes by deliberately thinking about what could go wrong first.
- Generate comprehensive risk mitigation strategies through systematic failure analysis.

## Process

### Step 1: Gather input from user
First, analyze the given context: ${input:context}. If none is provided, prompt the user to specify a clear task, problem, or goal they want to analyze for potential failure modes.

### Step 2: The Failure Analysis
First, please list **10 detailed ways** I could guarantee failure at this ${input:context}. Consider:
- Common mistakes and anti-patterns
- Bad habits that lead to poor outcomes
- Assumptions that typically backfire
- Shortcuts that create long-term problems
- Communication breakdowns
- Process violations
- Technical debt generators
- Surefire ways to make the problem even worse

Think deeply about each failure mode and be specific about how it would manifest.

### Step 3: The Solution Mapping
Next, present your analysis as a **two-column table**:

| Failure Idea | Positive Solution |
|--------------|-------------------|
| The specific way to fail | The inverted, actionable approach to avoid this failure |

In the first column, list each **'Failure Idea'** from Step 1.  
In the second column, **'flip'** that idea to create a positive, actionable solution that prevents or mitigates the failure.

## Requirements (Success Criteria)
- **10 distinct failure scenarios** identified in Step 1
- Each failure idea is specific and detailed (not generic)
- Each solution is actionable and directly addresses its corresponding failure
- Solutions are practical and implementable
- Table format is clear and scannable
- Failures cover multiple dimensions: technical, process, communication, architecture, etc.
- Solutions provide clear guidance on what TO do (not just what NOT to do)

## Output Format

### Step 1: Failure Analysis
1. [Detailed failure scenario 1]
2. [Detailed failure scenario 2]
3. [Detailed failure scenario 3]
4. [Detailed failure scenario 4]
5. [Detailed failure scenario 5]
6. [Detailed failure scenario 6]
7. [Detailed failure scenario 7]
8. [Detailed failure scenario 8]
9. [Detailed failure scenario 9]
10. [Detailed failure scenario 10]

### Step 2: Solution Table

| Failure Idea | Positive Solution |
|--------------|-------------------|
| Failure 1 description | Actionable solution 1 |
| Failure 2 description | Actionable solution 2 |
| Failure 3 description | Actionable solution 3 |
| Failure 4 description | Actionable solution 4 |
| Failure 5 description | Actionable solution 5 |
| Failure 6 description | Actionable solution 6 |
| Failure 7 description | Actionable solution 7 |
| Failure 8 description | Actionable solution 8 |
| Failure 9 description | Actionable solution 9 |
| Failure 10 description | Actionable solution 10 |

## Usage Instructions
1. Clearly state the problem/task you want to analyze
2. Execute Step 1: brainstorm all the ways to fail
3. Execute Step 2: transform failures into solutions
4. Review the solution table to identify priority actions
5. Implement the positive solutions as preventive measures

## Example Application
**Problem**: "I need to implement a new authentication system for our application."

**Step 1 Output**:
1. Skip security audits and rely on homegrown crypto instead of battle-tested libraries
2. Store passwords in plain text or using weak hashing like MD5
3. ...

**Step 2 Output**:
| Failure Idea | Positive Solution |
|--------------|-------------------|
| Skip security audits and use homegrown crypto | Use industry-standard libraries (OAuth 2.0, JWT) and conduct regular security audits |
| Store passwords in plain text or weak hashing | Implement bcrypt/argon2 with proper salting and follow OWASP guidelines |
| ... | ... |
