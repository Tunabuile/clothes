/**
 * Dùng CLIP model trên Hugging Face để tính độ tương thích giữa các món đồ
 * CLIP encode ảnh → vector embedding → cosine similarity
 * Món nào similarity cao = phối hợp tốt về màu sắc, style, texture
 */

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
const CLIP_API = "https://router.huggingface.co/hf-inference/models/openai/clip-vit-base-patch32";

// Headers chung
function hfHeaders() {
  if (!HF_TOKEN) {
    throw new Error("Thiếu HUGGINGFACE_TOKEN (Hugging Face Access Token)");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${HF_TOKEN}`,
  };
}

/**
 * Lấy embedding vector của 1 ảnh từ CLIP
 */
async function getImageEmbedding(imageBase64: string): Promise<number[]> {
  const res = await fetch(CLIP_API, {
    method: "POST",
    headers: hfHeaders(),
    body: JSON.stringify({
      inputs: { image: imageBase64 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CLIP API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  // HF CLIP trả về array embedding
  return Array.isArray(data) ? data : data.embedding || data[0];
}

/**
 * Tính cosine similarity giữa 2 vectors
 * Kết quả từ -1 đến 1, càng cao càng giống nhau
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}

export interface ClothingWithEmbedding {
  id: string;
  type: string;
  color: string;
  style: string;
  imageBase64: string;
  embedding?: number[];
}

export interface CompatibilityScore {
  item1Id: string;
  item2Id: string;
  score: number; // 0-100
  label: string; // "Rất hợp" | "Hợp" | "Tạm" | "Không hợp"
}

/**
 * Tính độ tương thích giữa tất cả các cặp đồ
 * Trả về ma trận compatibility để AI dùng khi phối
 */
export async function computeCompatibilityMatrix(
  clothes: ClothingWithEmbedding[]
): Promise<CompatibilityScore[]> {
  // Lấy embedding cho tất cả món đồ song song
  const withEmbeddings = await Promise.all(
    clothes.map(async (c) => {
      try {
        const embedding = await getImageEmbedding(c.imageBase64);
        return { ...c, embedding };
      } catch {
        return { ...c, embedding: undefined };
      }
    })
  );

  const scores: CompatibilityScore[] = [];

  // Tính similarity cho mọi cặp
  for (let i = 0; i < withEmbeddings.length; i++) {
    for (let j = i + 1; j < withEmbeddings.length; j++) {
      const a = withEmbeddings[i];
      const b = withEmbeddings[j];

      if (!a.embedding || !b.embedding) continue;

      const raw = cosineSimilarity(a.embedding, b.embedding);
      // Normalize về 0-100 (CLIP similarity thường từ 0.2-0.9)
      const score = Math.round(((raw - 0.2) / 0.7) * 100);
      const clamped = Math.max(0, Math.min(100, score));

      scores.push({
        item1Id: a.id,
        item2Id: b.id,
        score: clamped,
        label:
          clamped >= 75 ? "Rất hợp" :
          clamped >= 55 ? "Hợp" :
          clamped >= 35 ? "Tạm được" : "Không hợp",
      });
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Tìm combo tốt nhất từ ma trận compatibility
 * Trả về top N combo (2-3 món) có tổng score cao nhất
 */
export function findBestCombos(
  scores: CompatibilityScore[],
  clothes: ClothingWithEmbedding[],
  topN = 3
): string[][] {
  // Map score nhanh
  const scoreMap = new Map<string, number>();
  for (const s of scores) {
    scoreMap.set(`${s.item1Id}__${s.item2Id}`, s.score);
    scoreMap.set(`${s.item2Id}__${s.item1Id}`, s.score);
  }

  const ids = clothes.map((c) => c.id);
  const combos: { ids: string[]; totalScore: number }[] = [];

  // Thử tất cả combo 2 món
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const s = scoreMap.get(`${ids[i]}__${ids[j]}`) ?? 0;
      combos.push({ ids: [ids[i], ids[j]], totalScore: s });

      // Thử thêm món thứ 3
      for (let k = j + 1; k < ids.length; k++) {
        const s2 = scoreMap.get(`${ids[i]}__${ids[k]}`) ?? 0;
        const s3 = scoreMap.get(`${ids[j]}__${ids[k]}`) ?? 0;
        combos.push({
          ids: [ids[i], ids[j], ids[k]],
          totalScore: Math.round((s + s2 + s3) / 3),
        });
      }
    }
  }

  // Sort và lấy top N (không trùng lặp quá nhiều)
  combos.sort((a, b) => b.totalScore - a.totalScore);

  const result: string[][] = [];
  const usedIds = new Set<string>();

  for (const combo of combos) {
    // Tránh combo quá giống nhau (share > 1 item)
    const overlap = combo.ids.filter((id) => usedIds.has(id)).length;
    if (overlap <= 1) {
      result.push(combo.ids);
      combo.ids.forEach((id) => usedIds.add(id));
    }
    if (result.length >= topN) break;
  }

  return result;
}
