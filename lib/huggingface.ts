const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
const HF_TEXT_MODEL =
  process.env.HUGGINGFACE_TEXT_MODEL || "katanemo/Arch-Router-1.5B:hf-inference";
const HF_CHAT_API = "https://router.huggingface.co/v1/chat/completions";
const HF_INFERENCE_BASE = "https://router.huggingface.co/hf-inference/models";

const CAPTION_VISION_PROMPT =
  "Identify if there is a person in this image and describe their gender (man/woman) and their clothing. If it is just clothing, describe the clothing item in detail. Keep it short. Use English.";

/** Router chat model id; có thể thêm hậu tố :provider (ví dụ :hyperbolic) nếu cần. */
const HF_VISION_MODEL =
  process.env.HUGGINGFACE_VISION_MODEL ?? "Qwen/Qwen2.5-VL-7B-Instruct";

const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";

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
  const base64Data = imageBase64.includes(",")
    ? imageBase64.split(",")[1]
    : imageBase64;
  const dataUrl = `data:image/jpeg;base64,${base64Data}`;

  const visionMessages = [
    {
      role: "user" as const,
      content: [
        { type: "text" as const, text: CAPTION_VISION_PROMPT },
        { type: "image_url" as const, image_url: { url: dataUrl } },
      ],
    },
  ];

  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: GROQ_VISION_MODEL,
            messages: visionMessages,
            max_tokens: 150,
            temperature: 0.3,
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.trim()) {
          return content.trim();
        }
      } else {
        const err = await response.text();
        console.error("Groq vision caption HTTP error:", response.status, err.slice(0, 300));
      }
    } catch (e) {
      console.error("Groq vision caption error", e);
    }
  }

  if (HF_TOKEN) {
    try {
      const response = await fetch(HF_CHAT_API, {
        method: "POST",
        headers: hfHeaders(),
        body: JSON.stringify({
          model: HF_VISION_MODEL,
          messages: visionMessages,
          max_tokens: 150,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === "string" && content.trim()) {
          return content.trim();
        }
      } else {
        const err = await response.text();
        console.error("HF vision caption HTTP error:", response.status, err.slice(0, 300));
      }
    } catch (e) {
      console.error("HF vision (Qwen) caption error", e);
    }

    const blipUrl = `${HF_INFERENCE_BASE}/Salesforce/blip-image-captioning-large`;

    try {
      const jsonRes = await fetch(blipUrl, {
        method: "POST",
        headers: hfHeaders(),
        body: JSON.stringify({ inputs: dataUrl }),
      });
      if (jsonRes.ok) {
        const data = await jsonRes.json();
        const text = Array.isArray(data)
          ? data[0]?.generated_text
          : data?.generated_text;
        if (typeof text === "string" && text.trim()) {
          return text.trim();
        }
      }
    } catch (e) {
      console.error("BLIP (JSON) caption error", e);
    }

    const binary = Buffer.from(base64Data, "base64");
    const octetRes = await fetch(blipUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        Authorization: hfHeaders().Authorization,
      },
      body: binary,
    });

    if (octetRes.ok) {
      const data = await octetRes.json();
      const text = Array.isArray(data)
        ? data[0]?.generated_text
        : data?.generated_text;
      if (typeof text === "string" && text.trim()) {
        return text.trim();
      }
    } else {
      const err = await octetRes.text();
      throw new Error(
        `HF Caption error ${octetRes.status}: ${err.slice(0, 400)}`
      );
    }
  }

  throw new Error(
    "Không tạo được mô tả ảnh: cần GROQ_API_KEY (Groq vision) hoặc HUGGINGFACE_TOKEN. API cũ api-inference.huggingface.co đã ngừng — dùng router HF hoặc Groq."
  );
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
