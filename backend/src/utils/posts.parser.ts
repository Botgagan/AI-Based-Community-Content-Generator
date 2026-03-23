type GeneratedPost = {
  title: string;
  content: string;
};

export function parsePostResponse(raw: string): GeneratedPost[] {
  const trimmed = raw.trim();

  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const json = match ? match[1].trim() : trimmed;

  const parsed = JSON.parse(json);

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid AI response");
  }

  return parsed
    .filter(
      (p): p is GeneratedPost =>
        p &&
        typeof p.title === "string" &&
        typeof p.content === "string"
    )
    .map((p) => ({
      title: p.title.trim(),
      content: p.content.trim(),
    }));
}