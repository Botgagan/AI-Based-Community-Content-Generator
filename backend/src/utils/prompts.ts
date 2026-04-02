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

function compactContext(value?: string | null, maxChars = 500) {
  return (value || "").replace(/\s+/g, " ").trim().slice(0, maxChars);
}

function compactPostContentForVisuals(value?: string | null, maxChars = 280) {
  const normalized = compactContext(value, maxChars * 2)
    .replace(/#[\w-]+/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/["'`]/g, "");

  return normalized.slice(0, maxChars);
}

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
- Every post MUST be clearly about the theme "${input.title}" and the community "${communityName}"
- Post title must reference the theme idea directly, not generic social copy and same goes for content
- First 1-2 lines of content must connect theme + community context
- Use scraped context as grounding where useful, but keep claims practical and non-fabricated
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

export function generatePostImagePrompt(input: {
  communityName: string;
  communityDescription: string;
  themeTitle: string;
  themeDescription: string;
  postTitle: string;
  postContent: string;
  scrapedContext?: string | null;
}) {
  const scrapedContext = compactContext(input.scrapedContext, 350);
  const postVisualBrief = compactPostContentForVisuals(input.postContent, 260);

  return `
Create one high-quality image for a social post.

OBJECTIVE
- The scene must logically match the theme and post message.
- The visual should communicate the idea through imagery only.

INPUTS
- Community: ${input.communityName}
- Community context: ${input.communityDescription}
- Theme: ${input.themeTitle}
- Theme description: ${input.themeDescription}
- Post title: ${input.postTitle}
- Post visual brief: ${postVisualBrief || "Not provided"}
- Source context: ${scrapedContext || "Not provided"}

VISUAL DIRECTION
- Use one focused scene with meaningful subject, setting, and action.
- Prefer realistic, believable details over abstract generic art.
- Strong composition for feed use, subject clearly visible.

HARD CONSTRAINTS
- NO text anywhere in image.
- NO letters, words, numbers, slogans, hashtags, captions, logos, UI, watermarks.
- Do not render signs, screens, documents, or products with readable writing.
- Keep objects and background directly relevant to the post meaning.
`.trim();
}
