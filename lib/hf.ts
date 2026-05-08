/**
 * Hugging Face Inference API - thay thế toàn bộ Gemini
 * Free tier, không cần billing
 */

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";

const HEADERS = {
  "Content-Type": "application/json",
  ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
};

// ─── TEXT GENERATION (Mistral 7B) ────────────────────────────

export async function generateText(prompt: string): Promise<string> {
  const res = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
    {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        inputs: `<s>[INST] ${prompt} [/INST]`,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF Text error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data[0]?.generated_text || "";
}

// ─── IMAGE CAPTIONING (BLIP) ─────────────────────────────────

export async function captionImage(imageBase64: string): Promise<string> {
  const binary = Buffer.from(imageBase64, "base64");

  const res = await fetch(
    "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
      },
      body: binary,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF Caption error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data[0]?.generated_text || "";
}

// ─── IMAGE GENERATION (Stable Diffusion XL) ──────────────────

export async function generateImage(prompt: string): Promise<string> {
  const res = await fetch(
    "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
    {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        inputs: prompt,
        parameters: { num_inference_steps: 20 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF Image error ${res.status}: ${err}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

/**
 * Extract JSON từ text response của LLM
 */
export function extractJSON(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
