export function formatScrapedData({
  website,
  youtube,
  twitter,
}: {
  website: any[];
  youtube: any[];
  twitter: any[];
}) {
  const websiteText = website
    .map((w) => {
      const title = w.title || "";
      const text = w.text || w.markdown || w.description || w.content || "";
      return `${title} ${text}`.trim();
    })
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000);

  const youtubeText = youtube
    .map((v) => {
      const title = v.title || v.name || "";
      const description = v.description || v.text || v.fullText || v.full_text || "";
      if (!title && !description) return "";
      return `Title: ${title}${description ? ` | ${description}` : ""}`;
    })
    .filter(Boolean)
    .join("\n")
    .slice(0, 1500);

  const twitterText = twitter
    .map((t) => {
      const text = t.text || t.fullText || t.full_text || t.description || "";
      return text ? `Tweet: ${text}` : "";
    })
    .filter(Boolean)
    .join("\n")
    .slice(0, 1500);

  return `
WEBSITE:
${websiteText}

YOUTUBE:
${youtubeText}

TWITTER:
${twitterText}
`;
}
