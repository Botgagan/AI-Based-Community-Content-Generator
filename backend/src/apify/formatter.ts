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
    .map((w) => `${w.title || ""} ${w.text || ""}`)
    .join("\n")
    .slice(0, 2000);

  const youtubeText = youtube
    .map((v) => `Title: ${v.title} | ${v.description || ""}`)
    .join("\n")
    .slice(0, 1500);

  const twitterText = twitter
    .map((t) => `Tweet: ${t.text}`)
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