/**
 * OpenAI (ChatGPT) Integration
 * Thay thế hoàn toàn HuggingFace và Groq bằng OpenAI API
 * Dùng key: OPENAI_API_KEY trong .env.local
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";

const OPENAI_CHAT_API = "https://api.openai.com/v1/chat/completions";
const OPENAI_IMAGE_API = "https://api.openai.com/v1/images/generations";

function openaiHeaders() {
  if (!OPENAI_API_KEY) {
    throw new Error("Thiếu OPENAI_API_KEY trong .env.local");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
}

async function generateText(
  prompt: string,
  maxTokens = 400
): Promise<string> {
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

export function extractJSON(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Cannot extract JSON from response");
  return JSON.parse(jsonMatch[0]);
}

export async function captionImage(imageBase64: string): Promise<string> {
  const base64Data = imageBase64.includes(",")
    ? imageBase64.split(",")[1]
    : imageBase64;
  const dataUrl = `data:image/jpeg;base64,${base64Data}`;

  const CAPTION_VISION_PROMPT =
    "Identify if there is a person in this image and describe their gender (man/woman) and their clothing. If it is just clothing, describe the clothing item in detail. Keep it short. Use English.";

  const response = await fetch(OPENAI_CHAT_API, {
    method: "POST",
    headers: openaiHeaders(),
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: CAPTION_VISION_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
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
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }
  throw new Error("OpenAI vision response không hợp lệ");
}

export async function generateImage(prompt: string): Promise<string> {
  const response = await fetch(OPENAI_IMAGE_API, {
    method: "POST",
    headers: openaiHeaders(),
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI Image error ${response.status}: ${err.slice(0, 400)}`);
  }

  const data = await response.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (typeof b64 === "string") return b64;
  throw new Error("OpenAI image response không hợp lệ");
}

export { generateText };