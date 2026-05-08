import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRatedOutfits, saveStyleProfile } from "./supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * "Self-training" AI:
 * Đọc toàn bộ feedback của user → Gemini phân tích → tạo Style Profile
 * Profile này được inject vào prompt phối đồ để AI ngày càng chuẩn hơn
 */
export async function trainStyleProfile(userId = "default"): Promise<string> {
  const ratedOutfits = await getRatedOutfits();

  if (ratedOutfits.length === 0) {
    return "Chưa có đủ dữ liệu để train. Hãy rate thêm outfit!";
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Tóm tắt feedback cho AI phân tích
  const feedbackSummary = ratedOutfits
    .map(
      (o) =>
        `- Outfit: ${o.item_ids?.join(", ")} | Dịp: ${o.occasion} | Rating: ${o.user_rating}/5 | Feedback: "${o.user_feedback || "không có"}" | Đã mặc: ${o.worn ? "Có" : "Không"}`
    )
    .join("\n");

  const prompt = `Bạn là AI phân tích phong cách thời trang. Dựa trên lịch sử feedback outfit của người dùng, hãy phân tích và tạo Style Profile.

LỊCH SỬ FEEDBACK (${ratedOutfits.length} outfit):
${feedbackSummary}

Phân tích và trả về JSON (chỉ JSON):
{
  "total_outfits": ${ratedOutfits.length},
  "avg_rating": <tính trung bình rating>,
  "top_colors": ["màu được rate cao nhất", ...],
  "top_styles": ["phong cách được ưa thích", ...],
  "top_occasions": ["dịp hay mặc nhất", ...],
  "disliked_combos": ["combo màu/style bị rate thấp", ...],
  "liked_combos": ["combo màu/style được rate cao", ...],
  "personality_tags": ["Minimalist/Bold/Casual/Elegant/...", ...],
  "style_summary": "Mô tả ngắn về phong cách của người dùng"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI không phân tích được");

  const profile = JSON.parse(jsonMatch[0]);

  await saveStyleProfile({
    user_id: userId,
    ...profile,
  });

  return profile.style_summary || "Đã cập nhật style profile!";
}

/**
 * Tạo "system prompt" cá nhân hóa từ style profile
 * Inject vào API phối đồ để AI biết sở thích của user
 */
export function buildPersonalizedPrompt(
  styleProfile: {
    personality_tags?: string[];
    liked_combos?: string[];
    disliked_combos?: string[];
    top_colors?: string[];
    top_styles?: string[];
    avg_rating?: number;
  } | null
): string {
  if (!styleProfile) return "";

  const parts: string[] = [];

  if (styleProfile.personality_tags?.length) {
    parts.push(`Phong cách người dùng: ${styleProfile.personality_tags.join(", ")}`);
  }
  if (styleProfile.liked_combos?.length) {
    parts.push(`Combo màu/style được ưa thích: ${styleProfile.liked_combos.join(", ")}`);
  }
  if (styleProfile.disliked_combos?.length) {
    parts.push(`Tránh các combo: ${styleProfile.disliked_combos.join(", ")}`);
  }
  if (styleProfile.top_colors?.length) {
    parts.push(`Màu sắc hay dùng: ${styleProfile.top_colors.join(", ")}`);
  }
  if (styleProfile.avg_rating) {
    parts.push(`Độ khắt khe: ${styleProfile.avg_rating >= 4 ? "Dễ tính" : "Khó tính, cần phối cẩn thận"}`);
  }

  return parts.length > 0
    ? `\n\nSỞ THÍCH CÁ NHÂN (học từ lịch sử của user):\n${parts.join("\n")}\nHãy ưu tiên phối theo sở thích này.`
    : "";
}
