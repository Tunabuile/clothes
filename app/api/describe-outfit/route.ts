import { NextRequest, NextResponse } from "next/server";
import { captionImage, generateText } from "@/lib/huggingface";

export async function POST(req: NextRequest) {
  try {
    const { personImageBase64, clothImageBase64, height, weight, userRequest } =
      await req.json();

    if (!clothImageBase64) {
      return NextResponse.json(
        { error: "Cần ảnh quần áo" },
        { status: 400 }
      );
    }

    let personDesc = "Không có thông tin";
    if (personImageBase64) {
      try {
        personDesc = await captionImage(personImageBase64);
      } catch (e: any) {
        console.error("Caption person error:", e);
        if (e.message.includes("401") || e.message.includes("Thiếu HUGGINGFACE_TOKEN")) {
           return NextResponse.json({ error: "Lỗi HUGGINGFACE_TOKEN không hợp lệ. Vui lòng cập nhật token mới trên Vercel/env!" }, { status: 401 });
        }
      }
    }

    let clothDesc = "quần áo";
    if (clothImageBase64) {
      try {
        clothDesc = await captionImage(clothImageBase64);
      } catch (e: any) {
        console.error("Caption cloth error:", e);
        if (e.message.includes("401") || e.message.includes("Thiếu HUGGINGFACE_TOKEN")) {
           return NextResponse.json({ error: "Lỗi HUGGINGFACE_TOKEN không hợp lệ. Vui lòng cập nhật token mới trên Vercel/env!" }, { status: 401 });
        }
      }
    }

    const prompt = `Bạn là stylist AI chuyên nghiệp. Dưới đây là thông tin nhận diện được từ ảnh:
- Người mặc: "${personDesc}", cao ${height}cm, nặng ${weight}kg.
- Quần áo muốn phối: "${clothDesc}".
- Yêu cầu thêm: "${userRequest || "Không có"}".

Hãy tư vấn phối đồ BẰNG TIẾNG VIỆT, tập trung vào:
- Phong cách outfit phù hợp với món đồ "${clothDesc}"
- Gợi ý phối màu và chất liệu để tôn dáng
- Phụ kiện đi kèm
(Viết ngắn gọn, dễ hiểu, KHÔNG dùng format JSON)`;

    const resultText = await generateText(prompt, 300);

    // Trả về kèm clothDesc để lúc tạo ảnh có thể dùng lại làm prompt
    return NextResponse.json({ success: true, resultText, clothDesc, personDesc });
  } catch (error) {
    console.error("Describe outfit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể mô tả outfit." },
      { status: 500 }
    );
  }
}
