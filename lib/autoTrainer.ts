/**
 * Auto-Training Engine
 * Tự động train AI sau mỗi 3 lần feedback mới
 * Không cần user nhấn nút "Train AI"
 */

import { getRatedOutfits, saveStyleProfile, getStyleProfile } from "./supabase";
import { generateText, extractJSON } from "./hf";
import { evaluateColorCombo } from "./colorTheory";

const AUTO_TRAIN_THRESHOLD = 3; // train sau mỗi 3 feedback mới

/**
 * Kiểm tra xem có cần auto-train không
 * So sánh số outfit đã rate với số lần đã train
 */
export async function checkAndAutoTrain(userId = "default"): Promise<{
  trained: boolean;
  reason: string;
}> {
  try {
    const [ratedOutfits, profile] = await Promise.all([
      getRatedOutfits(),
      getStyleProfile(userId),
    ]);

    const totalRated = ratedOutfits.length;
    const lastTrainedCount = profile?.total_outfits || 0;
    const newFeedbackCount = totalRated - lastTrainedCount;

    if (newFeedbackCount >= AUTO_TRAIN_THRESHOLD) {
      await deepTrainStyleProfile(userId, ratedOutfits);
      return {
        trained: true,
        reason: `Auto-trained sau ${newFeedbackCount} feedback mới`,
      };
    }

    return {
      trained: false,
      reason: `Cần thêm ${AUTO_TRAIN_THRESHOLD - newFeedbackCount} feedback nữa để auto-train`,
    };
  } catch {
    return { trained: false, reason: "Lỗi auto-train" };
  }
}

/**
 * Deep training - phân tích sâu hơn, kết hợp color theory
 */
export async function deepTrainStyleProfile(
  userId = "default",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ratedOutfits?: any[]
) {
  const outfits = ratedOutfits || (await getRatedOutfits());
  if (outfits.length === 0) return null;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Phân tích color theory từ các outfit được rate cao
  const highRatedOutfits = outfits.filter((o) => (o.user_rating || 0) >= 4);
  const lowRatedOutfits = outfits.filter((o) => (o.user_rating || 0) <= 2);

  // Tóm tắt feedback
  const feedbackSummary = outfits
    .map(
      (o) =>
        `Rating ${o.user_rating}/5 | Dịp: ${o.occasion} | Feedback: "${o.user_feedback || "không có"}" | Đã mặc: ${o.worn ? "Có" : "Không"}`
    )
    .join("\n");

  const prompt = `Bạn là AI stylist chuyên nghiệp. Phân tích lịch sử outfit và tạo Style Profile cá nhân hóa.

LỊCH SỬ FEEDBACK (${outfits.length} outfit):
${feedbackSummary}

THỐNG KÊ:
- Outfit được rate cao (4-5 sao): ${highRatedOutfits.length}
- Outfit bị rate thấp (1-2 sao): ${lowRatedOutfits.length}
- Đã mặc thật: ${outfits.filter((o) => o.worn).length}

Phân tích và trả về JSON (chỉ JSON):
{
  "total_outfits": ${outfits.length},
  "avg_rating": <tính trung bình>,
  "top_colors": ["màu được rate cao nhất"],
  "top_styles": ["phong cách được ưa thích"],
  "top_occasions": ["dịp hay mặc nhất"],
  "disliked_combos": ["combo màu/style bị rate thấp"],
  "liked_combos": ["combo màu/style được rate cao"],
  "personality_tags": ["Minimalist/Bold/Casual/Elegant/Streetwear/..."],
  "style_summary": "Mô tả ngắn về phong cách cá nhân",
  "color_preferences": {
    "loves": ["màu yêu thích"],
    "avoids": ["màu không thích"],
    "neutral_heavy": true/false
  },
  "outfit_rules": [
    "Quy tắc phối đồ cá nhân học được từ feedback"
  ]
}`;

  const text = await generateText(prompt);
  const profile = extractJSON(text);

  await saveStyleProfile({
    user_id: userId,
    total_outfits: profile.total_outfits,
    avg_rating: profile.avg_rating,
    top_colors: profile.top_colors || [],
    top_styles: profile.top_styles || [],
    top_occasions: profile.top_occasions || [],
    disliked_combos: profile.disliked_combos || [],
    liked_combos: profile.liked_combos || [],
    personality_tags: profile.personality_tags || [],
    style_summary: profile.style_summary,
    color_preferences: profile.color_preferences,
    outfit_rules: profile.outfit_rules || [],
  });

  return profile;
}

/**
 * Tạo personalized prompt cực kỳ chi tiết cho AI phối đồ
 * Kết hợp style profile + color theory
 */
export function buildDeepPersonalizedPrompt(
  styleProfile: {
    personality_tags?: string[];
    liked_combos?: string[];
    disliked_combos?: string[];
    top_colors?: string[];
    top_styles?: string[];
    avg_rating?: number;
    outfit_rules?: string[];
    color_preferences?: {
      loves?: string[];
      avoids?: string[];
      neutral_heavy?: boolean;
    };
  } | null,
  clothColors: string[]
): string {
  if (!styleProfile) return "";

  const parts: string[] = ["\n\n=== STYLE PROFILE CÁ NHÂN ==="];

  if (styleProfile.personality_tags?.length) {
    parts.push(`Phong cách: ${styleProfile.personality_tags.join(", ")}`);
  }

  if (styleProfile.outfit_rules?.length) {
    parts.push(`Quy tắc phối đồ của user:\n${styleProfile.outfit_rules.map((r) => `• ${r}`).join("\n")}`);
  }

  if (styleProfile.color_preferences?.loves?.length) {
    parts.push(`Màu yêu thích: ${styleProfile.color_preferences.loves.join(", ")}`);
  }

  if (styleProfile.color_preferences?.avoids?.length) {
    parts.push(`Màu không thích: ${styleProfile.color_preferences.avoids.join(", ")}`);
  }

  if (styleProfile.liked_combos?.length) {
    parts.push(`Combo hay phối: ${styleProfile.liked_combos.join(", ")}`);
  }

  if (styleProfile.disliked_combos?.length) {
    parts.push(`Tránh combo: ${styleProfile.disliked_combos.join(", ")}`);
  }

  // Thêm color theory analysis cho các màu hiện tại
  if (clothColors.length >= 2) {
    const colorEval = evaluateColorCombo(clothColors);
    if (colorEval.score > 0) {
      parts.push(`\nPhân tích màu sắc hiện tại (Color Theory):\n• Score: ${colorEval.score}/100\n• ${colorEval.advice}`);
    }
  }

  parts.push("=== HẾT PROFILE ===\nHãy ưu tiên phối theo profile trên.");

  return parts.join("\n");
}
