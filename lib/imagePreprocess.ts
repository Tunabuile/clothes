/**
 * Image Preprocessing cho Virtual Try-On
 * - Xóa background — FREE qua HuggingFace router
 * - Graceful fallback nếu API lỗi
 */

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
const HF_ROUTER = "https://router.huggingface.co/hf-inference/models";

/**
 * Xóa background khỏi ảnh người dùng (RMBG-1.4)
 * Dùng router endpoint mới của HF
 * Nếu lỗi → trả về ảnh gốc (không xóa bg), app vẫn chạy
 */
export async function removeBackground(
  imageBase64: string
): Promise<string> {
  const base64Data = imageBase64.includes(",")
    ? imageBase64.split(",")[1]
    : imageBase64;

  // Thử endpoint router trước
  const endpoints = [
    "https://router.huggingface.co/hf-inference/models/briaai/RMBG-1.4",
    "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
        },
        body: Buffer.from(base64Data, "base64"),
      });

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const resultBase64 = Buffer.from(buffer).toString("base64");
        return `data:image/png;base64,${resultBase64}`;
      }

      // Nếu 404 hoặc model not found → thử endpoint khác
      const errText = await response.text();
      if (response.status === 404 || errText.includes("Cannot POST")) {
        continue;
      }
      
      // Các lỗi khác (429 quota, 503, ...) → log và fallback
      console.warn(`RMBG endpoint ${url} error ${response.status}`);
      return imageBase64;
    } catch (e) {
      console.warn(`RMBG endpoint ${url} failed:`, e);
      continue;
    }
  }

  // Tất cả endpoint đều fail → return ảnh gốc
  console.warn("RMBG: all endpoints failed, using original image");
  return imageBase64;
}

/**
 * Dùng Groq (free) để tối ưu prompt tiếng Anh cho FLUX/SD
 */
export async function optimizePrompt(rawPrompt: string): Promise<string> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return rawPrompt;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a prompt engineer for fashion image generation. Convert user prompts into detailed English prompts for FLUX/SD models. Return ONLY the optimized prompt, no explanation." },
          { role: "user", content: rawPrompt },
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });
    if (!response.ok) return rawPrompt;
    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || rawPrompt;
  } catch {
    return rawPrompt;
  }
}

/**
 * Tiền xử lý ảnh người trước try-on
 * Nếu xóa bg fail → vẫn dùng ảnh gốc, app không crash
 */
export async function preprocessPersonImage(imageBase64: string): Promise<string> {
  try {
    const processed = await removeBackground(imageBase64);
    return processed;
  } catch (e) {
    console.warn("Preprocess failed, using original image:", e);
    return imageBase64;
  }
}