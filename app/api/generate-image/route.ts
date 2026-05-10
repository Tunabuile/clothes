import { NextRequest, NextResponse } from "next/server";
import { generateImage, generateText } from "@/lib/huggingface";

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, personDesc, clothDesc, gender } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Cần nhập mô tả" }, { status: 400 });
    }

    // AI sinh ảnh (FLUX) chỉ hiểu tiếng Anh tốt. Prompt hiện tại là tiếng Việt từ TryOnResult.
    // Chúng ta cần dùng generateText để dịch và tối ưu nó thành prompt vẽ ảnh tiếng Anh.
    const translatePrompt = `You are an expert prompt engineer for FLUX image model.
Translate and enhance the following Vietnamese fashion description into a high-quality ENGLISH image generation prompt.
IMPORTANT REQUIREMENTS:
${gender ? `- The person MUST be drawn as: ${gender === "Nam" ? "A MAN (Male)" : "A WOMAN (Female)"}. THIS IS STRICTLY REQUIRED.` : "- The person MUST be drawn as a MAN (Male)."}
${personDesc && personDesc !== "Không có thông tin" ? `- The person MUST also match this description: "${personDesc}"` : ""}
${clothDesc && clothDesc !== "quần áo" ? `- The clothing MUST be described exactly as: "${clothDesc}"` : ""}

Ensure the prompt focuses on the person, the outfit, the fit, and the colors.
DO NOT include any conversational text, just return the english prompt.

Vietnamese description: "${prompt}"`;

    let englishPrompt = prompt;
    try {
      englishPrompt = await generateText(translatePrompt, 200);
      // Xóa các dấu ngoặc kép bọc ngoài nếu AI trả về
      englishPrompt = englishPrompt.replace(/^"|"$/g, '').trim();
    } catch (e) {
      console.error("Translation failed, using original prompt", e);
    }

    const styleMap: Record<string, string> = {
      realistic: "photorealistic full body fashion photography, 8k resolution, studio lighting, hyperdetailed, elegant, highly detailed face",
      anime: "anime style fashion illustration, vibrant colors, highly detailed",
      sketch: "fashion sketch, pencil drawing, designer illustration",
      watercolor: "watercolor fashion illustration, soft colors",
    };

    const fullPrompt = `${englishPrompt}, ${styleMap[style] || styleMap.realistic}`;

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
