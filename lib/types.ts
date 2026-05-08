export interface UserProfile {
  height: number; // cm
  weight: number; // kg
  modelImageUrl?: string;
  modelImageBase64?: string;
}

export interface ClothingItem {
  id: string;
  imageUrl: string;
  imageBase64?: string;
  type: string;
  color: string;
  material: string;
  style: string;
  condition: string;
  addedAt: Date;
  tryOnCount: number;
  lastTriedAt?: Date;
}

export interface TryOnSession {
  id: string;
  clothingId: string;
  resultImageUrl: string;
  createdAt: Date;
}

// BMI & body type helper
export function getBMI(height: number, weight: number): number {
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function getBodyType(bmi: number): string {
  if (bmi < 18.5) return "Gầy";
  if (bmi < 25) return "Bình thường";
  if (bmi < 30) return "Thừa cân";
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
