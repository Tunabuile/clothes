import { NextRequest, NextResponse } from "next/server";
import { generateText, extractJSON } from "@/lib/hf";
import { getStyleProfile } from "@/lib/supabase";
import { buildDeepPersonalizedPrompt } from "@/lib/autoTrainer";
import { evaluateColorCombo } from "@/lib/colorTheory";

export async function POST(req: NextRequest) {
  try {
    const { clothes, occasion, weather } = await req.json();

    if (!clothes || clothes.length < 2) {
      return NextResponse.json(
        { error: "Cần ít nhất 2 món đồ trong tủ để phối" },
        { status: 400 }
      );
    }

    const styleProfile = await getStyleProfile("default").catch(() => null);
    const allColors = clothes.map((c: { color: string }) => c.color).filter(Boolean);
    const colorEval = evaluateColorCombo(allColors);
    const personalizedContext = buildDeepPersonalizedPrompt(styleProfile, allColors);

    const clothesList = clothes
      .map(
        (c: { id: string; type: string; color: string; material: string; style: string }, i: number) =>
          `[${i + 1}] ID: ${c.id} | ${c.type} | Color: ${c.color} | Material: ${c.material} | Style: ${c.style}`
      )
      .join("\n");

    const prompt = `You are a professional fashion stylist. Suggest 3 outfit combos from these clothes.

CLOTHES:
${clothesList}

OCCASION: ${occasion || "Daily"}
WEATHER: ${weather || "Normal"}
COLOR SCORE: ${colorEval.score}/100 - ${colorEval.advice}
${personalizedContext}

Return ONLY this JSON (no explanation):
{
  "combos": [
    {
      "id": "combo_1",
      "name": "outfit name",
      "occasion": "occasion",
      "vibe": "vibe/style",
      "items": ["item_id_1", "item_id_2"],
      "reasoning": "why these items work together",
      "tips": "styling tips",
      "score": 8
    }
  ]
}`;

    const text = await generateText(prompt);
    const parsed = extractJSON(text);

    if (!parsed || !parsed.combos) {
      throw new Error("AI không trả về kết quả hợp lệ");
    }

    return NextResponse.json({
      success: true,
      combos: parsed.combos,
      hasPersonalization: !!styleProfile,
      profileSummary: styleProfile
        ? `AI đã học từ ${(styleProfile as { total_outfits?: number }).total_outfits || 0} outfit của bạn`
        : null,
      colorAnalysis: colorEval,
    });
  } catch (error) {
    console.error("Suggest outfit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi phân tích outfit" },
      { status: 500 }
    );
  }
}

