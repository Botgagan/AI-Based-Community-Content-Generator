import { openai } from "./llm.service.js";
import { generateThemesPrompt } from "../utils/prompts.js";

type GeneratedTheme = {
  title: string;
  description: string;
};

function parseThemeResponse(raw: string): GeneratedTheme[] {
  const trimmed = raw.trim();

  // Handle common model output: fenced JSON blocks
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  const parsed = JSON.parse(candidate);
  if (!Array.isArray(parsed)) {
    throw new Error("Model output is not an array");
  }

  return parsed
    .filter(
      (item): item is GeneratedTheme =>
        !!item &&
        typeof item === "object" &&
        typeof item.title === "string" &&
        typeof item.description === "string"
    )
    .map((item) => ({
      title: item.title.trim(),
      description: item.description.trim(),
    }))
    .filter((item) => item.title.length > 0 && item.description.length > 0);
}

export async function generateAIThemes(content: string) {
  const completion = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash",
    temperature: 0.7,
    messages: [
      {
        role: "user",
        content: generateThemesPrompt(content),
      },
    ],
  });

  const text = completion.choices[0]?.message?.content || "[]";
  return parseThemeResponse(text);
}
