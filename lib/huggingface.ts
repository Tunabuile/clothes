/**
 * OpenAI (ChatGPT) Integration — có fallback Groq (free)
 * - Ưu tiên OpenAI, nếu lỗi quota (429) thì fallback về Groq
 * - Groq hoàn toàn free, không cần billing, chỉ cần key
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const OPENAI_CHAT_API = "https://api.openai.com/v1/chat/completions";
const OPENAI_IMAGE_API = "https://api.openai.com/v1/images/generations";
const OPENAI_IMAGE_EDIT_API = "https://api.openai.com/v1/images/edits";
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

// ─── OpenAI helpers ─────────────────────────────────────────────

function openaiHeaders() {
  if (!OPENAI_API_KEY) {
    throw new Error("Thiếu OPENAI_API_KEY trong .env.local");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
}

function groqHeaders() {
  if (!GROQ_API_KEY) {
    throw new Error("Thiếu GROQ_API_KEY trong .env.local — đăng ký free tại https://console.groq.com");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${GROQ_API_KEY}`,
  };
}

// ─── Text generation: OpenAI → fallback Groq ────────────────────

async function generateText(
  prompt: string,
  maxTokens = 400
): Promise<string> {
  // Try OpenAI first
  try {
    return await callOpenAIText(prompt, maxTokens);
  } catch (openAIError: any) {
    // If quota error (429), fallback to Groq
    if (openAIError?.message?.includes("429") || openAIError?.message?.includes("insufficient_quota")) {
      console.warn("OpenAI quota exceeded, falling back to Groq");
      return await callGroqText(prompt, maxTokens);
    }
    throw openAIError;
  }
}

async function callOpenAIText(prompt: string, maxTokens: number): Promise<string> {
  const response = await fetch(OPENAI_CHAT_API, {
    method: "POST",
    headers: openaiHeaders(),
    body: JSON.stringify({
      model: OPENAI_TEXT_MODEL,
      messages: [
        { role: "system", content: "You are a helpful fashion assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI text error ${response.status}: ${errorText.slice(0, 400)}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  throw new Error("OpenAI text response không hợp lệ");
}

async function callGroqText(prompt: string, maxTokens: number): Promise<string> {
  const response = await fetch(GROQ_API, {
    method: "POST",
    headers: groqHeaders(),
    body: JSON.stringify({
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: "You are a helpful fashion assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Groq text error ${response.status}: ${errorText.slice(0, 400)}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  throw new Error("Groq text response không hợp lệ");
}

// ─── describeOutfit ─────────────────────────────────────────────

export async function describeOutfit(
  personImageBase64: string,
  clothImageBase64: string,
  height: number,
  weight: number,
  userRequest: string
): Promise<string> {
  const prompt = `Bạn là một stylist AI. Dựa trên ảnh người và ảnh quần áo, chiều cao ${height} cm, cân nặng ${weight} kg, và yêu cầu của người dùng là: "${userRequest || "Không có yêu cầu cụ thể"}".

Hãy mô tả bằng văn bản:
- Phong cách outfit phù hợp
- Mức độ vừa vặn và cảm giác khi mặc
- Màu sắc và chất liệu gợi ý
- Gợi ý thêm phụ kiện hoặc hoàn thiện trang phục.

Trả về kết quả dưới dạng văn bản ngắn gọn, dễ hiểu, không trả về JSON.
`;

  return await generateText(prompt, 180);
}

// ─── extractJSON ────────────────────────────────────────────────

export function extractJSON(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Cannot extract JSON from response");
  return JSON.parse(jsonMatch[0]);
}

// ─── captionImage (vision): OpenAI → fallback Groq vision ───────

export async function captionImage(imageBase64: string): Promise<string> {
  const base64Data = imageBase64.includes(",")
    ? imageBase64.split(",")[1]
    : imageBase64;
  const dataUrl = `data:image/jpeg;base64,${base64Data}`;

  const CAPTION_VISION_PROMPT =
    "Identify if there is a person in this image and describe their gender (man/woman) and their clothing. If it is just clothing, describe the clothing item in detail. Keep it short. Use English.";

  const visionMessages = [
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: CAPTION_VISION_PROMPT },
        { type: "image_url" as const, image_url: { url: dataUrl } },
      ],
    },
  ];

  // Try OpenAI first
  try {
    return await callOpenAIVision(visionMessages);
  } catch (openAIError: any) {
    if (openAIError?.message?.includes("429") || openAIError?.message?.includes("insufficient_quota")) {
      console.warn("OpenAI vision quota exceeded, falling back to Groq vision");
      return await callGroqVision(visionMessages);
    }
    throw openAIError;
  }
}

async function callOpenAIVision(
  messages: Array<{ role: string; content: Array<Record<string, unknown>> }>
): Promise<string> {
  const response = await fetch(OPENAI_CHAT_API, {
    method: "POST",
    headers: openaiHeaders(),
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      messages: messages,
      max_tokens: 150,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenAI vision error ${response.status}: ${errorText.slice(0, 400)}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  throw new Error("OpenAI vision response không hợp lệ");
}

async function callGroqVision(
  messages: Array<{ role: string; content: Array<Record<string, unknown>> }>
): Promise<string> {
  const response = await fetch(GROQ_API, {
    method: "POST",
    headers: groqHeaders(),
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: messages,
      max_tokens: 150,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Groq vision error ${response.status}: ${errorText.slice(0, 400)}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  throw new Error("Groq vision response không hợp lệ");
}

// ─── generateImage: OpenAI (gpt-image-1 hoặc dall-e-3) ────

async function callImageAPI(model: string, prompt: string): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    prompt,
    n: 1,
    size: "1024x1024",
  };
  // dall-e-3 hỗ trợ response_format; gpt-image-1 trả b64_json mặc định, không nhận param này
  if (model.startsWith("dall-e")) {
    body.response_format = "b64_json";
  }

  const res = await fetch(OPENAI_IMAGE_API, {
    method: "POST",
    headers: openaiHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI image error ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const item = data?.data?.[0];
  if (item?.b64_json) return item.b64_json as string;
  if (item?.url) {
    const imgRes = await fetch(item.url as string);
    return Buffer.from(await imgRes.arrayBuffer()).toString("base64");
  }
  throw new Error("Không nhận được ảnh từ OpenAI");
}

/** Chuẩn hóa base64 / data URL */
export function toImageDataUrl(imageBase64: string, mime = "image/jpeg"): string {
  if (imageBase64.startsWith("data:")) return imageBase64;
  const raw = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
  return `data:${mime};base64,${raw}`;
}

