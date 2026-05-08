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
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
