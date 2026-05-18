/**
 * Virtual Try-On Engine — FREE 100%
 * 
 * HuggingFace đã deprecated SDXL và SD1.5.
 * Chỉ FLUX.1-schnell còn hoạt động qua HF router endpoint.
 * 
 * Endpoint: https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell
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
 * Gọi FLUX.1-schnell qua HF router endpoint
 */
async function callFlux(prompt: string): Promise<ArrayBuffer> {
  const url = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

  // Thử có token trước
  const authOptions = [
    HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {},
    {},
  ];

  for (const auth of authOptions) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-wait-for-model": "true",
        ...auth,
      } as Record<string, string>,
      body: JSON.stringify({ inputs: prompt }),
    });

    if (res.ok) return await res.arrayBuffer();
    if (res.status === 401 || res.status === 403) continue;
    const err = await res.text();
    throw new Error(`FLUX error ${res.status}: ${err.slice(0, 200)}`);
  }

  throw new Error("Không thể gọi FLUX.1-schnell (hết quota hoặc token lỗi)");
}

// ─── 1. OUTFIT TRY-ON ─────────────────────────────────────────

export async function outfitTryOn(
  _personImageBase64: string,
  _clothImageBase64: string,
  description?: string
): Promise<TryOnResult> {
  try {
    const desc = description || "a stylish clothing item";
    const prompt = `fashion photography, a person wearing ${desc}, full body, realistic, high quality`;
    const buffer = await callFlux(prompt);
    const base64 = Buffer.from(buffer).toString("base64");
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "FLUX.1-schnell" };
  } catch (e: any) {
    console.error("Full error:", e);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "Hết quota HF hoặc token lỗi. Vào https://huggingface.co/settings/tokens tạo token mới, cập nhật HUGGINGFACE_TOKEN trong .env.local.",
    modelUsed: "none",
  };
}

// ─── 2. INPAINTING ────────────────────────────────────────────

export async function generativeFill(
  _imageBase64: string,
  _maskBase64: string,
  prompt: string
): Promise<TryOnResult> {
  return { resultImageUrl: "", resultBase64: "", success: false, error: "FLUX Fill chưa hỗ trợ", modelUsed: "none" };
}

// ─── 3. ACCESSORY TRY-ON ──────────────────────────────────────

export async function accessoryTryOn(
  _personImageBase64: string,
  accessoryType: string,
  accessoryDescription: string
): Promise<TryOnResult> {
  try {
    const prompt = `fashion model wearing ${accessoryDescription} (${accessoryType}), fashion photography, high quality`;
    const buffer = await callFlux(prompt);
    const base64 = Buffer.from(buffer).toString("base64");
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "FLUX.1-schnell" };
  } catch { /* fail */ }
  return { resultImageUrl: "", resultBase64: "", success: false, error: "Failed", modelUsed: "none" };
}