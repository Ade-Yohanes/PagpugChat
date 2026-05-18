import puter from "@heyputer/puter.js";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

/** Puter SDK types listModels() as Record[]; build typed AIModel. */
export function parseAIModel(m: Record<string, unknown>): AIModel | null {
  const { id, name, provider } = m;
  if (typeof id !== "string" || typeof name !== "string" || typeof provider !== "string") {
    return null;
  }
  return { id, name, provider };
}

/**
 * Check if a model supports vision/multimodal capabilities
 * Based on known model names that support image/video analysis
 */
export function modelSupportsVision(modelId: string): boolean {
  if (!modelId || typeof modelId !== 'string') return false;
  
  const visionModels = [
    // GPT Vision models
    'gpt-5.4-nano',
    'gpt-4-vision',
    'gpt-4o',
    'gpt-4o-mini',
    // Claude Vision models
    'claude-sonnet-4',
    'claude-sonnet-4-5',
    'claude-opus-4-5',
    'claude-haiku-4',
    // Gemini Vision models
    'gemini-pro-vision',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ];

  return visionModels.some(visionModel =>
    modelId.toLowerCase().includes(visionModel.toLowerCase())
  );
}

export async function fetchAIModels(): Promise<AIModel[]> {
  const raw = await puter.ai.listModels();
  return raw
    .map(parseAIModel)
    .filter((m): m is AIModel => m !== null);
}
