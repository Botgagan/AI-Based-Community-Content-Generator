import { apifyClient } from "./apify.client";
import axios from "axios";

const WEBSITE_ACTOR_ID = process.env.APIFY_WEBSITE_ACTOR_ID?.trim();
const WEBSITE_MAX_ITEMS = Number(process.env.APIFY_WEBSITE_MAX_ITEMS);
const APIFY_USE_PROXY = process.env.APIFY_USE_PROXY !== "false";
const APIFY_PROXY_GROUPS = (process.env.APIFY_PROXY_GROUPS || "")
  .split(",")
  .map((group) => group.trim())
  .filter(Boolean);
const WEBSITE_LIMIT = WEBSITE_MAX_ITEMS || 2;

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

// ✅ Improved cleaning
function cleanText(text: string): string {
  return text
    .replace(/(subscribe|login|sign up|advertisement|cookie|privacy)/gi, "")
    .replace(/(const|function|var|let|window\.|document\.)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return stripHtml(titleMatch?.[1] || "").slice(0, 300);
}

async function scrapeWebsiteViaHttp(url: string) {
  const response = await axios.get<string>(url, {
    timeout: 20000,
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  const html = typeof response.data === "string" ? response.data : "";
  if (!html.trim()) return [];

  const title = extractTitle(html);

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  // ✅ REMOVE SCRIPT CONTENT FIRST
  const cleaned = bodyContent
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const text = cleanText(stripHtml(cleaned)).slice(0, 3000);

  if (!title && !text) return [];

  return [{ url, title, text, source: "http-fallback" }];
}

export async function scrapeWebsite(url: string) {
  if (!url) return [];
  if (!WEBSITE_ACTOR_ID) return [];
  if (!isHttpUrl(url)) return [];

  try {
    const proxyConfiguration = APIFY_USE_PROXY
      ? {
          useApifyProxy: true,
          ...(APIFY_PROXY_GROUPS.length > 0 ? { apifyProxyGroups: APIFY_PROXY_GROUPS } : {}),
        }
      : undefined;

    const run = await apifyClient.actor(WEBSITE_ACTOR_ID!).call({
      startUrls: [{ url }],
      ...(proxyConfiguration ? { proxyConfiguration } : {}),

      useChrome: false,
      maxRequestsPerCrawl: 1,
      maxConcurrency: 1,

      pageFunction: `
        async function pageFunction(context) {
          const { request, page, $, log } = context;

          try {
            if (page) {
              await page.waitForSelector("body", { timeout: 10000 });

              const data = await page.evaluate(() => {
                const title = document.title || "";

                // remove scripts/styles in browser
                document.querySelectorAll("script, style, noscript").forEach(el => el.remove());

                const text = document.body.innerText
                  .replace(/\\s+/g, " ")
                  .trim()
                  .slice(0, 3000);

                return { title, text };
              });

              return { url: request.url, ...data };
            }

            if ($) {
              const title = $("title").text().trim();

              // ✅ REMOVE JUNK BEFORE TEXT EXTRACTION
              $("script, style, noscript").remove();

              const text = $("body")
                .text()
                .replace(/\\s+/g, " ")
                .trim()
                .slice(0, 3000);

              return { url: request.url, title, text };
            }

            log.warning("No page or $ available");

            return { url: request.url, title: "", text: "" };

          } catch (err) {
            return {
              url: request.url,
              title: "",
              text: "",
              error: err.message,
            };
          }
        }
      `,
    });

    if (!run.defaultDatasetId) return [];

    const { items } = await apifyClient
      .dataset(run.defaultDatasetId)
      .listItems({ limit: WEBSITE_LIMIT });

    const limitedItems = items.slice(0, WEBSITE_LIMIT);

    if (
      limitedItems.length > 0 &&
      limitedItems[0].text &&
      limitedItems[0].text.length > 50
    ) {
      return limitedItems;
    }

    console.warn("Apify returned weak/empty content, using fallback...");

  } catch (error) {
    console.warn("Apify failed, using fallback");
  }

  return await scrapeWebsiteViaHttp(url);
}
