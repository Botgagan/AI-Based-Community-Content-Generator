export type ImageEntityType = "theme" | "post";

export type ImageGenerationJob = {
  entityType: ImageEntityType;
  entityId: string;
};
