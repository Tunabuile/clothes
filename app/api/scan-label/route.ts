import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Thiếu ảnh" }, { status: 400 });
    }
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "Thiếu GROQ_API_KEY" }, { status: 500 });
    }

    // Groq vision: llama-4-scout supports image input
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
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: `Bạn là chuyên gia upcycle thời trang sáng tạo. Nhìn vào ảnh này (tem nhãn hoặc sản phẩm quần áo).

Hãy phân tích và trả về JSON theo format sau:
{
  "material": "chất liệu đọc được hoặc nhìn thấy (vd: 100% Cotton, Denim, Polyester...)",
  "clothingType": "loại đồ (vd: Áo thun, Quần jeans, Áo sơ mi...)",
  "condition": "tình trạng (Mới, Còn tốt, Cũ)",
  "recycleSuggestions": [
    {
      "title": "Tên ý tưởng sáng tạo, thời trang",
      "category": "Tái chế hoặc Upcycle",
      "difficulty": "Rất dễ hoặc Dễ hoặc Trung bình hoặc Khó",
      "time": "thời gian ước tính vd 20 phút",
      "description": "Mô tả cách làm chi tiết bằng tiếng Việt, 1-2 câu",
      "materials_needed": ["dụng cụ cần thiết"]
    }
  ]
}

Đưa ra 4-5 ý tưởng SÁNG TẠO, thời trang (túi xách, phụ kiện, trang phục mới, đồ decor đẹp...).
TUYỆT ĐỐI KHÔNG gợi ý: giẻ lau, khăn lau, dây buộc tóc đơn giản, hoặc bất kỳ ý tưởng nhàm chán nào.
Ưu tiên: upcycle thành item thời trang mặc được, phụ kiện trendy, hoặc đồ decor aesthetic.
Chỉ trả về JSON thuần, không có text khác.`,
              },
            ],
          },
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq vision error:", errText);
      return NextResponse.json(
        { error: `Groq API lỗi ${res.status}: ${errText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const groqData = await res.json();
    const content = groqData.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON in response:", content);
      return NextResponse.json(
        { error: "AI không trả về kết quả hợp lệ, thử lại nhé" },
        { status: 500 }
      );
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("scan-label error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định" },
      { status: 500 }
    );
  }
}
