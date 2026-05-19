import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/huggingface";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";

interface RecycleIdea {
  title: string;
  category: string;
  difficulty: string;
  time: string;
  description: string;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Thiếu ảnh" }, { status: 400 });
    }
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: "Thiếu OPENAI_API_KEY trong .env.local" }, { status: 500 });
    }

    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const dataUrl = `data:${mimeType || "image/jpeg"};base64,${base64Data}`;

    // ─── Bước 1: Vision — phân tích màu, hoa văn, 5 ý tưởng ───
    const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
              {
                type: "text",
                text: `Bạn là chuyên gia upcycle thời trang. Nhìn kỹ ảnh quần áo và trả về JSON thuần (không markdown):

{
  "material": "chất liệu (vd: 100% Cotton, Denim...)",
  "clothingType": "loại đồ tiếng Việt (vd: Áo khoác denim, Quần jeans...)",
  "condition": "Mới / Còn tốt / Cũ",
  "colorTone": "mô tả chi tiết tông màu chính và màu phụ (tiếng Việt, vd: xanh denim đậm, viền vàng nhạt)",
  "pattern": "mô tả chi tiết hoa văn/họa tiết/kết cấu vải (tiếng Việt, vd: denim thô, ren trắng hoa vàng dọc sườn)",
  "ideas": [
    {
      "title": "Tên sản phẩm tái chế",
      "category": "Tái chế hoặc Upcycle",
      "difficulty": "Rất dễ / Dễ / Trung bình / Khó",
      "time": "vd: 30 phút",
      "description": "Cách làm ngắn gọn tiếng Việt (2-3 câu)"
    }
  ]
}

Yêu cầu:
- Đúng 5 ý tưởng SÁNG TẠO, thời trang (túi, váy, balo, phụ kiện, decor đẹp...)
- KHÔNG gợi ý: giẻ lau, khăn lau, dây buộc tóc đơn giản
- colorTone và pattern phải mô tả CHÍNH XÁC những gì thấy trên ảnh`,
              },
            ],
          },
        ],
        max_tokens: 1400,
        temperature: 0.7,
      }),
    });

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      console.error("OpenAI vision error:", errText);
      return NextResponse.json(
        { error: `OpenAI lỗi ${visionRes.status}: ${errText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const visionData = await visionRes.json();
    const content = visionData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI không trả về kết quả hợp lệ" }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    const clothingType = analysis.clothingType || "quần áo";
    const colorTone = analysis.colorTone || analysis.color || "màu gốc của vải";
    const pattern = analysis.pattern || "họa tiết gốc";
    const ideas: RecycleIdea[] = (analysis.ideas || []).slice(0, 5);

    // ─── Bước 2: DALL-E 3 — sơ đồ tư duy 1 ảnh, 5 sản phẩm cùng tông màu/hoa văn ───
    const branches = ideas
      .map(
        (idea, idx) =>
          `Branch ${idx + 1} (top-right area, clockwise): illustrated "${idea.title}" handmade product made from the SAME fabric — identical ${colorTone} colors and ${pattern} pattern/texture as center garment`
      )
      .join(". ");

    const mindmapPrompt = `Professional fashion upcycle MIND MAP infographic, square 1024 layout, clean off-white background, illustrated diagram style (NOT a photo collage).

CENTER: one ${clothingType} garment drawing, showing exact color tones: ${colorTone}, and exact fabric pattern/texture: ${pattern}.

Five curved arrows radiate from center to five outer nodes arranged in a circle. ${branches}.

CRITICAL: every recycled product in the branches MUST visibly reuse the SAME color palette and SAME fabric pattern/texture as the center garment — cohesive upcycle collection.

Style: modern Vietnamese fashion infographic, soft shadows, hand-drawn product icons, clear arrows, small readable Vietnamese text labels for each product name, minimalist and educational. No watermarks, no stock photo look.`;

    let mindmapBase64 = "";
    try {
      mindmapBase64 = await generateImage(mindmapPrompt);
    } catch (imgErr) {
      console.error("DALL-E mindmap error:", imgErr);
      return NextResponse.json(
        {
          error:
            imgErr instanceof Error
              ? imgErr.message
              : "Không tạo được ảnh mindmap. Kiểm tra key OpenAI có quyền DALL-E 3.",
        },
        { status: 500 }
      );
    }

    // ─── Bước 3: Mô tả chi tiết từng sản phẩm (tiếng Việt) ───
    const descRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          {
            role: "user",
            content: `Viết bằng tiếng Việt cho mindmap tái chế từ ${clothingType}.
Tông màu gốc: ${colorTone}. Hoa văn/kết cấu: ${pattern}.

Cấu trúc:
1. Một đoạn mở đầu 2 câu giới thiệu mindmap.
2. Danh sách đánh số 1-5, mỗi mục gồm: **Tên sản phẩm** — mô tả cách làm (2 câu), độ khó và thời gian.

Dữ liệu ý tưởng:
${JSON.stringify(ideas, null, 2)}`,
          },
        ],
        max_tokens: 700,
        temperature: 0.6,
      }),
    });

    let description = "";
    if (descRes.ok) {
      const descData = await descRes.json();
      description = descData.choices?.[0]?.message?.content || "";
    }

    return NextResponse.json({
      success: true,
      data: {
        material: analysis.material,
        clothingType,
        condition: analysis.condition,
        colorTone,
        pattern,
        ideas,
        mindmapImage: mindmapBase64,
        description,
      },
    });
  } catch (err) {
    console.error("scan-label error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi không xác định" },
      { status: 500 }
    );
  }
}
