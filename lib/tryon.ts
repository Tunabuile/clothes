/**
 * Virtual Try-On Engine
 * - OpenAI DALL-E 3 (khi có quota)
 * - Fallback: báo lỗi nếu hết quota
 */

export interface TryOnResult {
  resultImageUrl: string;
  resultBase64: string;
  success: boolean;
  error?: string;
  modelUsed: string;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const DALL_E_API = "https://api.openai.com/v1/images/generations";

async function callDalle3(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("Thiếu OPENAI_API_KEY trong .env.local");

  const res = await fetch(DALL_E_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 429 || err.includes("insufficient_quota")) {
      throw new Error("Hết quota OpenAI. Vui lòng nạp thêm hoặc đợi.");
    }
    throw new Error(`DALL-E error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const imageUrl = data?.data?.[0]?.url;
  if (!imageUrl) throw new Error("DALL-E không trả về ảnh");
  
  // Fetch image and convert to base64
  const imgRes = await fetch(imageUrl);
  const imgBuffer = await imgRes.arrayBuffer();
  return Buffer.from(imgBuffer).toString("base64");
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
    const base64 = await callDalle3(prompt);
    return {
      success: true,
      resultImageUrl: `data:image/jpeg;base64,${base64}`,
      resultBase64: base64,
      modelUsed: "DALL-E 3",
    };
  } catch (e: any) {
    return {
      resultImageUrl: "",
      resultBase64: "",
      success: false,
      error: e.message,
      modelUsed: "none",
    };
  }
}

// ─── 2. INPAINTING ────────────────────────────────────────────

export async function generativeFill(_i: string, _m: string, p: string): Promise<TryOnResult> {
  try {
    const base64 = await callDalle3(p);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "DALL-E 3" };
  } catch (e: any) {
    return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" };
  }
}

// ─── 3. ACCESSORY TRY-ON ──────────────────────────────────────

export async function accessoryTryOn(_p: string, type: string, desc: string): Promise<TryOnResult> {
  try {
    const base64 = await callDalle3(`Fashion model wearing ${desc} (${type}), fashion photography, high quality`);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "DALL-E 3" };
  } catch (e: any) {
    return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" };
  }
}