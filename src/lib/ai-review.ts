export function buildReviewPrompt(
  code: string,
  problemTitle: string,
  problemDescription: string,
  language: string = "python3"
): string {
  const langFence = language === "golang" ? "go" : "python";
  return `You are a senior software engineer conducting a code review for a DSA interview preparation platform.

## Problem
**Title**: ${problemTitle}
**Description**: ${problemDescription}

## Submitted Code
\`\`\`${langFence}
${code}
\`\`\`

## Required Output (JSON)
Return ONLY valid JSON with this exact structure:
{
  "time_complexity": "O(...)",
  "space_complexity": "O(...)",
  "performance_score": <1-5>,
  "review": {
    "code_quality": "Assessment of naming, readability, idiomatic patterns",
    "edge_cases": "Edge cases handled or missed (empty input, single element, overflow, duplicates)",
    "alternative_approaches": "Other algorithms or data structures that could solve this, with trade-offs",
    "interview_readiness": "Would this pass in a real 45-min coding round? What would an interviewer say?"
  }
}

## Scoring Guide
1 = Incorrect or brute force with bugs
2 = Works but highly suboptimal
3 = Correct with acceptable complexity, minor issues
4 = Clean and optimal, minor style nits
5 = Textbook optimal solution, production quality`;
}