/** Tạo ảnh từ ảnh tham chiếu (virtual try-on, v.v.) */
export async function editImagesWithReferences(
  referenceImages: string[],
  prompt: string,
  options?: { size?: string; quality?: string; inputFidelity?: "high" | "low" }
): Promise<string> {
  const model = OPENAI_IMAGE_MODEL.startsWith("dall-e")
    ? "gpt-image-1"
    : OPENAI_IMAGE_MODEL;

  const body: Record<string, unknown> = {
    model,
    images: referenceImages.map((img) => ({ image_url: toImageDataUrl(img) })),
    prompt,
    n: 1,
    size: options?.size || "1024x1536",
    quality: options?.quality || "high",
  };
  if (options?.inputFidelity && !model.startsWith("dall-e")) {
    body.input_fidelity = options.inputFidelity;
  }

  const res = await fetch(OPENAI_IMAGE_EDIT_API, {
    method: "POST",
    headers: openaiHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI image edit error ${res.status}: ${err.slice(0, 400)}`);
  }

  const data = await res.json();
  const item = data?.data?.[0];
  if (item?.b64_json) return item.b64_json as string;
  if (item?.url) {
    const imgRes = await fetch(item.url as string);
    return Buffer.from(await imgRes.arrayBuffer()).toString("base64");
  }
  throw new Error("Không nhận được ảnh từ OpenAI");
}

export async function generateImage(prompt: string): Promise<string> {
  const primary = OPENAI_IMAGE_MODEL;
  const fallbacks =
    primary === "dall-e-3"
      ? ["gpt-image-1"]
      : primary.startsWith("gpt-image")
        ? ["dall-e-3"]
        : [];

  try {
    return await callImageAPI(primary, prompt);
  } catch (primaryErr) {
    const msg = primaryErr instanceof Error ? primaryErr.message : "";
    const modelMissing = msg.includes("does not exist") || msg.includes("invalid_value");
    if (!modelMissing || fallbacks.length === 0) throw primaryErr;
    for (const fb of fallbacks) {
      try {
        console.warn(`Image model ${primary} failed, retrying with ${fb}`);
        return await callImageAPI(fb, prompt);
      } catch {
        /* try next */
      }
    }
    throw primaryErr;
  }
}

export { generateText };