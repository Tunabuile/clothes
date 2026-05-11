/**
 * Gọi Hugging Face IDM-VTON Space để thực hiện Virtual Try-On
 * Space: yisol/IDM-VTON - "mặc" đồ lên người thật
 */
export interface TryOnResult {
  resultImageUrl: string;
  success: boolean;
  error?: string;
}

export async function virtualTryOn(
  personImageBase64: string,
  clothImageBase64: string,
  description?: string
): Promise<TryOnResult> {
  const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";

  try {
    // Convert base64 → data URL
    const personDataUrl = personImageBase64.startsWith("data:")
      ? personImageBase64
      : `data:image/jpeg;base64,${personImageBase64}`;
    const clothDataUrl = clothImageBase64.startsWith("data:")
      ? clothImageBase64
      : `data:image/jpeg;base64,${clothImageBase64}`;

    // Gọi IDM-VTON Space qua Gradio API
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
            {
              background: personDataUrl, // ảnh người
              layers: [],
              composite: null,
            },
            clothDataUrl, // ảnh đồ
            description || "clothing item", // mô tả
            true, // is_checked (auto mask)
            true, // is_checked_crop (auto crop)
            0, // denoise_steps (0 = default)
            42, // seed
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF Space error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // IDM-VTON trả về ảnh trong data.data[0]
    const resultImage = data?.data?.[0];
    if (!resultImage) {
      throw new Error("Space không trả về ảnh kết quả");
    }

    return {
      success: true,
      resultImageUrl: resultImage,
    };
  } catch (error) {
    console.error("Virtual Try-On error:", error);
    return {
      success: false,
      resultImageUrl: "",
      error:
        error instanceof Error
          ? error.message
          : "Lỗi kết nối Hugging Face Space",
    };
  }
}
