/**
 * Fashion Knowledge Base
 * AI tự học từ dataset fashion lớn — không cần user feedback
 * Bao gồm: xu hướng 2025, quy tắc phối đồ, color combinations
 */

import { generateText } from "./huggingface";
import { saveStyleProfile, getStyleProfile } from "./supabase";
import { evaluateColorCombo } from "./colorTheory";

function extractJSON(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Cannot extract JSON from response");
  return JSON.parse(jsonMatch[0]);
}

// ─── FASHION TREND DATABASE ───────────────────────────────────

export const FASHION_TRENDS_2025 = {
  colors: {
    trending: ["Mocha Mousse", "Butter Yellow", "Sage Green", "Dusty Rose", "Cobalt Blue", "Terracotta"],
    classic: ["Trắng", "Đen", "Navy", "Xám", "Be", "Nâu"],
    avoid: ["Neon quá chói", "Màu quá cũ"],
  },
  styles: {
    hot: ["Quiet Luxury", "Coastal Grandmother", "Gorpcore", "Mob Wife", "Clean Girl"],
    classic: ["Minimalist", "Business Casual", "Smart Casual", "Athleisure"],
  },
  combos: [
    { items: ["Áo trắng", "Quần jeans xanh"], score: 95, occasion: "Hàng ngày" },
    { items: ["Blazer be", "Quần trắng"], score: 92, occasion: "Đi làm" },
    { items: ["Áo đen", "Quần đen"], score: 88, occasion: "Tối giản" },
    { items: ["Áo kẻ sọc", "Quần jeans"], score: 85, occasion: "Casual" },
    { items: ["Áo hoodie xám", "Quần jogger"], score: 82, occasion: "Thể thao" },
    { items: ["Váy midi", "Áo len mỏng"], score: 90, occasion: "Đi chơi" },
    { items: ["Áo linen trắng", "Quần linen be"], score: 93, occasion: "Đi biển" },
    { items: ["Blazer navy", "Áo trắng", "Quần xám"], score: 91, occasion: "Đi làm" },
  ],
  rules: [
    "Không mặc quá 3 màu nổi cùng lúc",
    "Màu trung tính (trắng/đen/xám/be) đi với mọi màu",
    "Complementary colors tạo điểm nhấn mạnh",
    "Monochromatic look luôn thanh lịch",
    "Phối đồ theo tỉ lệ 60-30-10 (màu chủ đạo - phụ - điểm nhấn)",
    "Đồ fitted + đồ oversized = cân bằng tốt",
    "Texture mixing: smooth + rough = thú vị",
    "Pattern mixing: chỉ 1 pattern nổi, còn lại solid",
  ],
};

// ─── AUTO KNOWLEDGE BUILDER ──────────────────────────────────

/**
 * AI tự học từ fashion knowledge base (không cần user)
 * Chạy khi app khởi động hoặc theo schedule
 */
export async function buildBaseKnowledge(userId = "default"): Promise<void> {
  const existing = await getStyleProfile(userId).catch(() => null);

  // Nếu đã có profile từ user feedback, không ghi đè
  if (existing && existing.total_outfits > 0) return;

  // Build base knowledge từ fashion trends
  const baseProfile = {
    user_id: userId,
    total_outfits: 0,
    avg_rating: 0,
    top_colors: FASHION_TRENDS_2025.colors.classic,
    top_styles: FASHION_TRENDS_2025.styles.classic,
    top_occasions: ["Hàng ngày", "Đi làm", "Đi chơi"],
    liked_combos: FASHION_TRENDS_2025.combos.slice(0, 5).map((c) => c.items.join(" + ")),
    disliked_combos: [],
    personality_tags: ["Minimalist", "Classic"],
    style_summary: "Phong cách cơ bản, dễ phối. AI sẽ học thêm từ feedback của bạn.",
    color_preferences: {
      loves: FASHION_TRENDS_2025.colors.classic,
      avoids: FASHION_TRENDS_2025.colors.avoid,
      neutral_heavy: true,
    },
    outfit_rules: FASHION_TRENDS_2025.rules,
  };

  await saveStyleProfile(baseProfile);
}

/**
 * AI tự phân tích ảnh fashion từ internet và học xu hướng
 * Dùng Gemini Vision để extract thông tin từ ảnh
 */
