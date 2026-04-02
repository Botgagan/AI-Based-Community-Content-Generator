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

  const preferred = configured || "black-forest-labs/flux.2-klein-4b";
  const all = Array.from(new Set([preferred, ...fallback]));
  const maxModels = Number(process.env.IMAGE_MAX_MODELS || 2);
  if (!Number.isFinite(maxModels) || maxModels <= 0) return all.slice(0, 2);
  return all.slice(0, maxModels);
}

function getImageAspectRatio() {
  return process.env.IMAGE_ASPECT_RATIO?.trim() || "1:1";
}

function getImageRequestTimeoutMs() {
  const value = Number(process.env.IMAGE_REQUEST_TIMEOUT_MS || 45000);
  if (!Number.isFinite(value) || value <= 0) return 45000;
  return value;
}

function extractBase64FromDataUrl(dataUrl: string) {
  const marker = "base64,";
  const index = dataUrl.indexOf(marker);
  if (index === -1) return null;
  return dataUrl.slice(index + marker.length);
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  let timeout: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms (${label})`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
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
  const timeoutMs = getImageRequestTimeoutMs();
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
        label: "balanced-primary",
      },
      {
        includeImageConfig: false,
        modalities: ["image"],
        label: "balanced-fallback-format",
      },
    ];

    for (const attempt of attempts) {
      const result = await withTimeout(
        requestOpenRouterImage({
          model,
          prompt,
          includeImageConfig: attempt.includeImageConfig,
          modalities: attempt.modalities,
        }),
        timeoutMs,
        `${model} ${attempt.label}`
      );

      if (!result.ok) {
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
