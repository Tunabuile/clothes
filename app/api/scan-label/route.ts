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
  let lang = "vi";
  try {
    const body = await req.json();
    lang = body.lang || "vi";
    const { imageBase64, mimeType } = body;
    const isVi = lang !== "en";

    if (!imageBase64) {
      return NextResponse.json(
        { error: isVi ? "Thiếu ảnh" : "Missing image" },
        { status: 400 }
      );
    }
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: isVi ? "Thiếu OPENAI_API_KEY trong .env.local" : "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const dataUrl = `data:${mimeType || "image/jpeg"};base64,${base64Data}`;

    // ─── Step 1: Vision — analyze colors, patterns, 5 ideas ───
    const visionPrompt = isVi
      ? `Bạn là chuyên gia upcycle thời trang. Nhìn kỹ ảnh quần áo và trả về JSON thuần (không markdown):

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
- colorTone và pattern phải mô tả CHÍNH XÁC những gì thấy trên ảnh`
      : `You are a fashion upcycle expert. Look carefully at the clothing image and return ONLY valid JSON (no markdown):

{
  "material": "fabric material (e.g. 100% Cotton, Denim...)",
  "clothingType": "clothing type in English (e.g. Denim jacket, Jeans...)",
  "condition": "New / Good / Worn",
  "colorTone": "detailed description of main and secondary colors (English, e.g. dark denim blue, light yellow trim)",
  "pattern": "detailed description of pattern/texture/fabric weave (English, e.g. rough denim, white lace with yellow flowers along side)",
  "ideas": [
    {
      "title": "Recycled product name in English",
      "category": "Recycle or Upcycle",
      "difficulty": "Very Easy / Easy / Medium / Hard",
      "time": "e.g. 30 min",
      "description": "Short making steps in English (2-3 sentences)"
    }
  ]
}

Requirements:
- Exactly 5 CREATIVE, fashionable ideas (bag, dress, backpack, accessory, nice decor...)
- DO NOT suggest: rags, cleaning cloths, simple hair ties
- colorTone and pattern must describe EXACTLY what is visible in the image`;

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
              { type: "text", text: visionPrompt },
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
        { error: isVi ? `OpenAI lỗi ${visionRes.status}: ${errText.slice(0, 200)}` : `OpenAI error ${visionRes.status}: ${errText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const visionData = await visionRes.json();
    const content = visionData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: isVi ? "AI không trả về kết quả hợp lệ" : "AI did not return valid JSON" },
        { status: 500 }
      );
    }

    const analysis = JSON.parse(jsonMatch[0]);
    const clothingType = analysis.clothingType || (isVi ? "quần áo" : "clothing");
    const colorTone = analysis.colorTone || analysis.color || (isVi ? "màu gốc của vải" : "original fabric color");
    const pattern = analysis.pattern || (isVi ? "họa tiết gốc" : "original pattern");
    const ideas: RecycleIdea[] = (analysis.ideas || []).slice(0, 5);

    // ─── Step 2: DALL-E 3 — mindmap 1 image, 5 products same color/pattern ───
    const branches = ideas
      .map(
        (idea, idx) =>
          `Branch ${idx + 1} (top-right area, clockwise): illustrated "${idea.title}" handmade product made from the SAME fabric — identical ${colorTone} colors and ${pattern} pattern/texture as center garment`
      )
      .join(". ");

    const mindmapPrompt = `Realistic fashion upcycle MIND MAP photomontage, square 1024 layout, clean white background, beautifully styled REAL PHOTOGRAPHIC composition (NOT illustration, NOT cartoon).

CENTER: one ${clothingType} garment, photographed in natural lighting, showing exact real fabric color tones: ${colorTone}, and exact fabric pattern/texture: ${pattern}.

Five white transparent label frames arranged in a circle around the center, each connected by subtle thin arrows. ${branches}.

CRITICAL: every recycled product in the branches MUST visibly reuse the SAME color palette and SAME fabric pattern/texture as the center garment — cohesive upcycle collection.

Style: REALISTIC, high-resolution product photography, soft studio lighting, lifelike textures, subtle labels with small readable ${isVi ? "Vietnamese" : "English"} text, minimalist and elegant fashion editorial look. No illustrations, no cartoons, no watermarks.`;

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
              : isVi
                ? "Không tạo được ảnh mindmap. Kiểm tra key OpenAI có quyền DALL-E 3."
                : "Cannot generate mindmap image. Check OpenAI key has DALL-E 3 access.",
        },
        { status: 500 }
      );
    }

    // ─── Step 3: Detailed description of each product ───
    const descLang = isVi ? "tiếng Việt" : "English";
    const descPrompt = isVi
      ? `Viết bằng tiếng Việt cho mindmap tái chế từ ${clothingType}.
Tông màu gốc: ${colorTone}. Hoa văn/kết cấu: ${pattern}.

Cấu trúc:
1. Một đoạn mở đầu 2 câu giới thiệu mindmap.
2. Danh sách đánh số 1-5, mỗi mục gồm: **Tên sản phẩm** — mô tả cách làm (2 câu), độ khó và thời gian.

Dữ liệu ý tưởng:
${JSON.stringify(ideas, null, 2)}`
      : `Write in English for the recycling mindmap from ${clothingType}.
Original color tones: ${colorTone}. Pattern/texture: ${pattern}.

Structure:
1. An opening paragraph (2 sentences) introducing the mindmap.
2. Numbered list 1-5, each item: **Product name** — making steps description (2 sentences), difficulty and time.

Ideas data:
${JSON.stringify(ideas, null, 2)}`;

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
            content: descPrompt,
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
      { error: err instanceof Error ? err.message : (typeof lang !== "undefined" && lang !== "en" ? "Lỗi không xác định" : "Unknown error") },
      { status: 500 }
    );
  }
}