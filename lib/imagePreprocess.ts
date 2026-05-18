/**
 * Image Preprocessing cho Virtual Try-On
 * - RMBG-1.4 hiện không hoạt động trên HF API (404)
 * - Tạm thời skip xóa background, dùng ảnh gốc
 */

/**
 * Xóa background — hiện không khả dụng do HF thay đổi API
 * Trả về ảnh gốc, app vẫn chạy bình thường
 */
export async function removeBackground(imageBase64: string): Promise<string> {
  return imageBase64;
}

/**
 * Dùng Groq (free) để tối ưu prompt tiếng Anh
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
          { role: "system", content: "You are a prompt engineer for fashion image generation. Convert user prompts into detailed English prompts for SD/FLUX models. Return ONLY the optimized prompt, no explanation." },
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
 */
export async function preprocessPersonImage(imageBase64: string): Promise<string> {
  return imageBase64; // Tạm thời skip preprocessing
}