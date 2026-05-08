import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/hf";

export async function POST(req: NextRequest) {
  try {
    const { prompt, style } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Cần nhập mô tả" }, { status: 400 });
    }

    const styleMap: Record<string, string> = {
      realistic: "photorealistic fashion photography, studio lighting, white background",
      anime: "anime style fashion illustration, vibrant colors",
      sketch: "fashion sketch, pencil drawing, designer illustration",
      watercolor: "watercolor fashion illustration, soft colors",
    };

    const fullPrompt = `${prompt}, ${styleMap[style] || styleMap.realistic}, centered, high quality`;

    const imageBase64 = await generateImage(fullPrompt);

    return NextResponse.json({
      success: true,
      imageBase64,
      mimeType: "image/jpeg",
    });
  } catch (error) {
    console.error("Generate image error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi tạo ảnh" },
      { status: 500 }
    );
  }
}
