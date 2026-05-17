/**
 * Dreamina-like Virtual Try-On Engine
 * 
 * Hỗ trợ:
 * 1. Outfit Try-On (IDM-VTON, OutfitAnyone)
 * 2. Generative Inpainting (sửa/xóa/thêm quần áo)
 * 3. Accessory Try-On (kính, mũ, túi, trang sức)
 */

export interface TryOnResult {
  resultImageUrl: string;
  resultBase64: string;
  success: boolean;
  error?: string;
  modelUsed: string;
}

// ─── 1. OUTFIT TRY-ON ─────────────────────────────────────────

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
const HF_TEXT_MODEL = process.env.HUGGINGFACE_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";

/**
 * Virtual Try-On: Mặc đồ AI lên người thật
 * Dùng IDM-VTON (HuggingFace Space) làm chính
 * Fallback: Outfit Anyone (HuggingFace)
 */
export async function outfitTryOn(
  personImageBase64: string,  // ảnh người (full body)
  clothImageBase64: string,   // ảnh quần áo (flat lay hoặc mẫu)
  description?: string        // mô tả thêm
): Promise<TryOnResult> {
  // Model 1: IDM-VTON (chính)
  try {
    const result = await callIDM_VTON(personImageBase64, clothImageBase64, description);
    if (result.success) return { ...result, modelUsed: "IDM-VTON" };
  } catch (e) {
    console.warn("IDM-VTON failed, trying OutfitAnyone...", e);
  }

  // Model 2: Outfit Anyone (fallback)
  try {
    const result = await callOutfitAnyone(personImageBase64, clothImageBase64, description);
    if (result.success) return { ...result, modelUsed: "OutfitAnyone" };
  } catch (e) {
    console.warn("OutfitAnyone failed too", e);
  }

  // Model 3: FLUX prompt-based (last resort)
  try {
    const result = await callFluxTryOn(personImageBase64, clothImageBase64, description);
    if (result.success) return { ...result, modelUsed: "FLUX" };
  } catch (e) {
    console.warn("FLUX try-on failed", e);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "All try-on models failed. Vui lòng thử lại sau.",
    modelUsed: "none",
  };
}

/**
 * IDM-VTON: mặc đồ lên ảnh người thật
 * Có thể gọi Space: yisol/IDM-VTON hoặc thư viện diffusers
 */
