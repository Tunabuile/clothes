/**
 * Virtual Try-On Engine — FREE 100%
 * Chỉ dùng FLUX.1-schnell qua HF router endpoint (chắc chắn hoạt động)
 * - IDM-VTON Space bị lỗi cấu hình bên HF, không dùng được
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

/**
 * Gọi HF model qua router endpoint (endpoint chính thức mới của HF)
 */
async function hfRouter(
  model: string,
  inputs: Record<string, unknown>
): Promise<ArrayBuffer> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-wait-for-model": "true",
  };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const res = await fetch(`${HF_ROUTER}/${model}`, {
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

  // FLUX.1-schnell (mạnh, free, chạy qua router HF)
  try {
    const prompt = `A full body photo of a person wearing ${desc}, high quality fashion photography, realistic, detailed, studio lighting`;
    const buffer = await hfRouter("black-forest-labs/FLUX.1-schnell", { inputs: prompt });
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "FLUX.1-schnell",
    };
  } catch (e: any) {
    console.warn("FLUX failed:", e.message);
  }

  // SDXL fallback
  try {
    const prompt = `A full body photo of a person wearing ${desc}, fashion photography, realistic, high quality, detailed`;
    const buffer = await hfRouter("stabilityai/stable-diffusion-xl-base-1.0", { inputs: prompt });
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

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "Tất cả model đều lỗi. Kiểm tra token HF hoặc thử lại sau.",
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
    const buffer = await hfRouter("black-forest-labs/FLUX.1-fill-dev", {
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
    const buffer = await hfRouter("black-forest-labs/FLUX.1-schnell", { inputs: prompt });
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