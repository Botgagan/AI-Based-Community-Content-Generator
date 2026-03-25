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
- Keep titles short (3-6 words)
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

export function generatePostsPrompt(input: {
  title: string;
  description: string;
}) {
  return `
You are a professional social media content creator.

Generate exactly 3 posts based on the given theme.

Theme Title: ${input.title}
Theme Description: ${input.description}

Rules:
- Return ONLY JSON array
- Each post must include:
  - title
  - content (5-6 lines)
- Add hashtags in LAST line
- Professional + engaging tone
- No explanations
- Use escaped newlines in content (\\n), not raw line breaks inside JSON strings

Format:
[
  {
    "title": "Post title",
    "content": "Line1\\nLine2\\nLine3\\nLine4\\nLine5\\n#tag1 #tag2 #tag3"
  }
]
`;
}
