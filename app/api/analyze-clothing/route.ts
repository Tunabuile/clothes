import { NextRequest, NextResponse } from "next/server";
import { analyzeClothing } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Thiếu ảnh" }, { status: 400 });
    }

    const info = await analyzeClothing(imageBase64, mimeType || "image/jpeg");
    return NextResponse.json({ success: true, data: info });
  } catch (error) {
    console.error("Analyze clothing error:", error);
    return NextResponse.json(
      { error: "Không thể phân tích ảnh. Kiểm tra GEMINI_API_KEY." },
      { status: 500 }
    );
  }
}
