import { NextRequest, NextResponse } from "next/server";
import { outfitTryOn, generativeFill, accessoryTryOn } from "@/lib/tryon";
import { preprocessPersonImage } from "@/lib/imagePreprocess";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode } = body; // "outfit" | "inpaint" | "accessory"

    if (mode === "outfit") {
      let { personImageBase64, clothImageBase64, description } = body;
      if (!personImageBase64 || !clothImageBase64) {
        return NextResponse.json(
          { error: "Cần cả ảnh người và ảnh quần áo" },
          { status: 400 }
        );
      }

      // Bước 1: Xóa background ảnh người để try-on đẹp hơn
      const cleanedPersonImage = await preprocessPersonImage(personImageBase64);

      // Bước 2: Try-On
      const result = await outfitTryOn(cleanedPersonImage, clothImageBase64, description);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        resultImageUrl: result.resultImageUrl,
        resultBase64: result.resultBase64,
        modelUsed: result.modelUsed,
        preprocessed: cleanedPersonImage !== personImageBase64, // đã xóa bg chưa
      });
    }

    if (mode === "inpaint") {
      const { imageBase64, maskBase64, prompt } = body;
      if (!imageBase64 || !prompt) {
        return NextResponse.json(
          { error: "Cần ảnh và prompt mô tả" },
          { status: 400 }
        );
      }
      const result = await generativeFill(imageBase64, maskBase64 || "", prompt);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        resultImageUrl: result.resultImageUrl,
        resultBase64: result.resultBase64,
        modelUsed: result.modelUsed,
      });
    }

    if (mode === "accessory") {
      const { personImageBase64, accessoryType, accessoryDescription } = body;
      if (!personImageBase64 || !accessoryType || !accessoryDescription) {
        return NextResponse.json(
          { error: "Cần ảnh người, loại phụ kiện và mô tả" },
          { status: 400 }
        );
      }
      const result = await accessoryTryOn(
        personImageBase64,
        accessoryType as any,
        accessoryDescription
      );
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({
        success: true,
        resultImageUrl: result.resultImageUrl,
        resultBase64: result.resultBase64,
        modelUsed: result.modelUsed,
      });
    }

    return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
  } catch (error) {
    console.error("Try-on error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi xử lý" },
      { status: 500 }
    );
  }
}