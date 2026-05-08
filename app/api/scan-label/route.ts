import { NextRequest, NextResponse } from "next/server";
import { captionImage, generateText, extractJSON } from "@/lib/hf";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Cần ảnh tem" }, { status: 400 });
    }

    // BLIP đọc tem
    const caption = await captionImage(imageBase64).catch(() => "clothing label");

    // Mistral phân tích
    const prompt = `You are a sustainable fashion expert. Analyze this clothing label: "${caption}"

Return ONLY JSON:
{
  "materials": [{"name": "Cotton", "percent": 80, "eco": true}],
  "careInstructions": ["Hand wash", "No tumble dry"],
  "madeIn": "Vietnam",
  "brand": "brand name if visible",
  "ecoScore": 75,
  "recycleSuggestions": [
    {
      "title": "Make a tote bag",
      "difficulty": "Dễ",
      "time": "30 phút",
      "description": "Cut and sew into a reusable shopping bag",
      "materials_needed": ["Scissors", "Needle and thread"],
      "category": "Tái chế"
    },
    {
      "title": "Cleaning cloth",
      "difficulty": "Rất dễ",
      "time": "5 phút",
      "description": "Cut into small pieces for cleaning",
      "materials_needed": ["Scissors"],
      "category": "Tái sử dụng"
    },
    {
      "title": "Donate",
      "difficulty": "Dễ",
      "time": "0 phút",
      "description": "Donate to charity or clothing collection points",
      "materials_needed": [],
      "category": "Donate"
    }
  ],
  "sustainabilityTips": ["Wash in cold water to save energy"],
  "decompositionTime": "200 years if synthetic"
}`;

    const text = await generateText(prompt);
    const data = extractJSON(text) || {
      materials: [{ name: "Unknown", percent: 100, eco: false }],
      careInstructions: [],
      madeIn: "Unknown",
      brand: "",
      ecoScore: 50,
      recycleSuggestions: [
        { title: "Donate", difficulty: "Dễ", time: "0 phút", description: "Tặng cho người cần", materials_needed: [], category: "Donate" },
      ],
      sustainabilityTips: [],
      decompositionTime: "Unknown",
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi scan tem" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Cần ảnh tem" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
