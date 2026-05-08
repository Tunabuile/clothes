import { NextRequest, NextResponse } from "next/server";
import { computeCompatibilityMatrix, findBestCombos } from "@/lib/clipMatcher";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { clothes, occasion, weather } = await req.json();

    if (!clothes || clothes.length < 2) {
      return NextResponse.json(
        { error: "Cần ít nhất 2 món đồ" },
        { status: 400 }
      );
    }

    // Lọc những món có ảnh để CLIP phân tích
    const clothesWithImages = clothes.filter(
      (c: { imageBase64?: string }) => c.imageBase64
    );

    let bestComboIds: string[][] = [];
    let compatibilityScores: { item1Id: string; item2Id: string; score: number; label: string }[] = [];
    let usedCLIP = false;

    if (clothesWithImages.length >= 2) {
      // Dùng CLIP tính compatibility từ ảnh thật
      compatibilityScores = await computeCompatibilityMatrix(clothesWithImages);
      bestComboIds = findBestCombos(compatibilityScores, clothesWithImages, 3);
      usedCLIP = true;
    } else {
      // Fallback: lấy ngẫu nhiên nếu không có ảnh
      const ids = clothes.map((c: { id: string }) => c.id);
      bestComboIds = [ids.slice(0, 2), ids.slice(1, 3)].filter(
        (c) => c.length >= 2
      );
    }

    // Dùng Gemini để viết reasoning cho từng combo CLIP đã chọn
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const clothMap = Object.fromEntries(
      clothes.map((c: { id: string; type: string; color: string; material: string; style: string }) => [c.id, c])
    );

    const combosWithScores = bestComboIds.map((ids, idx) => {
      const items = ids.map((id) => clothMap[id]).filter(Boolean);
      // Tính avg score của combo này
      let avgScore = 50;
      if (compatibilityScores.length > 0) {
        const pairScores: number[] = [];
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const s = compatibilityScores.find(
              (s) =>
                (s.item1Id === ids[i] && s.item2Id === ids[j]) ||
                (s.item1Id === ids[j] && s.item2Id === ids[i])
            );
            if (s) pairScores.push(s.score);
          }
        }
        if (pairScores.length > 0)
          avgScore = Math.round(
            pairScores.reduce((a, b) => a + b, 0) / pairScores.length
          );
      }
      return { ids, items, avgScore, rank: idx + 1 };
    });

    // Gemini viết reasoning cho từng combo
    const comboDescriptions = combosWithScores
      .map(
        (c, i) =>
          `Combo ${i + 1}: ${c.items.map((item) => `${item.color} ${item.type} (${item.style})`).join(" + ")} | CLIP score: ${c.avgScore}/100`
      )
      .join("\n");

    const prompt = `Bạn là stylist thời trang. CLIP AI đã phân tích ảnh và chọn ra các combo đồ tương thích nhất.

CÁC COMBO CLIP ĐÃ CHỌN:
${comboDescriptions}

DỊP: ${occasion || "Hàng ngày"} | THỜI TIẾT: ${weather || "Bình thường"}

Viết reasoning và tips cho từng combo. Trả về JSON (chỉ JSON):
{
  "combos": [
    {
      "id": "combo_1",
      "name": "Tên outfit",
      "occasion": "Dịp phù hợp",
      "vibe": "Phong cách",
      "items": ${JSON.stringify(bestComboIds[0] || [])},
      "reasoning": "Lý do CLIP chọn combo này (màu sắc, texture, style)",
      "tips": "Mẹo mặc thêm",
      "score": ${combosWithScores[0]?.avgScore || 70},
      "clipScore": ${combosWithScores[0]?.avgScore || 70}
    }
  ]
}
Điền đúng items IDs và clipScore cho từng combo.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI không trả về kết quả hợp lệ");

    const parsed = JSON.parse(jsonMatch[0]);

    // Gán đúng items IDs từ CLIP vào từng combo
    const finalCombos = parsed.combos.map(
      (combo: { id: string; name: string; occasion: string; vibe: string; items: string[]; reasoning: string; tips: string; score: number; clipScore: number }, i: number) => ({
        ...combo,
        items: bestComboIds[i] || combo.items,
        clipScore: combosWithScores[i]?.avgScore ?? combo.score,
      })
    );

    return NextResponse.json({
      success: true,
      combos: finalCombos,
      usedCLIP,
      compatibilityScores: compatibilityScores.slice(0, 10), // top 10 pairs
    });
  } catch (error) {
    console.error("Match clothes error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Lỗi phân tích tương thích",
      },
      { status: 500 }
    );
  }
}