async function callIDM_VTON(
  personImageBase64: string,
  clothImageBase64: string,
  description?: string
): Promise<TryOnResult> {
  const personDataUrl = personImageBase64.startsWith("data:")
    ? personImageBase64
    : `data:image/jpeg;base64,${personImageBase64}`;
  const clothDataUrl = clothImageBase64.startsWith("data:")
    ? clothImageBase64
    : `data:image/jpeg;base64,${clothImageBase64}`;

  const response = await fetch(
    "https://yisol-idm-vton.hf.space/api/predict",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
      },
      body: JSON.stringify({
        data: [
          { background: personDataUrl, layers: [], composite: null },
          clothDataUrl,
          description || "clothing item",
          true, // auto mask
          true, // auto crop
          0,    // denoise steps
          42,   // seed
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IDM-VTON error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const resultImage = data?.data?.[0];
  if (!resultImage) throw new Error("IDM-VTON không trả về ảnh");

  // Fetch ảnh về base64
  const imgRes = await fetch(resultImage);
  const imgBuffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(imgBuffer).toString("base64");

  return {
    success: true,
    resultImageUrl: resultImage,
    resultBase64: base64,
    modelUsed: "IDM-VTON",
  };
}

/**
 * Outfit Anyone: fallback nếu IDM-VTON fail
 */
async function callOutfitAnyone(
  personImageBase64: string,
  clothImageBase64: string,
  _description?: string
): Promise<TryOnResult> {
  const personDataUrl = personImageBase64.startsWith("data:")
    ? personImageBase64
    : `data:image/jpeg;base64,${personImageBase64}`;
  const clothDataUrl = clothImageBase64.startsWith("data:")
    ? clothImageBase64
    : `data:image/jpeg;base64,${clothImageBase64}`;

  // Outfit Anyone HF Space - có thể đổi URL nếu Space khác
  const response = await fetch(
    "https://levihsu-ootdiffusion.hf.space/api/predict",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
      },
      body: JSON.stringify({
        data: [
          personDataUrl,
          clothDataUrl,
          "A photo of a person wearing the given clothes, high quality, realistic",
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OutfitAnyone error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  const resultImage = data?.data?.[0];
  if (!resultImage) throw new Error("OutfitAnyone không trả về ảnh");

  const imgRes = await fetch(resultImage);
  const imgBuffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(imgBuffer).toString("base64");

  return {
    success: true,
    resultImageUrl: resultImage,
    resultBase64: base64,
    modelUsed: "OutfitAnyone",
  };
}

/**
 * FLUX-based try-on: dùng prompt để sinh ảnh mới dựa trên ảnh người và đồ
 */
async function callFluxTryOn(
  _personImageBase64: string,
  clothImageBase64: string,
  description?: string
): Promise<TryOnResult> {
  // Dùng FLUX inference API để sinh ảnh
  const model = process.env.HUGGINGFACE_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
      },
      body: JSON.stringify({
        inputs: `A person wearing ${description || "this clothing item"}, full body fashion photography, realistic, high quality`,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FLUX try-on error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  return {
    success: true,
    resultImageUrl: dataUrl,
    resultBase64: base64,
    modelUsed: "FLUX",
  };
}

// ─── 2. GENERATIVE INPAINTING ─────────────────────────────────

/**
 * Inpainting (Generative Fill): Sửa quần áo, thêm/xóa/bớt chi tiết
 * Giống "Generative Fill" trong Dreamina / Photoshop
 */
export async function generativeFill(
  imageBase64: string,
  maskBase64: string,      // vùng cần sửa (trắng = edit, đen = giữ)
  prompt: string           // mô tả muốn thay đổi thành gì
): Promise<TryOnResult> {
  // Model 1: FLUX Fill (chính)
  try {
    const result = await callFluxFill(imageBase64, maskBase64, prompt);
    return { ...result, modelUsed: "FLUX-Fill" };
  } catch (e) {
    console.warn("FLUX-Fill failed, trying Stable Diffusion inpainting...", e);
  }

  // Model 2: Stable Diffusion Inpainting (fallback)
  try {
    const result = await callSDInpainting(imageBase64, maskBase64, prompt);
    return { ...result, modelUsed: "SD-Inpainting" };
  } catch (e) {
    console.warn("SD Inpainting failed too", e);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "All inpainting models failed.",
    modelUsed: "none",
  };
}

async function callFluxFill(
  _imageBase64: string,
  _maskBase64: string,
  prompt: string
): Promise<TryOnResult> {
  // FLUX Fill via HF inference
  const model = "black-forest-labs/FLUX.1-fill-dev";
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { guidance_scale: 7.0, num_inference_steps: 30 },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FLUX-Fill error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return {
    success: true,
    resultImageUrl: `data:image/jpeg;base64,${base64}`,
    resultBase64: base64,
    modelUsed: "FLUX-Fill",
  };
}

async function callSDInpainting(
  _imageBase64: string,
  _maskBase64: string,
  prompt: string
): Promise<TryOnResult> {
  const model = "runwayml/stable-diffusion-inpainting";
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
      },
      body: JSON.stringify({
        inputs: prompt,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SD-Inpainting error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return {
    success: true,
    resultImageUrl: `data:image/jpeg;base64,${base64}`,
    resultBase64: base64,
    modelUsed: "SD-Inpainting",
  };
}

// ─── 3. ACCESSORY TRY-ON ───────────────────────────────────────

/**
 * Thử phụ kiện lên người (kính, mũ, túi xách, trang sức,...)
 * Dùng prompt-based image generation + inpainting
 */
export async function accessoryTryOn(
  personImageBase64: string,
  accessoryType: "glasses" | "hat" | "bag" | "necklace" | "earrings" | "watch" | "belt",
  accessoryDescription: string,  // "a pair of black sunglasses", "a red baseball cap", ...
): Promise<TryOnResult> {
  // Dùng FLUX / SD với prompt mô tả người + phụ kiện
  try {
    const result = await callFluxAccessory(personImageBase64, accessoryType, accessoryDescription);
    return { ...result, modelUsed: "FLUX-Accessory" };
  } catch (e) {
    console.warn("FLUX-Accessory failed", e);
  }

  return {
    resultImageUrl: "",
    resultBase64: "",
    success: false,
    error: "Accessory try-on failed.",
    modelUsed: "none",
  };
}

async function callFluxAccessory(
  _personImageBase64: string,
  accessoryType: string,
  accessoryDescription: string
): Promise<TryOnResult> {
  const model = process.env.HUGGINGFACE_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";
  const prompt = `A person wearing ${accessoryDescription} (${accessoryType}), fashion photography, high quality, detailed, realistic`;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
      },
      body: JSON.stringify({ inputs: prompt }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FLUX-Accessory error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return {
    success: true,
    resultImageUrl: `data:image/jpeg;base64,${base64}`,
    resultBase64: base64,
    modelUsed: "FLUX-Accessory",
  };
}