export async function learnFromFashionImages(
  imageUrls: string[],
  userId = "default"
): Promise<{ learned: number; insights: string[] }> {
  const insights: string[] = [];
  let learned = 0;

  // Phân tích từng batch ảnh
  for (let i = 0; i < imageUrls.length; i += 5) {
    const batch = imageUrls.slice(i, i + 5);

    try {
      const prompt = `Phân tích ${batch.length} thời trang URLs này và extract insights về trend, style, màu sắc.
URLs: ${batch.join(", ")}

Trả về JSON:
{
  "trending_colors": ["màu đang trend"],
  "trending_styles": ["phong cách đang hot"],
  "good_combos": ["combo đồ đẹp"],
  "outfit_rules": ["quy tắc phối đồ học được"],
  "season": "mùa phù hợp"
}`;

      const text = await generateText(prompt, 150);
      const data = extractJSON(text);
      insights.push(...(data.outfit_rules as string[] || []));
      learned += batch.length;
    } catch (err) {
      console.error("Learn from images error:", err);
    }
  }

  // Cập nhật profile với insights mới
  if (insights.length > 0) {
    const existing = await getStyleProfile(userId).catch(() => null);
    if (existing) {
      const existingRules = existing.outfit_rules || [];
      const newRules = [...new Set([...existingRules, ...insights])].slice(0, 20);
      await saveStyleProfile({
        ...existing,
        outfit_rules: newRules,
      });
    }
  }

  return { learned, insights };
}

/**
 * Tự động phân tích và phân loại ảnh đồ từ URL
 * Không cần user upload — AI tự làm
 */
export async function autoAnalyzeClothingFromUrl(imageUrl: string): Promise<{
  type: string;
  color: string;
  material: string;
  style: string;
  condition: string;
  tags: string[];
  trendScore: number;
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Download ảnh
  const res = await fetch(imageUrl);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const prompt = `Phân tích ảnh quần áo này. Trả về JSON (chỉ JSON):
{
  "type": "loại đồ (T-shirt/Jeans/Dress/...)",
  "color": "màu chính",
  "material": "chất liệu",
  "style": "phong cách (Casual/Formal/...)",
  "condition": "New",
  "tags": ["tag1", "tag2"],
  "trendScore": 75
}`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64, mimeType: "image/jpeg" } },
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Không phân tích được ảnh");

  return JSON.parse(jsonMatch[0]);
}

/**
 * Tự động tạo outfit suggestions từ fashion knowledge
 * Không cần tủ đồ của user
 */
export async function generateFashionInspirations(
  occasion: string,
  weather: string,
  userStyle?: string
): Promise<{
  outfits: { name: string; items: string[]; description: string; score: number }[];
  trendingNow: string[];
}> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const trendContext = `
Xu hướng 2025: ${FASHION_TRENDS_2025.styles.hot.join(", ")}
Màu trending: ${FASHION_TRENDS_2025.colors.trending.join(", ")}
Quy tắc: ${FASHION_TRENDS_2025.rules.slice(0, 3).join("; ")}`;

  const prompt = `Bạn là AI stylist biết xu hướng thời trang 2025.
${trendContext}

Tạo 3 outfit inspiration cho:
- Dịp: ${occasion}
- Thời tiết: ${weather}
- Phong cách user: ${userStyle || "Không xác định"}

Trả về JSON:
{
  "outfits": [
    {
      "name": "Tên outfit",
      "items": ["Áo trắng basic", "Quần jeans xanh", "Giày trắng"],
      "description": "Mô tả outfit",
      "score": 90
    }
  ],
  "trendingNow": ["trend đang hot nhất"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI không tạo được inspiration");

  return JSON.parse(jsonMatch[0]);
}

/**
 * Color compatibility matrix từ fashion knowledge
 */
export function getColorCompatibilityFromKnowledge(
  color: string
): { compatible: string[]; avoid: string[]; trending: string[] } {
  const colorLower = color.toLowerCase();

  // Rules từ fashion knowledge
  const rules: Record<string, { compatible: string[]; avoid: string[]; trending: string[] }> = {
    trắng: {
      compatible: ["Đen", "Navy", "Xanh dương", "Đỏ", "Vàng", "Xanh lá"],
      avoid: ["Kem", "Be nhạt"],
      trending: ["Cobalt Blue", "Terracotta", "Sage Green"],
    },
    đen: {
      compatible: ["Trắng", "Đỏ", "Vàng", "Xanh dương", "Hồng"],
      avoid: ["Xám đậm", "Navy"],
      trending: ["Butter Yellow", "Dusty Rose"],
    },
    navy: {
      compatible: ["Trắng", "Be", "Vàng nhạt", "Đỏ"],
      avoid: ["Đen", "Xanh dương"],
      trending: ["Mocha Mousse", "Butter Yellow"],
    },
    xám: {
      compatible: ["Trắng", "Đen", "Xanh dương", "Hồng", "Vàng"],
      avoid: ["Nâu", "Xanh rêu"],
      trending: ["Cobalt Blue", "Dusty Rose"],
    },
    be: {
      compatible: ["Trắng", "Nâu", "Xanh rêu", "Đen", "Camel"],
      avoid: ["Vàng", "Cam"],
      trending: ["Sage Green", "Terracotta"],
    },
  };

  const key = Object.keys(rules).find((k) => colorLower.includes(k));
  if (key) return rules[key];

  return {
    compatible: ["Trắng", "Đen", "Xám"],
    avoid: [],
    trending: FASHION_TRENDS_2025.colors.trending.slice(0, 3),
  };
}
