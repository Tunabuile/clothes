/**
 * Gọi Hugging Face IDM-VTON API để thực hiện Virtual Try-On
 * Model: yisol/IDM-VTON trên Hugging Face Spaces
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
    // Gọi IDM-VTON qua Hugging Face Inference API (Gradio)
    const response = await fetch(
      "https://yisol-idm-vton.hf.space/run/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
        },
        body: JSON.stringify({
          fn_index: 0,
          data: [
            `data:image/jpeg;base64,${personImageBase64}`, // ảnh người
            `data:image/jpeg;base64,${clothImageBase64}`, // ảnh đồ
            description || "clothing item", // mô tả đồ
            true, // auto mask
            true, // auto crop
            30, // denoising steps
            42, // seed
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }

    const data = await response.json();

    // IDM-VTON trả về ảnh dạng base64 hoặc URL
    const resultImage = data?.data?.[0];
    if (!resultImage) throw new Error("Không nhận được kết quả từ AI");

    return {
      success: true,
      resultImageUrl: resultImage,
    };
  } catch (error) {
    return {
      success: false,
      resultImageUrl: "",
      error: error instanceof Error ? error.message : "Lỗi không xác định",
    };
  }
}
