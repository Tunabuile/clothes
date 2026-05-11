/**
 * Color Theory Engine - quy tắc phối màu chuyên nghiệp
 * AI học và áp dụng các quy tắc này khi phối đồ
 */

// Bảng màu cơ bản với HSL values
export const COLOR_DATABASE: Record<string, { hue: number; sat: number; light: number }> = {
  // Reds
  "Đỏ": { hue: 0, sat: 100, light: 50 },
  "Đỏ tươi": { hue: 0, sat: 100, light: 50 },
  "Đỏ đậm": { hue: 0, sat: 100, light: 35 },
  "Đỏ nhạt": { hue: 0, sat: 80, light: 70 },
  "Hồng": { hue: 350, sat: 100, light: 80 },
  "Hồng đậm": { hue: 340, sat: 100, light: 60 },
  
  // Blues
  "Xanh dương": { hue: 210, sat: 100, light: 50 },
  "Xanh navy": { hue: 220, sat: 100, light: 25 },
  "Xanh nhạt": { hue: 200, sat: 80, light: 70 },
  "Xanh da trời": { hue: 195, sat: 100, light: 85 },
  
  // Greens
  "Xanh lá": { hue: 120, sat: 100, light: 40 },
  "Xanh lá nhạt": { hue: 120, sat: 60, light: 70 },
  "Xanh rêu": { hue: 80, sat: 40, light: 40 },
  
  // Yellows
  "Vàng": { hue: 60, sat: 100, light: 50 },
  "Vàng nhạt": { hue: 55, sat: 100, light: 80 },
  "Vàng cam": { hue: 45, sat: 100, light: 50 },
  
  // Neutrals
  "Trắng": { hue: 0, sat: 0, light: 100 },
  "Đen": { hue: 0, sat: 0, light: 0 },
  "Xám": { hue: 0, sat: 0, light: 50 },
  "Xám nhạt": { hue: 0, sat: 0, light: 80 },
  "Xám đậm": { hue: 0, sat: 0, light: 30 },
  "Be": { hue: 30, sat: 30, light: 80 },
  "Nâu": { hue: 30, sat: 50, light: 40 },
  "Nâu nhạt": { hue: 30, sat: 40, light: 60 },
};

/**
 * Tính khoảng cách màu trên color wheel (0-180 độ)
 */
function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

/**
 * Phân loại mối quan hệ màu theo color theory
 */
export function getColorRelationship(color1: string, color2: string): {
  type: string;
  score: number; // 0-100
  description: string;
} {
  const c1 = COLOR_DATABASE[color1];
  const c2 = COLOR_DATABASE[color2];

  if (!c1 || !c2) {
    return { type: "unknown", score: 50, description: "Không xác định được màu" };
  }

  const hueDist = hueDistance(c1.hue, c2.hue);
  const lightDiff = Math.abs(c1.light - c2.light);

  // Neutrals (trắng/đen/xám/be/nâu) đi với mọi màu
  const isNeutral1 = c1.sat < 20;
  const isNeutral2 = c2.sat < 20;
  if (isNeutral1 || isNeutral2) {
    return {
      type: "neutral",
      score: 90,
      description: "Màu trung tính đi với mọi màu",
    };
  }

  // Monochromatic (cùng hue, khác độ sáng)
  if (hueDist < 15 && lightDiff > 20) {
    return {
      type: "monochromatic",
      score: 85,
      description: "Cùng tông màu, tạo sự hài hòa",
    };
  }

  // Analogous (kề nhau trên color wheel, 30-60 độ)
  if (hueDist >= 15 && hueDist <= 60) {
    return {
      type: "analogous",
      score: 80,
      description: "Màu kề nhau, dễ phối",
    };
  }

  // Complementary (đối diện, 150-210 độ)
  if (hueDist >= 150 && hueDist <= 210) {
    return {
      type: "complementary",
      score: 75,
      description: "Màu đối lập, tạo điểm nhấn mạnh",
    };
  }

  // Triadic (120 độ)
  if (hueDist >= 100 && hueDist <= 140) {
    return {
      type: "triadic",
      score: 70,
      description: "Màu tam giác, cân bằng nhưng táo bạo",
    };
  }

  // Split-complementary (150 độ nhưng không đối xứng)
  if (hueDist >= 60 && hueDist < 100) {
    return {
      type: "split-complementary",
      score: 65,
      description: "Gần đối lập, ít mạnh hơn complementary",
    };
  }

  // Clash (quá gần nhưng không đủ để monochromatic)
  if (hueDist < 15 && lightDiff < 20) {
    return {
      type: "clash",
      score: 30,
      description: "Quá giống nhau, dễ nhàm chán",
    };
  }

  return {
    type: "neutral-distance",
    score: 55,
    description: "Khoảng cách màu trung bình",
  };
}

/**
 * Đánh giá combo màu (2-4 màu)
 * Trả về score tổng thể và lời khuyên
 */
export function evaluateColorCombo(colors: string[]): {
  score: number;
  relationships: { pair: string; type: string; score: number }[];
  advice: string;
} {
  const relationships: { pair: string; type: string; score: number }[] = [];
  let totalScore = 0;
  let pairCount = 0;

  // Tính score cho mọi cặp màu
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const rel = getColorRelationship(colors[i], colors[j]);
      relationships.push({
        pair: `${colors[i]} + ${colors[j]}`,
        type: rel.type,
        score: rel.score,
      });
      totalScore += rel.score;
      pairCount++;
    }
  }

  const avgScore = pairCount > 0 ? Math.round(totalScore / pairCount) : 50;

  // Tạo lời khuyên
  let advice = "";
  const neutralCount = relationships.filter((r) => r.type === "neutral").length;
  const clashCount = relationships.filter((r) => r.type === "clash").length;

  if (avgScore >= 80) {
    advice = "Combo màu rất hài hòa! Phối tốt.";
  } else if (avgScore >= 65) {
    advice = "Combo màu ổn, có thể mặc được.";
  } else if (clashCount > 0) {
    advice = "Một số màu quá giống nhau, nên thay đổi.";
  } else if (neutralCount === 0 && colors.length > 2) {
    advice = "Quá nhiều màu nổi, nên thêm màu trung tính (trắng/đen/xám).";
  } else {
    advice = "Combo màu hơi khó phối, cân nhắc lại.";
  }

  return { score: avgScore, relationships, advice };
}

/**
 * Gợi ý màu phối với 1 màu cho trước
 */
export function suggestMatchingColors(baseColor: string, count = 3): string[] {
  const base = COLOR_DATABASE[baseColor];
  if (!base) return [];

  const suggestions: { color: string; score: number }[] = [];

  for (const [color, hsl] of Object.entries(COLOR_DATABASE)) {
    if (color === baseColor) continue;
    const rel = getColorRelationship(baseColor, color);
    suggestions.push({ color, score: rel.score });
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((s) => s.color);
}
