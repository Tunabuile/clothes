const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
const HF_TEXT_MODEL = process.env.HUGGINGFACE_TEXT_MODEL || "google/flan-t5-small";
const HF_TEXT_API = `https://api-inference.huggingface.co/models/${HF_TEXT_MODEL}`;

function hfHeaders() {
  return {
    "Content-Type": "application/json",
    ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
  };
}

async function generateText(
  prompt: string,
  maxTokens = 180
): Promise<string> {
  const response = await fetch(HF_TEXT_API, {
    method: "POST",
    headers: hfHeaders(),
    body: JSON.stringify({
      inputs: prompt,
      options: { wait_for_model: true },
      parameters: {
        max_new_tokens: maxTokens,
        temperature: 0.7,
        top_p: 0.9,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face text error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  if (typeof data === "string") return data;
  if (Array.isArray(data) && data.length > 0) {
    if (typeof data[0] === "string") return data[0];
    if (typeof data[0]?.generated_text === "string") return data[0].generated_text;
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  return JSON.stringify(data);
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
