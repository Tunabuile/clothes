import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Chỉ tạo client khi có URL hợp lệ
const isConfigured = supabaseUrl.startsWith("http");

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createClient>);

function db() {
  if (!isConfigured) {
    throw new Error(
      "Supabase chưa được cấu hình. Xem SUPABASE_SETUP.md để setup."
    );
  }
  return supabase;
}

// ─── CLOTHING ────────────────────────────────────────────────

/** Upload ảnh lên Supabase Storage, trả về public URL */
export async function uploadClothingImage(
  base64: string,
  mimeType: string,
  itemId: string
): Promise<string> {
  const client = db();
  const ext = mimeType.split("/")[1] || "jpg";
  const path = `clothing/${itemId}.${ext}`;

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const { error } = await client.storage
    .from("fitai")
    .upload(path, bytes, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Upload ảnh thất bại: ${error.message}`);

  const { data } = client.storage.from("fitai").getPublicUrl(path);
  return data.publicUrl;
}

/** Lưu thông tin món đồ vào DB */
export async function saveClothingItem(item: {
  id: string;
  image_url: string;
  type: string;
  color: string;
  material: string;
  style: string;
  condition: string;
  tags?: string[];
}) {
  const { error } = await db().from("clothing_items").upsert({
    ...item,
    try_on_count: 0,
    added_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Lưu đồ thất bại: ${error.message}`);
}

/** Lấy tất cả đồ trong tủ */
export async function getClothingItems() {
  const { data, error } = await db()
    .from("clothing_items")
    .select("*")
    .order("added_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/** Xóa món đồ */
export async function deleteClothingItem(id: string) {
  const client = db();
  const { error } = await client.from("clothing_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await client.storage
    .from("fitai")
    .remove([
      `clothing/${id}.jpg`,
      `clothing/${id}.png`,
      `clothing/${id}.webp`,
    ]);
}

/** Tăng try_on_count */
export async function incrementTryOnCount(id: string) {
  await db().rpc("increment_try_on_count", { item_id: id });
}

// ─── OUTFIT RECORDS ──────────────────────────────────────────

/** Lưu outfit combo AI gợi ý */
export async function saveOutfitRecord(record: {
  id: string;
  item_ids: string[];
  occasion: string;
  weather: string;
  ai_reasoning: string;
  ai_tips: string;
  ai_score: number;
}) {
  const { error } = await db().from("outfit_records").insert({
    ...record,
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/** User feedback cho outfit → AI học từ đây */
export async function rateOutfit(
  outfitId: string,
  rating: number,
  feedback: string,
  worn: boolean
) {
  const { error } = await db()
    .from("outfit_records")
    .update({ user_rating: rating, user_feedback: feedback, worn })
    .eq("id", outfitId);
  if (error) throw new Error(error.message);
}

/** Lấy lịch sử outfit đã rated */
export async function getRatedOutfits() {
  const { data, error } = await db()
    .from("outfit_records")
    .select("*")
    .not("user_rating", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// ─── AI STYLE PROFILE ────────────────────────────────────────

/** Lưu/cập nhật AI style profile */
export async function saveStyleProfile(profile: {
  user_id: string;
  total_outfits: number;
  avg_rating: number;
  top_colors: string[];
  top_styles: string[];
  top_occasions: string[];
  disliked_combos: string[];
  liked_combos: string[];
  personality_tags: string[];
  style_summary?: string;
  color_preferences?: { loves?: string[]; avoids?: string[]; neutral_heavy?: boolean };
  outfit_rules?: string[];
}) {
  const { error } = await db().from("ai_style_profiles").upsert({
    ...profile,
    last_updated: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/** Lấy style profile */
export async function getStyleProfile(userId = "default") {
  const { data } = await db()
    .from("ai_style_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data;
}
