import { openai } from "./llm.service.js";

type OpenRouterImageEntry = {
  image_url?: { url?: string };
  imageUrl?: { url?: string };
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      images?: OpenRouterImageEntry[];
    };
  }>;
};

function getConfiguredImageModels() {
  const configured = process.env.IMAGE_MODEL?.trim();
  const fallback = (process.env.IMAGE_FALLBACK_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  const preferred = configured || "openai/gpt-image-1";
  return Array.from(new Set([preferred, ...fallback]));
}

function getImageAspectRatio() {
  return process.env.IMAGE_ASPECT_RATIO?.trim() || "1:1";
}

function extractBase64FromDataUrl(dataUrl: string) {
  const marker = "base64,";
  const index = dataUrl.indexOf(marker);
  if (index === -1) return null;
  return dataUrl.slice(index + marker.length);
}

function hasNoEndpointError(responseText: string) {
  return responseText.toLowerCase().includes("no endpoints found");
}

async function requestOpenRouterImage(params: {
  model: string;
  prompt: string;
  includeImageConfig: boolean;
  modalities: Array<"image" | "text">;
}) {
  const body: Record<string, unknown> = {
    model: params.model,
    messages: [
      {
        role: "user",
        content: params.prompt,
      },
    ],
    modalities: params.modalities,
  };

  if (params.includeImageConfig) {
    body.image_config = {
      aspect_ratio: getImageAspectRatio(),
    };
  }

  try {
    const completion = await openai.chat.completions.create(body as never);
    return { ok: true as const, payload: completion as unknown as OpenRouterResponse };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    return { ok: false as const, text: message };
  }
}

function extractImageDataUrl(payload: OpenRouterResponse) {
  const firstImage = payload.choices?.[0]?.message?.images?.[0];
  return firstImage?.image_url?.url || firstImage?.imageUrl?.url || null;
}

export async function generateImageBase64(prompt: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const models = getConfiguredImageModels();
  const requestErrors: string[] = [];

  for (const model of models) {
    const attempts: Array<{
      includeImageConfig: boolean;
      modalities: Array<"image" | "text">;
      label: string;
    }> = [
      {
        includeImageConfig: true,
        modalities: ["image", "text"],
        label: "image+text with image_config",
      },
      {
        includeImageConfig: false,
        modalities: ["image", "text"],
        label: "image+text",
      },
      {
        includeImageConfig: false,
        modalities: ["image"],
        label: "image-only",
      },
    ];

    for (const attempt of attempts) {
      const result = await requestOpenRouterImage({
        model,
        prompt,
        includeImageConfig: attempt.includeImageConfig,
        modalities: attempt.modalities,
      });

      if (!result.ok) {
        if (hasNoEndpointError(result.text)) {
          requestErrors.push(`[${model} ${attempt.label}] ${result.text}`);
          break;
        }

        requestErrors.push(`[${model} ${attempt.label}] ${result.text}`);
        continue;
      }

      const dataUrl = extractImageDataUrl(result.payload);
      if (!dataUrl) {
        requestErrors.push(`[${model} ${attempt.label}] OpenRouter returned no image data URL`);
        continue;
      }

      const base64 = extractBase64FromDataUrl(dataUrl);
      if (!base64) {
        requestErrors.push(
          `[${model} ${attempt.label}] OpenRouter image URL is not a base64 data URL`
        );
        continue;
      }

      if (model !== models[0]) {
        console.info(`[image.generator] using fallback model ${model}`);
      }
      return base64;
    }
  }

  throw new Error(
    `OpenRouter image request failed for models [${models.join(", ")}]: ${requestErrors.join(
      " | "
    )}`
  );
}
