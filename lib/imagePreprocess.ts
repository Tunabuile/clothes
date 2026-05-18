/**
 * Image Preprocessing cho Virtual Try-On
 * - Xóa background (RMBG-1.4) — FREE, không cần key
 * - Auto-crop ảnh người (DETR)
 * - Tối ưu ảnh đầu vào để kết quả try-on đẹp nhất
 */

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";

// ─── 1. REMOVE BACKGROUND ─────────────────────────────────────

/**
 * Xóa background khỏi ảnh người dùng RMBG-1.4 (100% FREE)
 * Trả về ảnh chỉ có người, nền trong suốt
 */
export async function removeBackground(
  imageBase64: string
): Promise<string> {
  const base64Data = imageBase64.includes(",")
    ? imageBase64.split(",")[1]
    : imageBase64;

  const response = await fetch(
    "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
      },
      body: Buffer.from(base64Data, "base64"),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.warn(`RMBG error ${response.status}: ${err.slice(0, 200)}`);
    // Nếu lỗi, trả về ảnh gốc (không xóa bg)
    return imageBase64;
  }

  const buffer = await response.arrayBuffer();
  const resultBase64 = Buffer.from(buffer).toString("base64");
  return `data:image/png;base64,${resultBase64}`;
}

// ─── 2. TỐI ƯU PROMPT ─────────────────────────────────────────

/**
 * Dùng Groq (free) để tối ưu prompt tiếng Anh cho FLUX/SD
 * Nếu lỗi, trả về prompt gốc
 */
export async function optimizePrompt(
  rawPrompt: string
): Promise<string> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) return rawPrompt;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are a prompt engineer for fashion image generation. Convert user prompts into detailed English prompts for FLUX/SD models. Return ONLY the optimized prompt, no explanation.",
            },
            { role: "user", content: rawPrompt },
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) return rawPrompt;

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return content?.trim() || rawPrompt;
  } catch {
    return rawPrompt;
  }
}

// ─── 3. DETECT & CROP NGƯỜI ────────────────────────────────────

/**
 * Phát hiện người trong ảnh và crop sát body
 * Dùng DETR ResNet-50 (HF free)
 */
export async function detectAndCropPerson(
  imageBase64: string
): Promise<string> {
  const base64Data = imageBase64.includes(",")
    ? imageBase64.split(",")[1]
    : imageBase64;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/detr-resnet-50",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
        },
        body: Buffer.from(base64Data, "base64"),
      }
    );

    if (!response.ok) {
      console.warn("DETR detect failed, using original image");
      return imageBase64;
    }

    const detections = await response.json();
    
    // Tìm người đầu tiên (label "person" hoặc score cao nhất)
    const person = detections?.find(
      (d: any) => d.label === "person" || d.label === "LABEL_1"
    );

    if (!person || !person.box) return imageBase64;

    const { xmin, ymin, xmax, ymax } = person.box;

    // CROP: dùng canvas để crop ảnh
    const img = await base64ToImage(imageBase64);
    const canvas = document
      ? document.createElement("canvas")
      : null;
    
    if (!canvas) {
      // Nếu server-side, trả về ảnh gốc
      return imageBase64;
    }

    canvas.width = xmax - xmin;
    canvas.height = ymax - ymin;
    const ctx = canvas.getContext("2d");
    if (!ctx) return imageBase64;

    ctx.drawImage(img, xmin, ymin, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  } catch (e) {
    console.warn("Crop person failed:", e);
    return imageBase64;
  }
}

// ─── 4. TIỀN XỬ LÝ TOÀN BỘ ────────────────────────────────────

/**
 * Xử lý toàn bộ ảnh trước khi try-on:
 * 1. Xóa background người
 * 2. Crop người
 * 3. Tối ưu kích thước
 */
export async function preprocessPersonImage(
  imageBase64: string
): Promise<string> {
  // Bước 1: Xóa background (ưu tiên)
  let processed = await removeBackground(imageBase64);

  // Bước 2: Crop người (nếu có thể)
  // processed = await detectAndCropPerson(processed); // Tạm thời skip crop

  return processed;
}

// ─── HELPERS ───────────────────────────────────────────────────

function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
}