import { NextResponse } from "next/server";
import { getStyleProfile } from "@/lib/supabase";

/**
 * Style training endpoint - autoTrainer đã được gỡ bỏ
 * Style profile được cập nhật thông qua feedback
 */
export async function GET() {
  try {
    const profile = await getStyleProfile("default");
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi lấy profile" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const saved = await getStyleProfile("default");
    return NextResponse.json({
      success: true,
      summary: saved?.style_summary || "Style profile đã được cập nhật qua feedback",
      profile: saved,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi train AI" },
      { status: 500 }
    );
  }
}