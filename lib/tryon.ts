/**
 * Virtual Try-On Engine
 * Dùng OpenAI DALL-E 3 (đã nạp tiền) — chất lượng cao
 * Fallback FLUX.1-schnell (HF) nếu DALL-E lỗi
 */

export interface TryOnResult {
  resultImageUrl: string;
  resultBase64: string;
  success: boolean;
  error?: string;
  modelUsed: string;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";

async function callDalle3(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024" }),
  });
  if (!res.ok) {
    const err = await res.text();
    if (err.includes("quota") || res.status === 429) throw new Error("Hết quota OpenAI");
    throw new Error(`DALL-E error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const url = data?.data?.[0]?.url;
  if (!url) throw new Error("DALL-E không trả về ảnh");
  const imgRes = await fetch(url);
  return Buffer.from(await imgRes.arrayBuffer()).toString("base64");
}

async function callFlux(prompt: string): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;
  const res = await fetch("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell", {
    method: "POST", headers, body: JSON.stringify({ inputs: prompt }),
  });
  if (!res.ok) throw new Error(`FLUX error ${res.status}`);
  return Buffer.from(await res.arrayBuffer()).toString("base64");
}

export async function outfitTryOn(_a: string, _b: string, d?: string): Promise<TryOnResult> {
  // Ưu tiên DALL-E 3
  try {
    const base64 = await callDalle3(`Fashion photography, a full body photo of a person wearing ${d || "a stylish clothing item"}, realistic, high quality, detailed, front view, professional fashion modeling`);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "DALL-E 3" };
  } catch (e: any) {
    console.warn("DALL-E failed:", e.message);
  }
  // Fallback FLUX
  try {
    const base64 = await callFlux(`Fashion photography, a person wearing ${d || "stylish clothing"}`);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "FLUX" };
  } catch { /* ignore */ }
  return { resultImageUrl: "", resultBase64: "", success: false, error: "Image gen failed", modelUsed: "none" };
}

export async function generativeFill(_i: string, _m: string, p: string): Promise<TryOnResult> {
  try { const b = await callDalle3(p); return { success: true, resultImageUrl: `data:image/jpeg;base64,${b}`, resultBase64: b, modelUsed: "DALL-E 3" }; }
  catch { return { resultImageUrl: "", resultBase64: "", success: false, error: "Failed", modelUsed: "none" }; }
}

export async function accessoryTryOn(_p: string, t: string, d: string): Promise<TryOnResult> {
  try { const b = await callDalle3(`Fashion model wearing ${d} (${t}), fashion photography, high quality`); return { success: true, resultImageUrl: `data:image/jpeg;base64,${b}`, resultBase64: b, modelUsed: "DALL-E 3" }; }
  catch { return { resultImageUrl: "", resultBase64: "", success: false, error: "Failed", modelUsed: "none" }; }
}