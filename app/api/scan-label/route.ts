import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Cần ảnh tem" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Bạn là chuyên gia thời trang bền vững. Đọc tem thành phần quần áo trong ảnh và phân tích.

Trả về JSON (chỉ JSON):
{
  "materials": [
    { "name": "Cotton", "percent": 80, "eco": true },
    { "name": "Polyester", "percent": 20, "eco": false }
  ],
  "careInstructions": ["Giặt tay", "Không sấy khô"],
  "madeIn": "Việt Nam",
  "brand": "tên thương hiệu nếu có",
  "ecoScore": 75,
  "recycleSuggestions": [
    {
      "title": "Làm túi vải",
      "difficulty": "Dễ",
      "time": "30 phút",
      "description": "Cắt và may thành túi đi chợ tái sử dụng",
      "materials_needed": ["Kéo", "Kim chỉ"],
      "category": "Tái chế"
    },
    {
      "title": "Khăn lau nhà",
      "difficulty": "Rất dễ",
      "time": "5 phút",
      "description": "Cắt thành miếng nhỏ dùng lau bàn, lau kính",
      "materials_needed": ["Kéo"],
      "category": "Tái sử dụng"
    },
    {
      "title": "Donate / Tặng",
      "difficulty": "Dễ",
      "time": "0 phút",
      "description": "Tặng cho người cần hoặc đưa đến điểm thu gom quần áo cũ",
      "materials_needed": [],
      "category": "Donate"
    }
  ],
  "sustainabilityTips": ["Mẹo bảo quản để áo bền hơn"],
  "decompositionTime": "Thời gian phân hủy nếu vứt ra môi trường"
}

Nếu không đọc được tem, vẫn trả về JSON với các trường rỗng và recycleSuggestions chung chung.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Không đọc được tem");

    return NextResponse.json({ success: true, data: JSON.parse(jsonMatch[0]) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi scan tem" },
      { status: 500 }
    );
  }
}
