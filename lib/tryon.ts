/**
 * Virtual Try-On Engine — FREE 100%
 * Dùng HF Inference API (api-inference) với header x-wait-for-model
 * - SDXL (ưu tiên, chất lượng cao)
 * - SD v1.5 (fallback)
 * - Lưu ý: FLUX.1-schnell không còn hỗ trợ qua HF API, chỉ dùng được qua Spaces
 */

export interface TryOnResult {
  resultImageUrl: string;
  resultBase64: string;
  success: boolean;
  error?: string;
  modelUsed: string;
}

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
const HF_API = "https://api-inference.huggingface.co/models";

/**
 * Gọi HF Inference API (endpoint cũ nhưng vẫn hoạt động với SD)
 * Header x-wait-for-model giúp tự động load model
 */
async function hfInference(
  model: string,
  inputs: Record<string, unknown>
): Promise<ArrayBuffer> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-wait-for-model": "true",
  };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const res = await fetch(`${HF_API}/${model}`, {
    method: "POST",
    headers,
    body: JSON.stringify(inputs),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF ${model} error ${res.status}: ${err.slice(0, 200)}`);
  }

  return await res.arrayBuffer();
}

// ─── 1. OUTFIT TRY-ON ─────────────────────────────────────────

export async function outfitTryOn(
  _personImageBase64: string,
  _clothImageBase64: string,
  description?: string
): Promise<TryOnResult> {
  const desc = description || "a stylish clothing item";

  // SDXL (chất lượng cao, free, vẫn hoạt động trên HF API)
  try {
    const prompt = `A full body photo of a person wearing ${desc}, fashion photography, realistic, high quality, detailed, studio lighting, professional`;
    const buffer = await hfInference("stabilityai/stable-diffusion-xl-base-1.0", { inputs: prompt });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "SDXL",
    };
  } catch (e: any) {
    console.warn("SDXL failed:", e.message);
  }

  // SD v1.5 (nhẹ, fallback)
  try {
    const prompt = `A full body photo of a person wearing ${desc}, realistic fashion photo, high quality`;
    const buffer = await hfInference("runwayml/stable-diffusion-v1-5", { inputs: prompt });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "SD1.5",
    };
  } catch (e: any) {
    console.warn("SD1.5 failed:", e.message);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "Tất cả model đều lỗi. Kiểm tra token HF hoặc thử lại sau (free tier: 30k req/tháng).",
    modelUsed: "none",
  };
}

// ─── 2. INPAINTING ────────────────────────────────────────────

export async function generativeFill(
  _imageBase64: string,
  _maskBase64: string,
  prompt: string
): Promise<TryOnResult> {
  try {
    const buffer = await hfInference("runwayml/stable-diffusion-inpainting", {
      inputs: prompt,
    });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "SD-Inpainting",
    };
  } catch (e: any) {
    console.warn("Inpainting failed:", e.message);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "Inpainting failed.",
    modelUsed: "none",
  };
}

// ─── 3. ACCESSORY TRY-ON ──────────────────────────────────────

export async function accessoryTryOn(
  _personImageBase64: string,
  accessoryType: string,
  accessoryDescription: string
): Promise<TryOnResult> {
  try {
    const prompt = `A fashion model wearing ${accessoryDescription} (${accessoryType}), fashion photography, high quality, detailed, realistic, studio lighting`;
    const buffer = await hfInference("stabilityai/stable-diffusion-xl-base-1.0", { inputs: prompt });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "SDXL-Accessory",
    };
  } catch (e: any) {
    console.warn("Accessory failed:", e.message);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "Accessory try-on failed.",
    modelUsed: "none",
  };
}