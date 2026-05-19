import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

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

    // ─── Bước 1: GPT-4o vision phân tích ảnh quần áo ───────
    const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              {
                type: "text",
                text: `Bạn là chuyên gia upcycle thời trang sáng tạo. Nhìn vào ảnh quần áo này.

Hãy phân tích và trả về JSON thuần (không text khác):
{
  "material": "chất liệu (vd: 100% Cotton, Denim, Polyester...)",
  "clothingType": "loại đồ (vd: Áo thun, Quần jeans, Áo sơ mi...)",
  "condition": "tình trạng (Mới, Còn tốt, Cũ)",
  "ideas": [
    {
      "title": "Tên ý tưởng sáng tạo",
      "category": "Tái chế hoặc Upcycle",
      "difficulty": "Rất dễ hoặc Dễ hoặc Trung bình hoặc Khó",
      "time": "thời gian vd 20 phút",
      "description": "Mô tả cách làm chi tiết bằng tiếng Việt"
    }
  ]
}

Đưa ra 4-5 ý tưởng SÁNG TẠO, thời trang (túi xách, phụ kiện, trang phục mới, đồ decor đẹp...).
TUYỆT ĐỐI KHÔNG gợi ý: giẻ lau, khăn lau, dây buộc tóc đơn giản.
Ưu tiên: upcycle thành item thời trang mặc được, phụ kiện trendy.`,
              },
            ],
          },
        ],
        max_tokens: 1200,
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
    const ideas = analysis.ideas || [];

    // ─── Bước 2: DALL-E 3 tạo mindmap (ưu tiên) → FLUX fallback ──
    const ideasText = ideas.slice(0, 4).map((i: any, idx: number) => `${idx + 1}. ${i.title}`).join(", ");
    const mindmapPrompt = `Create a mind map infographic about recycling/upcycling fashion. At the CENTER of the image, place a realistic photo of a ${clothingType}. Around it, draw 4 arrows pointing to 4 recycled product ideas: ${ideasText}. The style should be clean, modern infographic, white background, professional, with icons and arrows connecting the center to each idea. Text labels in English. High quality, minimalist design.`;

    let mindmapBase64 = "";

    // Thử DALL-E 3 trước
    try {
      const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: "dall-e-3", prompt: mindmapPrompt, n: 1, size: "1024x1024" }),
      });
      if (dalleRes.ok) {
        const dalleData = await dalleRes.json();
        const imgUrl = dalleData?.data?.[0]?.url;
        if (imgUrl) {
          const imgRes = await fetch(imgUrl);
          mindmapBase64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
        }
      }
    } catch (e) { console.warn("DALL-E mindmap failed:", e); }

    // Fallback FLUX
    if (!mindmapBase64) {
      try {
        const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
        const fluxRes = await fetch("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell", {
          method: "POST", headers: { "Content-Type": "application/json", ...(HF_TOKEN ? { Authorization: `Bearer ${HF_TOKEN}` } : {}) },
          body: JSON.stringify({ inputs: mindmapPrompt }),
        });
        if (fluxRes.ok) {
          mindmapBase64 = Buffer.from(await fluxRes.arrayBuffer()).toString("base64");
        }
      } catch (e) { console.warn("FLUX mindmap failed:", e); }
    }

    // ─── Bước 3: Tạo description tổng quan ─────────────────
    const descRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Tóm tắt ngắn gọn bằng tiếng Việt (2-3 câu) về các ý tưởng tái chế cho ${clothingType} này. Phân tích nhanh: ${JSON.stringify(ideas.map((i: any) => i.title))}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
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
        ...analysis,
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