import { NextRequest, NextResponse } from "next/server";
import { virtualTryOn } from "@/lib/tryon";

export async function POST(req: NextRequest) {
  try {
    const { personImageBase64, clothImageBase64, description } =
      await req.json();

    if (!personImageBase64 || !clothImageBase64) {
      return NextResponse.json(
        { error: "Cần cả ảnh người và ảnh quần áo" },
        { status: 400 }
      );
    }

    const result = await virtualTryOn(
      personImageBase64,
      clothImageBase64,
      description
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, resultImageUrl: result.resultImageUrl });
  } catch (error) {
    console.error("Try-on error:", error);
    return NextResponse.json(
      { error: "Lỗi xử lý Virtual Try-On" },
      { status: 500 }
    );
  }
}
