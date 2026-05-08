import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getStyleProfile } from "@/lib/supabase";
import { buildPersonalizedPrompt } from "@/lib/styleTrainer";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { clothes, occasion, weather } = await req.json();

    if (!clothes || clothes.length < 2) {
      return NextResponse.json(
        { error: "Cần ít nhất 2 món đồ trong tủ để phối" },
        { status: 400 }
      );
    }

    // Lấy style profile đã học từ feedback của user
    const styleProfile = await getStyleProfile("default").catch(() => null);
    const personalizedContext = buildPersonalizedPrompt(styleProfile);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];

    const clothesList = clothes
      .map(
        (c: { id: string; type: string; color: string; material: string; style: string }, i: number) =>
          `[${i + 1}] ID: ${c.id} | ${c.type} | Màu: ${c.color} | Chất liệu: ${c.material} | Phong cách: ${c.style}`
      )
      .join("\n");

    const prompt = `Bạn là một AI stylist thời trang chuyên nghiệp. Hãy phân tích các món đồ và tư duy phối outfit.

DANH SÁCH ĐỒ TRONG TỦ:
${clothesList}

DỊP MẶC: ${occasion || "Hàng ngày"}
THỜI TIẾT: ${weather || "Bình thường"}
${personalizedContext}

Đề xuất 3 combo outfit khác nhau. Trả về JSON (chỉ JSON):
{
  "combos": [
    {
      "id": "combo_1",
      "name": "Tên outfit ngắn gọn",
      "occasion": "Dịp phù hợp",
      "vibe": "Cảm giác/phong cách",
      "items": ["item_id_1", "item_id_2"],
      "reasoning": "Lý do tại sao các món này hợp nhau",
      "tips": "Mẹo mặc thêm (phụ kiện, giày...)",
      "score": 8
    }
  ]
}`;

    parts.push({ text: prompt });

    // Thêm ảnh thật của từng món đồ để AI nhìn trực tiếp
    for (const cloth of clothes) {
      if (cloth.imageBase64) {
        parts.push({
          inlineData: { data: cloth.imageBase64, mimeType: "image/jpeg" },
        });
      }
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI không trả về kết quả hợp lệ");

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      combos: parsed.combos,
      hasPersonalization: !!styleProfile,
      profileSummary: styleProfile
        ? `AI đã học từ ${styleProfile.total_outfits || 0} outfit của bạn`
        : null,
    });
  } catch (error) {
    console.error("Suggest outfit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi phân tích outfit" },
      { status: 500 }
    );
  }
}
