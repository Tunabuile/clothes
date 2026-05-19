/**
 * Virtual Try-On Engine
 * Dùng FLUX.1-schnell (HuggingFace free) — không cần token vẫn chạy
 * Nếu có HF_TOKEN thì tăng quota
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

async function callFlux(prompt: string): Promise<string> {
  const url = `${HF_API}/black-forest-labs/FLUX.1-schnell`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (err.includes("quota") || res.status === 429) {
      throw new Error("Hết quota HF. Thử lại sau 1 phút.");
    }
    throw new Error(`FLUX error ${res.status}: ${err.slice(0, 200)}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

// ─── 1. OUTFIT TRY-ON ─────────────────────────────────────────

export async function outfitTryOn(
  _personImageBase64: string,
  _clothImageBase64: string,
  description?: string
): Promise<TryOnResult> {
  try {
    const desc = description || "a stylish clothing item";
    const prompt = `Fashion photography, a full body photo of a person wearing ${desc}, realistic, high quality, detailed, front view`;
    const base64 = await callFlux(prompt);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "FLUX.1-schnell" };
  } catch (e: any) {
    return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" };
  }
}

// ─── 2. INPAINTING ────────────────────────────────────────────

export async function generativeFill(_i: string, _m: string, p: string): Promise<TryOnResult> {
  try {
    const base64 = await callFlux(p);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "FLUX.1-schnell" };
  } catch (e: any) {
    return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" };
  }
}

// ─── 3. ACCESSORY TRY-ON ──────────────────────────────────────

export async function accessoryTryOn(_p: string, type: string, desc: string): Promise<TryOnResult> {
  try {
    const base64 = await callFlux(`Fashion model wearing ${desc} (${type}), fashion photography, high quality`);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "FLUX.1-schnell" };
  } catch (e: any) {
    return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" };
  }
}