import { NextRequest, NextResponse } from "next/server";
import {
  listCommunityRecycleIdeas,
  insertCommunityRecycleIdea,
  type CommunityRecycleInsert,
  type CommunityRecycleRow,
} from "@/lib/supabase";

function supabaseReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.startsWith("http");
}

function rowToApi(r: CommunityRecycleRow) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    difficulty: r.difficulty,
    time: r.time_estimate,
    materials_needed: r.materials_needed ?? [],
    clothingType: r.clothing_types ?? [],
    tags: r.tags ?? [],
    likes: r.likes ?? 0,
    searchQuery: r.search_query,
    tutorialUrl: r.tutorial_url || undefined,
    tutorialLabel: r.tutorial_label || undefined,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function GET() {
  if (!supabaseReady()) {
    return NextResponse.json({ configured: false, ideas: [] });
  }
  try {
    const rows = await listCommunityRecycleIdeas();
    return NextResponse.json({
      configured: true,
      ideas: rows.map(rowToApi),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi tải ý tưởng" },
      { status: 500 }
    );
  }
}

const ALLOWED_CAT = new Set(["Tái chế", "Upcycle"]);
const ALLOWED_DIFF = new Set(["Rất dễ", "Dễ", "Trung bình", "Khó"]);

export async function POST(req: NextRequest) {
  if (!supabaseReady()) {
    return NextResponse.json(
      {
        error:
          "Supabase chưa cấu hình hoặc chưa tạo bảng. Xem SUPABASE_SETUP.md (mục community_recycle_ideas).",
      },
      { status: 503 }
    );
  }
  try {
    const body = await req.json();
    const title = String(body.title || "").trim().slice(0, 200);
    const description = String(body.description || "").trim().slice(0, 8000);
    if (!title || !description) {
      return NextResponse.json({ error: "Thiếu tên hoặc mô tả." }, { status: 400 });
    }
    let category = String(body.category || "Upcycle");
    if (!ALLOWED_CAT.has(category)) category = "Upcycle";
    let difficulty = String(body.difficulty || "Dễ");
    if (!ALLOWED_DIFF.has(difficulty)) difficulty = "Dễ";
    const time_estimate = String(body.time || body.time_estimate || "30 phút")
      .trim()
      .slice(0, 80);
    const materials_needed = Array.isArray(body.materials_needed)
      ? (body.materials_needed as unknown[]).map((x) => String(x))
      : [];
    const clothing_types = Array.isArray(body.clothingType)
      ? (body.clothingType as unknown[]).map((x) => String(x))
      : Array.isArray(body.clothing_types)
        ? (body.clothing_types as unknown[]).map((x) => String(x))
        : [];
    const tags = Array.isArray(body.tags)
      ? (body.tags as unknown[]).map((x) => String(x)).map((t) => t.slice(0, 48))
      : [];
    const search_query = String(
      body.searchQuery || body.search_query || `${title} DIY handmade`
    )
      .trim()
      .slice(0, 300);
    const rawUrl = body.tutorialUrl ?? body.tutorial_url;
    const rawLabel = body.tutorialLabel ?? body.tutorial_label;
    const tutorial_url = rawUrl ? String(rawUrl).trim().slice(0, 2000) : null;
    const tutorial_label = rawLabel ? String(rawLabel).trim().slice(0, 120) : null;

    const insert: CommunityRecycleInsert = {
      title,
      description,
      category,
      difficulty,
      time_estimate,
      materials_needed: materials_needed.slice(0, 50).map((m) => m.slice(0, 120)),
      clothing_types: clothing_types.slice(0, 20).map((m) => m.slice(0, 80)),
      tags: tags.slice(0, 30),
      search_query,
      tutorial_url,
      tutorial_label,
    };
    const row = await insertCommunityRecycleIdea(insert);
    return NextResponse.json({ success: true, idea: rowToApi(row) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi lưu" },
      { status: 500 }
    );
  }
}
