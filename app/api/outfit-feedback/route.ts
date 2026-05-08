import { NextRequest, NextResponse } from "next/server";
import { rateOutfit, saveOutfitRecord } from "@/lib/supabase";

// Lưu outfit record mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await saveOutfitRecord(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi lưu outfit" },
      { status: 500 }
    );
  }
}

// Cập nhật feedback/rating
export async function PATCH(req: NextRequest) {
  try {
    const { outfitId, rating, feedback, worn } = await req.json();
    await rateOutfit(outfitId, rating, feedback, worn);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi lưu feedback" },
      { status: 500 }
    );
  }
}
