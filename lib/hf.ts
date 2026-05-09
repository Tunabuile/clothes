/**
 * Hugging Face Inference API + Groq (fallback)
 * Free tier, không cần billing
 */

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

const HF_HEADERS = {
  "Content-Type": "application/json",
  ...(HF_TOKEN && { Authorization: `Bearer ${HF_TOKEN}` }),
};

// ─── TEXT GENERATION ─────────────────────────────────────────
// Dùng Groq (free, nhanh) nếu có key, fallback sang HF

export async function generateText(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Thiếu GROQ_API_KEY trong .env.local");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            "You are a helpful fashion assistant. Always respond with valid JSON when asked.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
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
    throw new Error(`HF Caption error ${res.status}: ${err.slice(0, 200)}`);
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
      headers: HF_HEADERS,
      body: JSON.stringify({
        inputs: prompt,
        parameters: { num_inference_steps: 20 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF Image error ${res.status}: ${err.slice(0, 200)}`);
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
