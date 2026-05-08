import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface OutfitCombo {
  id: string;
  name: string;
  occasion: string;
  vibe: string;
  items: string[]; // item IDs
  reasoning: string;
  tips: string;
  score: number; // 1-10
}

export async function POST(req: NextRequest) {
  try {
    const { clothes, occasion, weather } = await req.json();

    if (!clothes || clothes.length < 2) {
      return NextResponse.json(
        { error: "Cần ít nhất 2 món đồ trong tủ để phối" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build parts: text + ảnh từng món đồ
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];

    const clothesList = clothes
      .map(
        (c: { id: string; type: string; color: string; material: string; style: string }, i: number) =>
          `[${i + 1}] ID: ${c.id} | ${c.type} | Màu: ${c.color} | Chất liệu: ${c.material} | Phong cách: ${c.style}`
      )
      .join("\n");

    const prompt = `Bạn là một stylist thời trang chuyên nghiệp. Hãy phân tích các món đồ sau và tư duy phối outfit.

DANH SÁCH ĐỒ TRONG TỦ:
${clothesList}

DỊP MẶC: ${occasion || "Hàng ngày"}
THỜI TIẾT: ${weather || "Bình thường"}

Hãy đề xuất 3 combo outfit khác nhau từ các món đồ trên. Trả về JSON với format sau (chỉ JSON, không giải thích thêm):
{
  "combos": [
    {
      "id": "combo_1",
      "name": "Tên outfit ngắn gọn",
      "occasion": "Dịp phù hợp",
      "vibe": "Cảm giác/phong cách (VD: Năng động, Thanh lịch, Thoải mái...)",
      "items": ["item_id_1", "item_id_2"],
      "reasoning": "Lý do tại sao các món này hợp nhau (màu sắc, chất liệu, phong cách)",
      "tips": "Mẹo mặc thêm (phụ kiện, giày, cách mix...)",
      "score": 8
    }
  ]
}

Lưu ý:
- Chỉ dùng ID từ danh sách trên
- Mỗi combo 2-4 món đồ
- Reasoning phải cụ thể về màu sắc và phong cách
- Tips thực tế và hữu ích`;

    parts.push({ text: prompt });

    // Thêm ảnh từng món đồ nếu có
    for (const cloth of clothes) {
      if (cloth.imageBase64) {
        parts.push({
          inlineData: {
            data: cloth.imageBase64,
            mimeType: "image/jpeg",
          },
        });
      }
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI không trả về kết quả hợp lệ");

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, combos: parsed.combos });
  } catch (error) {
    console.error("Suggest outfit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi phân tích outfit" },
      { status: 500 }
    );
  }
}
