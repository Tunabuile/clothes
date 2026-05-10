const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
const HF_TEXT_MODEL =
  process.env.HUGGINGFACE_TEXT_MODEL || "katanemo/Arch-Router-1.5B:hf-inference";
const HF_CHAT_API = "https://router.huggingface.co/v1/chat/completions";
const HF_INFERENCE_BASE = "https://router.huggingface.co/hf-inference/models";

function hfHeaders() {
  if (!HF_TOKEN) {
    throw new Error("Thiếu HUGGINGFACE_TOKEN (Hugging Face Access Token)");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${HF_TOKEN}`,
  };
}

async function generateText(
  prompt: string,
  maxTokens = 400
): Promise<string> {
  // Ưu tiên dùng Groq nếu có (vì model 70B thông minh hơn rất nhiều so với 1.5B)
  if (process.env.GROQ_API_KEY) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      })
    });
    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === "string") return content;
    }
  }

  // Fallback về Hugging Face
  const response = await fetch(HF_CHAT_API, {
    method: "POST",
    headers: hfHeaders(),
    body: JSON.stringify({
      model: HF_TEXT_MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Hugging Face text error ${response.status}: ${errorText.slice(0, 400)}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  throw new Error("Hugging Face text response không hợp lệ");
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
  const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
  const binary = Buffer.from(base64Data, "base64");

  const response = await fetch(
    `${HF_INFERENCE_BASE}/Salesforce/blip-image-captioning-large`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        Authorization: hfHeaders().Authorization,
      },
      body: binary,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HF Caption error ${response.status}: ${err.slice(0, 400)}`);
  }

  const data = await response.json();
  return data?.[0]?.generated_text || "";
}

export async function generateImage(prompt: string): Promise<string> {
  const model =
    process.env.HUGGINGFACE_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";
  const response = await fetch(`${HF_INFERENCE_BASE}/${model}`, {
    method: "POST",
    headers: hfHeaders(),
    body: JSON.stringify({
      inputs: prompt,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HF Image error ${response.status}: ${err.slice(0, 400)}`);
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export { generateText };
