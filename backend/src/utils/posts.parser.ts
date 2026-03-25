type GeneratedPost = {
  title: string;
  content: string;
};

function extractJsonCandidate(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;

  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");

  if (start !== -1 && end !== -1 && end > start) {
    return candidate.slice(start, end + 1);
  }

  return candidate;
}

function escapeControlCharsInsideStrings(input: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (const ch of input) {
    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      if (inString) escaped = true;
      continue;
    }

    if (ch === "\"") {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      if (ch === "\n") {
        result += "\\n";
        continue;
      }
      if (ch === "\r") {
        result += "\\r";
        continue;
      }
      if (ch === "\t") {
        result += "\\t";
        continue;
      }

      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        result += `\\u${code.toString(16).padStart(4, "0")}`;
        continue;
      }
    }

    result += ch;
  }

  return result;
}

export function parsePostResponse(raw: string): GeneratedPost[] {
  const json = extractJsonCandidate(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    parsed = JSON.parse(escapeControlCharsInsideStrings(json));
  }

  const candidateArray =
    Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { posts?: unknown[] }).posts)
        ? (parsed as { posts: unknown[] }).posts
        : null;

  if (!candidateArray) {
    throw new Error("Invalid AI response");
  }

  const normalized = candidateArray
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

  if (normalized.length === 0) {
    throw new Error("AI returned empty posts");
  }

  return normalized.slice(0, 3);
}
