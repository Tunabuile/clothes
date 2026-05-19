/**
 * Virtual Try-On Engine - Chỉ dùng OpenAI DALL-E
 * Nếu key không hỗ trợ DALL-E → báo lỗi rõ ràng
 */

export interface TryOnResult {
  resultImageUrl: string;
  resultBase64: string;
  success: boolean;
  error?: string;
  modelUsed: string;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

async function callDalle(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("Thiếu OPENAI_API_KEY trong .env.local");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024" }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (err.includes("does not exist")) {
      throw new Error("Key OpenAI này không hỗ trợ DALL-E. Cần key có DALL-E 3.");
    }
    throw new Error(`OpenAI error: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const url = data?.data?.[0]?.url;
  if (!url) throw new Error("Không nhận được ảnh từ OpenAI");

  const imgRes = await fetch(url);
  return Buffer.from(await imgRes.arrayBuffer()).toString("base64");
}

export async function outfitTryOn(_a: string, _b: string, d?: string): Promise<TryOnResult> {
  try {
    const b = await callDalle(`Fashion photography, a full body photo of a person wearing ${d || "stylish clothing"}, realistic, high quality`);
    return { success: true, resultImageUrl: `data:image/jpeg;base64,${b}`, resultBase64: b, modelUsed: "DALL-E 3" };
  } catch (e: any) {
    return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" };
  }
}

export async function generativeFill(_i: string, _m: string, p: string): Promise<TryOnResult> {
  try { const b = await callDalle(p); return { success: true, resultImageUrl: `data:image/jpeg;base64,${b}`, resultBase64: b, modelUsed: "DALL-E 3" }; }
  catch (e: any) { return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" }; }
}

export async function accessoryTryOn(_p: string, t: string, d: string): Promise<TryOnResult> {
  try { const b = await callDalle(`Fashion model wearing ${d} (${t}), fashion photography`); return { success: true, resultImageUrl: `data:image/jpeg;base64,${b}`, resultBase64: b, modelUsed: "DALL-E 3" }; }
  catch (e: any) { return { resultImageUrl: "", resultBase64: "", success: false, error: e.message, modelUsed: "none" }; }
}