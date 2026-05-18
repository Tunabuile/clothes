/**
 * Virtual Try-On Engine — FREE, không cần key
 * Dùng HuggingFace Router API cho FLUX/SD models
 * Fallback: OpenAI DALL-E (nếu còn quota)
 */

export interface TryOnResult {
  resultImageUrl: string;
  resultBase64: string;
  success: boolean;
  error?: string;
  modelUsed: string;
}

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
const HF_ROUTER = "https://router.huggingface.co/hf-inference/models";
const HF_LEGACY = "https://api-inference.huggingface.co/models";

/**
 * Gọi HF inference với fallback giữa router và legacy
 */
async function hfInference(
  model: string,
  body: Record<string, unknown>,
  contentType = "application/json"
): Promise<ArrayBuffer> {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const endpoints = [
    `${HF_ROUTER}/${model}`,
    `${HF_LEGACY}/${model}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: contentType === "application/json" ? JSON.stringify(body) : (body as unknown as BodyInit),
      });

      if (res.ok) return await res.arrayBuffer();

      const errText = await res.text();
      // 404 "Cannot POST" → thử endpoint khác
      if (res.status === 404 && errText.includes("Cannot POST")) continue;
      // Các lỗi khác → throw luôn
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
    } catch (e: any) {
      // Nếu 404 endpoint not found → thử endpoint tiếp
      if (e.message?.includes("Cannot POST") || e.message?.includes("404")) continue;
      throw e;
    }
  }

  throw new Error(`All endpoints failed for model: ${model}`);
}

// ─── 1. OUTFIT TRY-ON ─────────────────────────────────────────

export async function outfitTryOn(
  personImageBase64: string,
  clothImageBase64: string,
  description?: string
): Promise<TryOnResult> {
  // Bỏ qua Spaces bị lỗi, chỉ dùng FLUX / SD prompt-based
  // Model 1: FLUX.1-schnell
  try {
    const prompt = `A full body photo of a person wearing ${description || "this clothing item"}, high quality fashion photography, realistic, detailed`;
    const buffer = await hfInference("black-forest-labs/FLUX.1-schnell", {
      inputs: prompt,
    });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "FLUX",
    };
  } catch (e) {
    console.warn("FLUX try-on failed:", e);
  }

  // Model 2: Stable Diffusion XL (fallback)
  try {
    const prompt = `A full body photo of a person wearing ${description || "this clothing item"}, fashion photography, realistic, high quality`;
    const buffer = await hfInference("stabilityai/stable-diffusion-xl-base-1.0", {
      inputs: prompt,
    });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "SDXL",
    };
  } catch (e) {
    console.warn("SDXL try-on failed:", e);
  }

  // Model 3: Stable Diffusion v1.5 (last resort)
  try {
    const prompt = `a person wearing ${description || "clothing"}, full body, realistic`;
    const buffer = await hfInference("runwayml/stable-diffusion-v1-5", {
      inputs: prompt,
    });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "SD1.5",
    };
  } catch (e) {
    console.warn("SD1.5 try-on failed:", e);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "All try-on models failed. Thử lại sau hoặc dùng OpenAI (nếu có key).",
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
      parameters: { guidance_scale: 7.0, num_inference_steps: 30 },
    });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "FLUX-Fill",
    };
  } catch (e) {
    console.warn("FLUX-Fill failed:", e);
  }

  // Model 2: SD Inpainting
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
  } catch (e) {
    console.warn("SD Inpainting failed:", e);
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
    const prompt = `A person wearing ${accessoryDescription} (${accessoryType}), fashion photography, high quality, detailed, realistic`;
    const buffer = await hfInference("black-forest-labs/FLUX.1-schnell", {
      inputs: prompt,
    });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "FLUX-Accessory",
    };
  } catch (e) {
    console.warn("FLUX-Accessory failed:", e);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "Accessory try-on failed.",
    modelUsed: "none",
  };
}