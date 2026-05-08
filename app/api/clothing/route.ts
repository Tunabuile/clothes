import { NextRequest, NextResponse } from "next/server";
import {
  getClothingItems,
  saveClothingItem,
  deleteClothingItem,
  uploadClothingImage,
} from "@/lib/supabase";

// Lấy tất cả đồ
export async function GET() {
  try {
    const items = await getClothingItems();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi lấy dữ liệu" },
      { status: 500 }
    );
  }
}

// Lưu món đồ mới (upload ảnh + lưu DB)
export async function POST(req: NextRequest) {
  try {
    const { item, imageBase64, mimeType } = await req.json();

    let imageUrl = item.imageUrl;

    // Upload ảnh lên Supabase Storage nếu có base64
    if (imageBase64 && item.id) {
      imageUrl = await uploadClothingImage(imageBase64, mimeType || "image/jpeg", item.id);
    }

    await saveClothingItem({ ...item, image_url: imageUrl });

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi lưu đồ" },
      { status: 500 }
    );
  }
}

// Xóa món đồ
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await deleteClothingItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi xóa đồ" },
      { status: 500 }
    );
  }
}
