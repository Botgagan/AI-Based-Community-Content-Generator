/* =========================================================
   THEME GENERATION PROMPT
========================================================= */

export const generateThemesPrompt = (content: string) => `
You are an expert social media strategist.

Your task is to generate HIGH-QUALITY content themes based on the data below.

--------------------------------------
DATA:
${content}
--------------------------------------

INSTRUCTIONS:

- Generate exactly 10 themes
- Each theme should be unique
- Themes should be relevant to the content
- Keep titles short (3–6 words)
- Descriptions should be clear and engaging (1 sentence)

STRICT OUTPUT FORMAT:

Return ONLY a JSON array.
DO NOT include any explanation.
DO NOT include any text before or after JSON.

Example:

[
  {
    "title": "Community Awareness",
    "description": "Spread awareness about key initiatives and impact."
  }
]
`;