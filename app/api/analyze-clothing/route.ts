import { NextRequest, NextResponse } from "next/server";
import { captionImage, generateText, extractJSON } from "@/lib/hf";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Thiếu ảnh" }, { status: 400 });
    }

    // BLIP caption ảnh trước
    const caption = await captionImage(imageBase64).catch(() => "a clothing item");

    // Mistral phân tích từ caption
    const prompt = `You are a fashion expert. Based on this clothing image description: "${caption}"

Return ONLY a JSON object (no explanation):
{
  "type": "clothing type (T-shirt/Jeans/Dress/Jacket/...)",
  "color": "main color in Vietnamese",
  "material": "material (Cotton/Polyester/Denim/...)",
  "style": "style (Casual/Formal/Sport/...)",
  "condition": "New"
}`;

    const text = await generateText(prompt);
    const info = extractJSON(text) || {
      type: "Clothing",
      color: "Unknown",
      material: "Unknown",
      style: "Casual",
      condition: "Good",
    };

    return NextResponse.json({ success: true, data: info });
  } catch (error) {
    console.error("Analyze clothing error:", error);
    return NextResponse.json(
      { error: "Không thể phân tích ảnh." },
      { status: 500 }
    );
  }
}
