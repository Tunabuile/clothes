import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (action === "init-knowledge") {
      return NextResponse.json({
        success: true,
        message: "Knowledge base đã được tích hợp sẵn trong các API endpoints",
      });
    }

    if (action === "crawl-and-learn" || action === "auto-fill-closet") {
      return NextResponse.json({
        success: true,
        message: "Auto crawl hiện không khả dụng. Hãy upload ảnh thủ công.",
        crawled: 0,
        learned: 0,
        added: 0,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auto-learn error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi auto-learn" },
      { status: 500 }
    );
  }
}