import { openai } from "./llm.service.js";
import { generatePostsPrompt } from "../utils/prompts.js";
import { parsePostResponse } from "../utils/posts.parser.js";

type GeneratePostsInput = {
  title: string;
  description: string;
  temperature?: number;
};

export async function generateAIPosts(input: GeneratePostsInput) {
  const completion = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash",
    temperature: input.temperature ?? 0.7,
    messages: [
      {
        role: "user",
        content: generatePostsPrompt({
          title: input.title,
          description: input.description,
        }),
      },
    ],
  });

  const text = completion.choices[0]?.message?.content || "[]";
  return parsePostResponse(text);
}
