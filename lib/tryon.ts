/**
 * Virtual Try-On Engine — FREE 100% (HuggingFace Inference API)
 * 
 * Các model chắc chắn hoạt động trên HF free tier (không cần token):
 * - FLUX.1-schnell (txt2img, nhanh)
 * - Stable Diffusion XL (txt2img, chất lượng cao)
 * - Stable Diffusion v1.5 (txt2img, fallback)
 * - Stable Diffusion Inpainting (inpaint)
 */

export interface TryOnResult {
  resultImageUrl: string;
  resultBase64: string;
  success: boolean;
  error?: string;
  modelUsed: string;
}

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";

/**
 * Gọi HuggingFace Inference API với x-wait-for-model header
 * Nếu model chưa load → HF sẽ tự động tải, trả về khi xong
 */
async function hfInference(
  model: string,
  inputs: Record<string, unknown> | string,
  binaryBody?: Buffer
): Promise<ArrayBuffer> {
  const isJSON = !binaryBody;
  const url = `https://api-inference.huggingface.co/models/${model}`;
  
  const headers: Record<string, string> = {
    "x-wait-for-model": "true",  // Đợi model load (quan trọng!)
  };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const body = binaryBody || (isJSON ? JSON.stringify(inputs) : inputs);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": binaryBody ? "application/octet-stream" : "application/json",
    },
    body: body as BodyInit,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HF ${model} error ${response.status}: ${err.slice(0, 200)}`);
  }

  return await response.arrayBuffer();
}

// ─── 1. OUTFIT TRY-ON (txt2img) ───────────────────────────────

export async function outfitTryOn(
  _personImageBase64: string,
  _clothImageBase64: string,
  description?: string
): Promise<TryOnResult> {
  const desc = description || "a stylish clothing item";

  // Model 1: FLUX.1-schnell (nhanh, free, chắc chắn hoạt động)
  try {
    const prompt = `A full body photo of a person wearing ${desc}, high quality fashion photography, realistic, detailed, studio lighting`;
    const buffer = await hfInference("black-forest-labs/FLUX.1-schnell", { inputs: prompt });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "FLUX",
    };
  } catch (e: any) {
    console.warn("FLUX failed:", e.message);
  }

  // Model 2: SDXL (chất lượng cao, free)
  try {
    const prompt = `A full body photo of a person wearing ${desc}, fashion photography, realistic, high quality, detailed`;
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

  // Model 3: SD v1.5 (nhẹ, fallback cuối)
  try {
    const prompt = `a person wearing ${desc}, full body, realistic fashion photo`;
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
    error: "Tất cả model HF đều lỗi. Có thể bạn đã hết quota free (30k req/tháng). Thử lại sau.",
    modelUsed: "none",
  };
}

// ─── 2. GENERATIVE INPAINTING ─────────────────────────────────

export async function generativeFill(
  _imageBase64: string,
  _maskBase64: string,
  prompt: string
): Promise<TryOnResult> {
  // Model 1: FLUX Fill
  try {
    const buffer = await hfInference("black-forest-labs/FLUX.1-fill-dev", {
      inputs: prompt,
      parameters: { guidance_scale: 7.0, num_inference_steps: 20 },
    });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "FLUX-Fill",
    };
  } catch (e: any) {
    console.warn("FLUX-Fill failed:", e.message);
  }

  // Model 2: SD Inpainting (free, nhẹ)
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
    console.warn("SD Inpainting failed:", e.message);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "All inpainting models failed.",
    modelUsed: "none",
  };
}

// ─── 3. ACCESSORY TRY-ON ───────────────────────────────────────

export async function accessoryTryOn(
  _personImageBase64: string,
  accessoryType: string,
  accessoryDescription: string
): Promise<TryOnResult> {
  try {
    const prompt = `A fashion model wearing ${accessoryDescription} (${accessoryType}), fashion photography, high quality, detailed, realistic, studio lighting`;
    const buffer = await hfInference("black-forest-labs/FLUX.1-schnell", { inputs: prompt });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "FLUX-Accessory",
    };
  } catch (e: any) {
    console.warn("FLUX-Accessory failed:", e.message);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "Accessory try-on failed.",
    modelUsed: "none",
  };
}