import { NextRequest, NextResponse } from "next/server";
import {
  autoCrawlFashionImages,
  crawlClothingItems,
  downloadImageAsBase64,
} from "@/lib/autoCrawler";
import {
  buildBaseKnowledge,
  learnFromFashionImages,
  autoAnalyzeClothingFromUrl,
} from "@/lib/fashionKnowledge";
import { saveClothingItem, uploadClothingImage } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { action, count } = await req.json();

    if (action === "init-knowledge") {
      // Khởi tạo base knowledge từ fashion trends
      await buildBaseKnowledge("default");
      return NextResponse.json({
        success: true,
        message: "Đã khởi tạo fashion knowledge base",
      });
    }

    if (action === "crawl-and-learn") {
      // Crawl ảnh fashion từ internet
      const images = await autoCrawlFashionImages(count || 20);
      const imageUrls = images.map((img) => img.url);

      // AI tự học từ ảnh
      const result = await learnFromFashionImages(imageUrls, "default");

      return NextResponse.json({
        success: true,
        crawled: images.length,
        learned: result.learned,
        insights: result.insights.slice(0, 5),
      });
    }

    if (action === "auto-fill-closet") {
      // Tự động điền tủ đồ từ ảnh crawl
      const images = await crawlClothingItems(count || 10);
      const added: string[] = [];

      for (const img of images.slice(0, 10)) {
        try {
          // Phân tích ảnh
          const analysis = await autoAnalyzeClothingFromUrl(img.url);

          // Download và upload lên Supabase
          const itemId = crypto.randomUUID();
          const base64 = await downloadImageAsBase64(img.thumbnail);
          const imageUrl = await uploadClothingImage(base64, "image/jpeg", itemId);

          // Lưu vào DB
          await saveClothingItem({
            id: itemId,
            image_url: imageUrl,
            type: analysis.type,
            color: analysis.color,
            material: analysis.material,
            style: analysis.style,
            condition: analysis.condition,
            tags: analysis.tags,
          });

          added.push(analysis.type);
        } catch (err) {
          console.error("Auto-fill error:", err);
        }
      }

      return NextResponse.json({
        success: true,
        added: added.length,
        items: added,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auto-learn error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Lỗi auto-learn",
      },
      { status: 500 }
    );
  }
}
