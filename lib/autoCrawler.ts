/**
 * Auto Fashion Crawler
 * Tự động tìm kiếm và thu thập ảnh đồ từ internet
 * Không cần user upload
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

// Fashion keywords để search
const FASHION_KEYWORDS = [
  "minimalist fashion outfit",
  "streetwear style",
  "casual outfit",
  "formal wear",
  "summer fashion",
  "winter outfit",
  "korean fashion",
  "vintage clothing",
  "athleisure wear",
  "business casual",
];

const CLOTHING_TYPES = [
  "white t-shirt",
  "black jeans",
  "denim jacket",
  "sneakers",
  "dress shirt",
  "hoodie",
  "blazer",
  "midi dress",
  "cargo pants",
  "leather jacket",
];

interface CrawledImage {
  url: string;
  thumbnail: string;
  source: string;
  keywords: string[];
  width: number;
  height: number;
}

/**
 * Crawl ảnh từ Unsplash (free, high quality)
 * API: https://unsplash.com/developers
 */
export async function crawlFromUnsplash(
  query: string,
  count = 10
): Promise<CrawledImage[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error("Cần UNSPLASH_ACCESS_KEY trong .env");
  }

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  });

  if (!res.ok) throw new Error(`Unsplash API error: ${res.status}`);

  const data = await res.json();

  return (data.results || []).map((img: {
    urls: { regular: string; thumb: string };
    user: { name: string };
    tags: { title: string }[];
    width: number;
    height: number;
  }) => ({
    url: img.urls.regular,
    thumbnail: img.urls.thumb,
    source: `Unsplash by ${img.user.name}`,
    keywords: img.tags?.map((t) => t.title) || [],
    width: img.width,
    height: img.height,
  }));
}

/**
 * Crawl ảnh từ Pexels (free alternative)
 */
export async function crawlFromPexels(
  query: string,
  count = 10
): Promise<CrawledImage[]> {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
  if (!PEXELS_API_KEY) {
    throw new Error("Cần PEXELS_API_KEY trong .env");
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=portrait`;

  const res = await fetch(url, {
    headers: { Authorization: PEXELS_API_KEY },
  });

  if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);

  const data = await res.json();

  return (data.photos || []).map((img: {
    src: { large: string; medium: string };
    photographer: string;
    alt: string;
    width: number;
    height: number;
  }) => ({
    url: img.src.large,
    thumbnail: img.src.medium,
    source: `Pexels by ${img.photographer}`,
    keywords: img.alt?.split(" ") || [],
    width: img.width,
    height: img.height,
  }));
}

/**
 * Auto-crawl batch: lấy nhiều ảnh từ nhiều keywords
 */
export async function autoCrawlFashionImages(
  batchSize = 50
): Promise<CrawledImage[]> {
  const results: CrawledImage[] = [];
  const perKeyword = Math.ceil(batchSize / FASHION_KEYWORDS.length);

  for (const keyword of FASHION_KEYWORDS.slice(0, 5)) {
    try {
      const images = await crawlFromUnsplash(keyword, perKeyword);
      results.push(...images);
      if (results.length >= batchSize) break;
    } catch (err) {
      console.error(`Crawl error for "${keyword}":`, err);
    }
  }

  return results.slice(0, batchSize);
}

/**
 * Crawl specific clothing items (để điền tủ đồ tự động)
 */
export async function crawlClothingItems(count = 20): Promise<CrawledImage[]> {
  const results: CrawledImage[] = [];
  const perType = Math.ceil(count / CLOTHING_TYPES.length);

  for (const type of CLOTHING_TYPES.slice(0, 10)) {
    try {
      const images = await crawlFromUnsplash(type, perType);
      results.push(...images);
      if (results.length >= count) break;
    } catch (err) {
      console.error(`Crawl error for "${type}":`, err);
    }
  }

  return results.slice(0, count);
}

/**
 * Download ảnh và convert sang base64 (để lưu vào DB)
 */
export async function downloadImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return base64;
}
