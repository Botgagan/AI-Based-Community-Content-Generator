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
  communityName?: string;
  communityDescription?: string;
  scrapedContext?: string;
}) {
  const communityName = input.communityName?.trim() || "Not provided";
  const communityDescription =
    input.communityDescription?.trim() || "Not provided";
  const scrapedContext = input.scrapedContext
    ? input.scrapedContext.trim().slice(0, 500)
    : "Not provided";

  return `
You are a professional social media content creator.

Generate exactly 3 posts based on the given context.

Theme Title: ${input.title}
Theme Description: ${input.description}
Community Name: ${communityName}
Community Description: ${communityDescription}
Scraped Context (max 500 chars): ${scrapedContext}

Rules:
- Return ONLY JSON array
- Each post must include:
  - title
  - content (5-6 lines)
- Add hashtags in LAST line
- Professional + engaging tone
- Keep posts aligned with the given community context
- Do not invent facts, names, stats, claims, events, links, or offers not present in the context
- If context is limited, write broadly useful but safe content grounded in the provided theme/community
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

export function generateThemeImagePrompt(input: {
  communityName: string;
  communityDescription: string;
  themeTitle: string;
  themeDescription: string;
  scrapedContext?: string | null;
}) {
  return `
Create a clean, high-quality social media banner image.
Community: ${input.communityName}
Community context: ${input.communityDescription}
Theme title: ${input.themeTitle}
Theme description: ${input.themeDescription}
Scraped context: ${(input.scrapedContext || "").slice(0, 500)}

Instructions:
- Keep visuals relevant to the theme and community mission.
- Avoid random unrelated objects or concepts.
- No text overlays, no logos, no watermarks.
- Professional, modern, and optimistic visual tone.
`.trim();
}

export function generatePostImagePrompt(input: {
  communityName: string;
  communityDescription: string;
  themeTitle: string;
  themeDescription: string;
  postTitle: string;
  postContent: string;
  scrapedContext?: string | null;
}) {
  return `
Create a high-quality social media post image.
Community: ${input.communityName}
Community context: ${input.communityDescription}
Theme: ${input.themeTitle} - ${input.themeDescription}
Post title: ${input.postTitle}
Post content: ${input.postContent}
Scraped context: ${(input.scrapedContext || "").slice(0, 500)}

Instructions:
- The scene must logically match the post message.
- Keep composition clear and focused for feed use.
- No text overlays, no logos, no watermarks.
- Professional and engaging visual style.
`.trim();
}
