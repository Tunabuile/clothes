import { NextRequest, NextResponse } from "next/server";
import { captionImage, generateText } from "@/lib/huggingface";

export async function POST(req: NextRequest) {
  try {
    const { personImageBase64, clothImageBase64, height, weight, gender, userRequest, lang } =
      await req.json();

    if (!clothImageBase64) {
      return NextResponse.json(
        { error: lang === "vi" ? "Cần ảnh quần áo" : "Clothing image required" },
        { status: 400 }
      );
    }

    const isVi = lang === "vi";
    
    let personDesc = isVi ? "Không có thông tin" : "No person info";
    if (personImageBase64) {
      try {
        personDesc = await captionImage(personImageBase64);
      } catch (e: any) {
        console.error("Caption person error:", e);
        const errMsg = isVi ? `Lỗi đọc ảnh người: ${e.message}` : `Error reading person image: ${e.message}`;
        return NextResponse.json({ error: errMsg }, { status: 500 });
      }
    }

    let clothDesc = isVi ? "quần áo" : "clothing";
    if (clothImageBase64) {
      try {
        clothDesc = await captionImage(clothImageBase64);
      } catch (e: any) {
        console.error("Caption cloth error:", e);
        const errMsg = isVi ? `Lỗi đọc ảnh quần áo: ${e.message}` : `Error reading clothing image: ${e.message}`;
        return NextResponse.json({ error: errMsg }, { status: 500 });
      }
    }

    // Prompt tự động theo ngôn ngữ
    const prompt = isVi
      ? `Bạn là stylist AI chuyên nghiệp. Dưới đây là thông tin nhận diện được từ ảnh:
- Người mặc: "${personDesc}", Giới tính: ${gender || "Nam"}, cao ${height}cm, nặng ${weight}kg.
- Quần áo muốn phối: "${clothDesc}".
- Yêu cầu thêm: "${userRequest || "Không có"}".

Hãy tư vấn phối đồ BẰNG TIẾNG VIỆT, tập trung vào:
- Phong cách outfit phù hợp với món đồ "${clothDesc}"
- Gợi ý phối màu và chất liệu để tôn dáng
- Phụ kiện đi kèm
(Viết ngắn gọn, dễ hiểu, KHÔNG dùng format JSON)`
      : `You are a professional AI stylist. Here's the info from the images:
- Person: "${personDesc}", Gender: ${gender || "Male"}, Height: ${height}cm, Weight: ${weight}kg.
- Clothing item: "${clothDesc}".
- User request: "${userRequest || "None"}".

Please give outfit advice IN ENGLISH, focusing on:
- Suitable outfit style for the "${clothDesc}"
- Color and material matching tips
- Accessory suggestions
(Write concisely, clear, DO NOT use JSON format)`;

    const resultText = await generateText(prompt, 300);

    return NextResponse.json({ success: true, resultText, clothDesc, personDesc });
  } catch (error) {
    console.error("Describe outfit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cannot describe outfit." },
      { status: 500 }
    );
  }
}