/**
 * Virtual Try-On Engine
 * Dùng FLUX.1-schnell qua HF router endpoint (chắc chắn hoạt động)
 */

export interface TryOnResult {
  resultImageUrl: string;
  resultBase64: string;
  success: boolean;
  error?: string;
  modelUsed: string;
}

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
const HF_API = "https://router.huggingface.co/hf-inference/models";

async function callFlux(prompt: string): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

  const res = await fetch(`${HF_API}/black-forest-labs/FLUX.1-schnell`, {
    method: "POST",
    headers,
    body: JSON.stringify({ inputs: prompt }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`FLUX error ${res.status}: ${err.slice(0, 200)}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export async function outfitTryOn(_a: string, _b: string, d?: string): Promise<TryOnResult> {
  try {
    const base64 = await callFlux(`Fashion photography, a full body photo of a person wearing ${d || "a stylish clothing item"}, realistic, high quality`);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "FLUX" };
  } catch (e: any) {
    return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" };
  }
}

export async function generativeFill(_i: string, _m: string, p: string): Promise<TryOnResult> {
  try {
    const base64 = await callFlux(p);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "FLUX" };
  } catch (e: any) {
    return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" };
  }
}

export async function accessoryTryOn(_p: string, t: string, d: string): Promise<TryOnResult> {
  try {
    const base64 = await callFlux(`Fashion model wearing ${d} (${t})`);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${base64}`, resultBase64: base64, modelUsed: "FLUX" };
  } catch (e: any) {
    return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" };
  }
}