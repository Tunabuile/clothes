import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Cần ảnh tem" }, { status: 400 });
    }

    const mime = mimeType || "image/jpeg";

    // Dùng Groq vision model (llama-4-scout) để đọc ảnh tem trực tiếp
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${imageBase64}` },
              },
              {
                type: "text",
                text: `You are a sustainable fashion expert. Read this clothing label image carefully and extract all information.

Return ONLY valid JSON (no markdown, no explanation):
{
  "materials": [{"name": "Cotton", "percent": 100, "eco": true}],
  "careInstructions": ["Machine wash warm", "Tumble dry gentle"],
  "madeIn": "Vietnam",
  "brand": "brand name or empty string",
  "ecoScore": 75,
  "recycleSuggestions": [
    {
      "title": "Làm túi vải tote",
      "difficulty": "Dễ",
      "time": "30 phút",
      "description": "Cắt và may thành túi đi chợ tái sử dụng",
      "materials_needed": ["Kéo", "Kim chỉ"],
      "category": "Tái chế"
    },
    {
      "title": "Upcycle thành crop top",
      "difficulty": "Dễ",
      "time": "15 phút",
      "description": "Cắt phần dưới để tạo crop top thời trang",
      "materials_needed": ["Kéo", "Thước"],
      "category": "Upcycle"
    },
    {
      "title": "Làm gối trang trí",
      "difficulty": "Trung bình",
      "time": "45 phút",
      "description": "Khâu thành bao gối nhồi bông, decor phòng ngủ",
      "materials_needed": ["Kim chỉ", "Bông nhồi"],
      "category": "Tái chế"
    }
  ],
  "sustainabilityTips": ["Giặt nước lạnh tiết kiệm điện", "Phơi khô tự nhiên"],
  "decompositionTime": "1-5 years for natural fibers, 200+ years for synthetics"
}

Base the recycleSuggestions on the actual material content (cotton = easy to recycle, polyester = harder).
Set ecoScore higher for natural fibers (cotton, linen, wool) and lower for synthetics (polyester, nylon).`,
              },
            ],
          },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq vision error ${res.status}: ${err.slice(0, 200)}`);
    }

    const groqData = await res.json();
    const text = groqData.choices?.[0]?.message?.content || "";

    // Extract JSON từ response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI không trả về JSON hợp lệ");
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Scan label error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi scan tem" },
      { status: 500 }
    );
  }
}
