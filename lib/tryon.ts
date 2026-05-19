/**
 * Virtual Try-On — ghép ảnh người + ảnh quần áo → người mặc đúng sản phẩm đó
 * Dùng OpenAI images/edits với 2 ảnh tham chiếu (gpt-image-1)
 */

import { captionImage, editImagesWithReferences, generateImage } from "./huggingface";

export interface TryOnResult {
  resultImageUrl: string;
  resultBase64: string;
  success: boolean;
  error?: string;
  modelUsed: string;
}

const IMAGE_MODEL_LABEL =
  process.env.OPENAI_IMAGE_MODEL?.startsWith("gpt-image") ? "GPT Image Try-On" : "DALL-E Try-On";

function buildTryOnPrompt(personDesc: string, clothDesc: string, extra?: string): string {
  const extraLine = extra?.trim() ? ` Additional request: ${extra.trim()}.` : "";
  return `Virtual fashion try-on — photorealistic full-body photo.

Image 1 (first reference): the person — preserve their face, hairstyle, skin tone, body proportions, pose, and background exactly.
Image 2 (second reference): the clothing item/garment — the person must wear THIS exact outfit.

Person details: ${personDesc}
Clothing to wear (must match image 2 exactly — same colors, patterns, fabric, cut, logos, buttons): ${clothDesc}

Output: the same person from image 1 now wearing the clothing from image 2. Natural fit, realistic shadows, fashion photography quality.${extraLine}`;
}

async function describeForTryOn(personBase64: string, clothBase64: string): Promise<{
  personDesc: string;
  clothDesc: string;
}> {
  try {
    const [personDesc, clothDesc] = await Promise.all([
      captionImage(personBase64),
      captionImage(clothBase64),
    ]);
    return { personDesc, clothDesc };
  } catch {
    return {
      personDesc: "person in the first reference photo",
      clothDesc: "the clothing item in the second reference photo",
    };
  }
}

export async function outfitTryOn(
  personImageBase64: string,
  clothImageBase64: string,
  description?: string
): Promise<TryOnResult> {
  try {
    const { personDesc, clothDesc } = await describeForTryOn(
      personImageBase64,
      clothImageBase64
    );
    const prompt = buildTryOnPrompt(personDesc, clothDesc, description);

    const b = await editImagesWithReferences(
      [personImageBase64, clothImageBase64],
      prompt,
      { size: "1024x1536", quality: "high", inputFidelity: "high" }
    );

    return {
      success: true,
      resultImageUrl: `data:image/png;base64,${b}`,
      resultBase64: b,
      modelUsed: IMAGE_MODEL_LABEL,
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Lỗi thử đồ";
    return {
      resultImageUrl: "",
      resultBase64: "",
      success: false,
      error: message,
      modelUsed: "none",
    };
  }
}

export async function generativeFill(_i: string, _m: string, p: string): Promise<TryOnResult> {
  try {
    const b = await generateImage(p);
    return {
      success: true,
      resultImageUrl: `data:image/png;base64,${b}`,
      resultBase64: b,
      modelUsed: IMAGE_MODEL_LABEL,
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Lỗi tạo ảnh";
    return { resultImageUrl: "", resultBase64: "", success: false, error: message, modelUsed: "none" };
  }
}

export async function accessoryTryOn(
  personImageBase64: string,
  accessoryType: string,
  accessoryDescription: string
): Promise<TryOnResult> {
  try {
    const personDesc = await captionImage(personImageBase64).catch(
      () => "person in reference photo"
    );
    const prompt = buildTryOnPrompt(
      personDesc,
      `${accessoryType}: ${accessoryDescription}`
    );
    const b = await editImagesWithReferences([personImageBase64], prompt, {
      size: "1024x1536",
      quality: "high",
    });
    return {
      success: true,
      resultImageUrl: `data:image/png;base64,${b}`,
      resultBase64: b,
      modelUsed: IMAGE_MODEL_LABEL,
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Lỗi tạo ảnh";
    return { resultImageUrl: "", resultBase64: "", success: false, error: message, modelUsed: "none" };
  }
}
