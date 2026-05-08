export interface UserProfile {
  id?: string;
  height: number; // cm
  weight: number; // kg
  modelImageUrl?: string;
  modelImageBase64?: string;
  // Style preferences học từ feedback
  preferredStyles?: string[];
  preferredColors?: string[];
  stylePersonality?: string; // "Minimalist" | "Bold" | "Casual" | ...
  updatedAt?: Date;
}

export interface ClothingItem {
  id: string;
  imageUrl: string;       // public URL từ Supabase Storage
  imageBase64?: string;   // chỉ dùng khi upload, không lưu DB
  type: string;
  color: string;
  material: string;
  style: string;
  condition: string;
  addedAt: Date;
  tryOnCount: number;
  lastTriedAt?: Date;
  tags?: string[];        // tags thêm từ AI hoặc user
}

export interface TryOnSession {
  id: string;
  clothingId: string;
  resultImageUrl: string;
  createdAt: Date;
}

// Outfit combo được AI gợi ý + user feedback
export interface OutfitRecord {
  id: string;
  itemIds: string[];       // IDs của các ClothingItem
  occasion: string;
  weather: string;
  aiReasoning: string;
  aiTips: string;
  aiScore: number;
  // Feedback từ user → dùng để train AI
  userRating?: number;     // 1-5 sao
  userFeedback?: string;   // "Hợp lắm" | "Không hợp màu" | ...
  worn?: boolean;          // Đã mặc thật chưa
  createdAt: Date;
}

// Style profile AI học được từ feedback
export interface AIStyleProfile {
  userId: string;
  totalOutfits: number;
  avgRating: number;
  topColors: string[];
  topStyles: string[];
  topOccasions: string[];
  dislikedCombos: string[];   // màu/style không hợp
  likedCombos: string[];      // màu/style hay dùng
  personalityTags: string[];  // "Minimalist", "Colorful", ...
  lastUpdated: Date;
}

// BMI & body type helper
export function getBMI(height: number, weight: number): number {
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function getBodyType(bmi: number): string {
  // Chuẩn WHO cho người châu Á (ngưỡng thấp hơn người phương Tây)
  if (bmi < 18.5) return "Gầy";
  if (bmi < 23) return "Bình thường";
  if (bmi < 27.5) return "Thừa cân";
  return "Béo phì";
}

// Scale factor dùng cho body reshaping
export function getBodyScaleFactor(
  height: number,
  weight: number
): { scaleX: number; scaleY: number } {
  const bmi = getBMI(height, weight);
  // Baseline: BMI 22, height 170cm
  const baselineBMI = 22;
  const baselineHeight = 170;

  const scaleX = 1 + (bmi - baselineBMI) * 0.015; // béo hơn -> rộng hơn
  const scaleY = height / baselineHeight; // cao hơn -> dài hơn

  return {
    scaleX: Math.max(0.7, Math.min(1.5, scaleX)),
    scaleY: Math.max(0.8, Math.min(1.3, scaleY)),
  };
}
