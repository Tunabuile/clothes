import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/hf";

export async function POST(req: NextRequest) {
  try {
    const { personImageBase64, clothImageBase64, height, weight, userRequest } =
      await req.json();

    if (!personImageBase64 || !clothImageBase64) {
      return NextResponse.json(
        { error: "Cần cả ảnh người và ảnh quần áo" },
        { status: 400 }
      );
    }

    const prompt = `You are a fashion stylist AI. A person with height ${height || 170}cm and weight ${weight || 60}kg wants to wear this outfit.
User request: "${userRequest || "No specific request"}"

Describe in Vietnamese:
- Outfit style and vibe
- How it fits the person's body type
- Color and material suggestions
- Accessory recommendations

Keep it short, friendly, and practical. No JSON needed.`;

    const resultText = await generateText(prompt);

    return NextResponse.json({ success: true, resultText });
  } catch (error) {
    console.error("Describe outfit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể mô tả outfit." },
      { status: 500 }
    );
  }
}
