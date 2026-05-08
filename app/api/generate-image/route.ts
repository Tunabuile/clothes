import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, aspectRatio } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Cần nhập mô tả" }, { status: 400 });
    }

    // Build prompt chi tiết cho fashion
    const styleMap: Record<string, string> = {
      realistic: "photorealistic, high quality fashion photography, studio lighting",
      anime: "anime style, vibrant colors, clean lines",
      sketch: "fashion sketch, pencil drawing, designer illustration",
      watercolor: "watercolor painting, soft colors, artistic",
    };

    const fullPrompt = `Fashion clothing item: ${prompt}. Style: ${styleMap[style] || styleMap.realistic}. White background, centered composition, full item visible.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: fullPrompt,
      config: {
        responseModalities: ["IMAGE"],
        responseFormat: {
          image: {
            aspectRatio: aspectRatio || "1:1",
          },
        },
      } as Parameters<typeof ai.models.generateContent>[0]["config"],
    });

    // Lấy ảnh từ response
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("Không nhận được ảnh từ AI");

    for (const part of parts) {
      if (part.inlineData?.data) {
        return NextResponse.json({
          success: true,
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        });
      }
    }

    throw new Error("AI không trả về ảnh");
  } catch (error) {
    console.error("Generate image error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Lỗi tạo ảnh. Thử lại nhé!",
      },
      { status: 500 }
    );
  }
}
