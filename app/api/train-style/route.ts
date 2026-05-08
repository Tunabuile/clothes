import { NextResponse } from "next/server";
import { deepTrainStyleProfile } from "@/lib/autoTrainer";
import { getStyleProfile } from "@/lib/supabase";

export async function POST() {
  try {
    const profile = await deepTrainStyleProfile("default");
    const saved = await getStyleProfile("default");
    return NextResponse.json({
      success: true,
      summary: profile?.style_summary || "Đã cập nhật style profile!",
      profile: saved,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi train AI" },
      { status: 500 }
    );
  }
}

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
