import { NextRequest, NextResponse } from "next/server";
import { describeOutfit } from "@/lib/huggingface";

export async function POST(req: NextRequest) {
  try {
    const { personImageBase64, clothImageBase64, height, weight, userRequest } =
      await req.json();

    if (!personImageBase64 || !clothImageBase64) {
      return NextResponse.json(
        { error: "Cần cả ảnh người và ảnh quần áo" },
        { status: 400 }
      );
    }

    const resultText = await describeOutfit(
      personImageBase64,
      clothImageBase64,
      Number(height || 170),
      Number(weight || 60),
      userRequest || ""
    );

    return NextResponse.json({ success: true, resultText });
  } catch (error) {
    console.error("Describe outfit error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Không thể mô tả outfit. Thử lại sau.",
      },
      { status: 500 }
    );
  }
}
