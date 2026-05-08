import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ClothingInfo {
  type: string;
  color: string;
  material: string;
  style: string;
  condition: string;
}

/**
 * Dùng Gemini Vision để phân tích ảnh quần áo
 * Trả về JSON thông tin món đồ
 */
export async function analyzeClothing(
  imageBase64: string,
  mimeType: string
): Promise<ClothingInfo> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Phân tích hình ảnh quần áo này và trả về JSON với format sau (chỉ trả JSON, không giải thích):
{
  "type": "loại đồ (T-shirt/Shirt/Pants/Dress/Jacket/...)",
  "color": "màu sắc chính",
  "material": "chất liệu (Cotton/Polyester/Denim/...)",
  "style": "phong cách (Casual/Formal/Sport/...)",
  "condition": "tình trạng (New/Good/Worn/...)"
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
      },
    },
  ]);

  const text = result.response.text();
  // Extract JSON từ response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Không thể phân tích ảnh quần áo");

  return JSON.parse(jsonMatch[0]) as ClothingInfo;
}

export async function describeOutfit(
  personImageBase64: string,
  clothImageBase64: string,
  height: number,
  weight: number,
  userRequest: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Bạn là một stylist AI. Dựa trên ảnh người và ảnh quần áo, chiều cao ${height} cm, cân nặng ${weight} kg, và yêu cầu của người dùng là: "${userRequest || "Không có yêu cầu cụ thể"}".

Hãy mô tả bằng văn bản:
- Phong cách outfit phù hợp
- Mức độ vừa vặn và cảm giác khi mặc
- Màu sắc và chất liệu gợi ý
- Gợi ý thêm phụ kiện hoặc hoàn thiện trang phục.

Trả về kết quả dưới dạng văn bản ngắn gọn, dễ hiểu, không quay về JSON.`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: personImageBase64,
        mimeType: "image/jpeg",
      },
    },
    {
      inlineData: {
        data: clothImageBase64,
        mimeType: "image/jpeg",
      },
    },
  ]);

  return result.response.text();
}
