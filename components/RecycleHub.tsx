"use client";

import { useState } from "react";
import {
  Recycle, Scan, Leaf, Clock, Wrench, ChevronDown, ChevronUp,
  Loader2, Search, Sparkles, Camera, Filter, ExternalLink
} from "lucide-react";
import ImageUploader from "./ImageUploader";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ─── TYPES ───────────────────────────────────────────────────

interface RecycleIdea {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  time: string;
  description: string;
  materials_needed: string[];
  clothingType: string[];
  tags: string[];
  likes: number;
  image?: string;       // Unsplash image URL
  tutorialUrl?: string; // YouTube/Pinterest link
  tutorialLabel?: string;
}

// ─── STATIC FORUM IDEAS ──────────────────────────────────────

const FORUM_IDEAS: RecycleIdea[] = [
  {
    id: "1", title: "Túi tote từ áo thun cũ", category: "Tái chế",
    difficulty: "Rất dễ", time: "20 phút",
    description: "Cắt tay áo, khâu đáy lại là xong một chiếc túi tote xinh xắn. Không cần máy may.",
    materials_needed: ["Kéo", "Kim chỉ hoặc keo vải"],
    clothingType: ["T-shirt", "Áo thun"],
    tags: ["túi", "không cần may", "nhanh"], likes: 234,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=t-shirt+tote+bag+no+sew+diy",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "3", title: "Crop top từ áo rộng", category: "Upcycle",
    difficulty: "Dễ", time: "15 phút",
    description: "Cắt phần dưới áo oversized, viền lại bằng kéo zigzag hoặc để raw hem cho phong cách.",
    materials_needed: ["Kéo", "Thước", "Phấn may"],
    clothingType: ["Áo thun", "Áo hoodie", "Áo len"],
    tags: ["thời trang", "crop", "trendy"], likes: 312,
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+crop+top+from+oversized+shirt",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "4", title: "Gối ôm từ quần jeans cũ", category: "Tái chế",
    difficulty: "Trung bình", time: "45 phút",
    description: "Dùng ống quần jeans, khâu một đầu, nhồi bông vào, khâu đầu còn lại. Ra gối hình trụ độc đáo.",
    materials_needed: ["Máy may hoặc kim chỉ", "Bông nhồi", "Kéo"],
    clothingType: ["Quần jeans", "Quần denim"],
    tags: ["nội thất", "gối", "jeans"], likes: 156,
    image: "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=400&q=80",
    tutorialUrl: "https://www.pinterest.com/search/pins/?q=denim+jeans+pillow+diy",
    tutorialLabel: "Xem ý tưởng Pinterest",
  },
  {
    id: "6", title: "Chậu cây từ quần jeans", category: "Tái chế",
    difficulty: "Dễ", time: "30 phút",
    description: "Cắt ống quần, khâu đáy, lót túi nilon bên trong, đổ đất trồng cây. Decor cực chất.",
    materials_needed: ["Kéo", "Kim chỉ", "Túi nilon", "Đất trồng"],
    clothingType: ["Quần jeans", "Quần vải"],
    tags: ["cây cảnh", "decor", "jeans"], likes: 201,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&q=80",
    tutorialUrl: "https://www.pinterest.com/search/pins/?q=denim+jeans+planter+diy",
    tutorialLabel: "Xem ý tưởng Pinterest",
  },
  {
    id: "7", title: "Ví nhỏ từ túi quần jeans", category: "Upcycle",
    difficulty: "Trung bình", time: "40 phút",
    description: "Tháo túi quần jeans ra, thêm khóa kéo hoặc nút bấm, thành ví đựng tiền lẻ siêu cute.",
    materials_needed: ["Kéo", "Khóa kéo", "Kim chỉ"],
    clothingType: ["Quần jeans", "Quần kaki"],
    tags: ["ví", "phụ kiện", "jeans"], likes: 143,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+wallet+from+jeans+pocket",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "8", title: "Thảm chùi chân từ áo cũ", category: "Tái chế",
    difficulty: "Trung bình", time: "60 phút",
    description: "Cắt nhiều áo cũ thành dải, đan hoặc bện lại thành thảm tròn. Bền và đẹp.",
    materials_needed: ["Kéo", "Móc đan hoặc tay"],
    clothingType: ["Áo thun", "Áo len", "Nhiều loại"],
    tags: ["thảm", "đan", "nội thất"], likes: 167,
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=braided+rug+from+old+clothes+diy",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "9", title: "Băng đô từ áo thun", category: "Upcycle",
    difficulty: "Rất dễ", time: "5 phút",
    description: "Cắt một dải ngang từ thân áo thun, độ rộng 5-8cm. Kéo nhẹ để cuộn lại. Xong ngay.",
    materials_needed: ["Kéo"],
    clothingType: ["Áo thun", "Vải thun"],
    tags: ["phụ kiện", "tóc", "nhanh"], likes: 345,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+headband+from+tshirt+no+sew",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "10", title: "Bao gối từ áo sơ mi", category: "Tái chế",
    difficulty: "Dễ", time: "25 phút",
    description: "Áo sơ mi có sẵn hàng cúc — nhét gối vào, cài cúc lại. Không cần khâu gì thêm.",
    materials_needed: ["Gối"],
    clothingType: ["Áo sơ mi", "Áo flannel"],
    tags: ["gối", "phòng ngủ", "không cần may"], likes: 289,
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&q=80",
    tutorialUrl: "https://www.pinterest.com/search/pins/?q=shirt+pillowcase+diy+no+sew",
    tutorialLabel: "Xem ý tưởng Pinterest",
  },
  {
    id: "11", title: "Giỏ đựng đồ từ áo len", category: "Tái chế",
    difficulty: "Trung bình", time: "50 phút",
    description: "Cắt áo len thành dải, đan thành giỏ hình tròn. Dùng đựng đồ chơi, sách, hoặc cây cảnh.",
    materials_needed: ["Kéo", "Móc đan"],
    clothingType: ["Áo len", "Áo sweater"],
    tags: ["giỏ", "đan", "len"], likes: 122,
    image: "https://images.unsplash.com/photo-1595231776515-ddffb1f4eb73?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+basket+from+old+sweater+knit",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "13", title: "Áo khoác từ quần jeans cũ", category: "Upcycle",
    difficulty: "Khó", time: "120 phút",
    description: "Tháo đường chỉ quần jeans, cắt và may lại thành áo khoác denim độc đáo. Cần máy may.",
    materials_needed: ["Máy may", "Kéo", "Chỉ denim", "Thước"],
    clothingType: ["Quần jeans"],
    tags: ["áo khoác", "denim", "thời trang"], likes: 198,
    image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+denim+jacket+from+jeans+upcycle",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "14", title: "Quần short từ quần dài", category: "Upcycle",
    difficulty: "Dễ", time: "20 phút",
    description: "Cắt quần dài thành quần short, viền gấu bằng kéo zigzag hoặc để raw hem. Nhanh và trendy.",
    materials_needed: ["Kéo", "Thước", "Phấn may"],
    clothingType: ["Quần jeans", "Quần kaki", "Quần vải"],
    tags: ["quần short", "mùa hè", "nhanh"], likes: 267,
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+cut+off+shorts+from+jeans+tutorial",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "15", title: "Túi dây rút từ áo cũ", category: "Tái chế",
    difficulty: "Dễ", time: "30 phút",
    description: "Khâu miệng áo lại, thêm dây rút ở cổ áo. Thành túi đựng giày hoặc đồ gym tiện lợi.",
    materials_needed: ["Kim chỉ", "Dây rút", "Kéo"],
    clothingType: ["Áo thun", "Áo hoodie"],
    tags: ["túi", "gym", "tiện lợi"], likes: 134,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
    tutorialUrl: "https://www.pinterest.com/search/pins/?q=tshirt+drawstring+bag+diy+tutorial",
    tutorialLabel: "Xem ý tưởng Pinterest",
  },
];
  {
    id: "3", title: "Crop top từ áo rộng", category: "Upcycle",
    difficulty: "Dễ", time: "15 phút",
    description: "Cắt phần dưới áo oversized, viền lại bằng kéo zigzag hoặc để raw hem cho phong cách.",
    materials_needed: ["Kéo", "Thước", "Phấn may"],
    clothingType: ["Áo thun", "Áo hoodie", "Áo len"],
    tags: ["thời trang", "crop", "trendy"], likes: 312,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4b4d8a?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+crop+top+from+oversized+shirt",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "4", title: "Gối ôm từ quần jeans cũ", category: "Tái chế",
    difficulty: "Trung bình", time: "45 phút",
    description: "Dùng ống quần jeans, khâu một đầu, nhồi bông vào, khâu đầu còn lại. Ra gối hình trụ độc đáo.",
    materials_needed: ["Máy may hoặc kim chỉ", "Bông nhồi", "Kéo"],
    clothingType: ["Quần jeans", "Quần denim"],
    tags: ["nội thất", "gối", "jeans"], likes: 156,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    tutorialUrl: "https://www.pinterest.com/search/pins/?q=denim+jeans+pillow+diy",
    tutorialLabel: "Xem ý tưởng Pinterest",
  },
  {
    id: "6", title: "Chậu cây từ quần jeans", category: "Tái chế",
    difficulty: "Dễ", time: "30 phút",
    description: "Cắt ống quần, khâu đáy, lót túi nilon bên trong, đổ đất trồng cây. Decor cực chất.",
    materials_needed: ["Kéo", "Kim chỉ", "Túi nilon", "Đất trồng"],
    clothingType: ["Quần jeans", "Quần vải"],
    tags: ["cây cảnh", "decor", "jeans"], likes: 201,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80",
    tutorialUrl: "https://www.pinterest.com/search/pins/?q=denim+jeans+planter+diy",
    tutorialLabel: "Xem ý tưởng Pinterest",
  },
  {
    id: "7", title: "Ví nhỏ từ túi quần jeans", category: "Upcycle",
    difficulty: "Trung bình", time: "40 phút",
    description: "Tháo túi quần jeans ra, thêm khóa kéo hoặc nút bấm, thành ví đựng tiền lẻ siêu cute.",
    materials_needed: ["Kéo", "Khóa kéo", "Kim chỉ"],
    clothingType: ["Quần jeans", "Quần kaki"],
    tags: ["ví", "phụ kiện", "jeans"], likes: 143,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+wallet+from+jeans+pocket",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "8", title: "Thảm chùi chân từ áo cũ", category: "Tái chế",
    difficulty: "Trung bình", time: "60 phút",
    description: "Cắt nhiều áo cũ thành dải, đan hoặc bện lại thành thảm tròn. Bền và đẹp.",
    materials_needed: ["Kéo", "Móc đan hoặc tay"],
    clothingType: ["Áo thun", "Áo len", "Nhiều loại"],
    tags: ["thảm", "đan", "nội thất"], likes: 167,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=braided+rug+from+old+clothes",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "9", title: "Băng đô từ áo thun", category: "Upcycle",
    difficulty: "Rất dễ", time: "5 phút",
    description: "Cắt một dải ngang từ thân áo thun, độ rộng 5-8cm. Kéo nhẹ để cuộn lại. Xong ngay.",
    materials_needed: ["Kéo"],
    clothingType: ["Áo thun", "Vải thun"],
    tags: ["phụ kiện", "tóc", "nhanh"], likes: 345,
    image: "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+headband+from+tshirt",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "10", title: "Bao gối từ áo sơ mi", category: "Tái chế",
    difficulty: "Dễ", time: "25 phút",
    description: "Áo sơ mi có sẵn hàng cúc — nhét gối vào, cài cúc lại. Không cần khâu gì thêm.",
    materials_needed: ["Gối"],
    clothingType: ["Áo sơ mi", "Áo flannel"],
    tags: ["gối", "phòng ngủ", "không cần may"], likes: 289,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80",
    tutorialUrl: "https://www.pinterest.com/search/pins/?q=shirt+pillowcase+diy+no+sew",
    tutorialLabel: "Xem ý tưởng Pinterest",
  },
  {
    id: "11", title: "Giỏ đựng đồ từ áo len", category: "Tái chế",
    difficulty: "Trung bình", time: "50 phút",
    description: "Cắt áo len thành dải, đan thành giỏ hình tròn. Dùng đựng đồ chơi, sách, hoặc cây cảnh.",
    materials_needed: ["Kéo", "Móc đan"],
    clothingType: ["Áo len", "Áo sweater"],
    tags: ["giỏ", "đan", "len"], likes: 122,
    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+basket+from+old+sweater",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "13", title: "Áo khoác từ quần jeans cũ", category: "Upcycle",
    difficulty: "Khó", time: "120 phút",
    description: "Tháo đường chỉ quần jeans, cắt và may lại thành áo khoác denim độc đáo. Cần máy may.",
    materials_needed: ["Máy may", "Kéo", "Chỉ denim", "Thước"],
    clothingType: ["Quần jeans"],
    tags: ["áo khoác", "denim", "thời trang"], likes: 198,
    image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+denim+jacket+from+jeans",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "14", title: "Quần short từ quần dài", category: "Upcycle",
    difficulty: "Dễ", time: "20 phút",
    description: "Cắt quần dài thành quần short, viền gấu bằng kéo zigzag hoặc để raw hem. Nhanh và trendy.",
    materials_needed: ["Kéo", "Thước", "Phấn may"],
    clothingType: ["Quần jeans", "Quần kaki", "Quần vải"],
    tags: ["quần short", "mùa hè", "nhanh"], likes: 267,
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80",
    tutorialUrl: "https://www.youtube.com/results?search_query=diy+cut+off+shorts+from+jeans",
    tutorialLabel: "Xem hướng dẫn YouTube",
  },
  {
    id: "15", title: "Túi đựng giày từ áo cũ", category: "Tái chế",
    difficulty: "Dễ", time: "30 phút",
    description: "Khâu miệng áo lại, thêm dây rút ở cổ áo. Thành túi đựng giày hoặc đồ gym tiện lợi.",
    materials_needed: ["Kim chỉ", "Dây rút", "Kéo"],
    clothingType: ["Áo thun", "Áo hoodie"],
    tags: ["túi", "gym", "tiện lợi"], likes: 134,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    tutorialUrl: "https://www.pinterest.com/search/pins/?q=tshirt+drawstring+bag+diy",
    tutorialLabel: "Xem ý tưởng Pinterest",
  },
];

const CATEGORIES = ["Tất cả", "Tái chế", "Upcycle"];
const DIFFICULTIES = ["Tất cả", "Rất dễ", "Dễ", "Trung bình", "Khó"];

const CATEGORY_COLORS: Record<string, string> = {
  "Tái chế": "bg-green-100 text-green-700 border-green-200",
  "Tái sử dụng": "bg-blue-100 text-blue-700 border-blue-200",
  "Donate": "bg-pink-100 text-pink-700 border-pink-200",
  "Upcycle": "bg-violet-100 text-violet-700 border-violet-200",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  "Rất dễ": "text-green-600",
  "Dễ": "text-blue-600",
  "Trung bình": "text-yellow-600",
  "Khó": "text-red-500",
};

// ─── IDEA CARD ───────────────────────────────────────────────

function IdeaCard({ idea, expanded, onToggle }: {
  idea: RecycleIdea;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white overflow-hidden transition-all hover:shadow-md",
        expanded ? "border-green-300 shadow-md" : "border-zinc-200"
      )}
    >
      {/* Card row: ảnh trái + chữ phải */}
      <div className="flex cursor-pointer" onClick={onToggle}>
        {/* Ảnh bên trái */}
        {idea.image && (
          <div className="relative w-40 h-40 shrink-0 bg-zinc-100">
            <Image
              src={idea.image}
              alt={idea.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Chữ bên phải */}
        <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="font-semibold text-zinc-900 text-sm leading-snug">
                {idea.title}
              </p>
              <span className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                CATEGORY_COLORS[idea.category] || "bg-zinc-100 text-zinc-600 border-zinc-200"
              )}>{idea.category}</span>
            </div>
            <p className="text-xs text-zinc-500 line-clamp-3 mb-3">{idea.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Wrench size={11} className="text-zinc-400" />
              <span className={cn("text-xs font-medium", DIFFICULTY_COLORS[idea.difficulty] || "text-zinc-500")}>
                {idea.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-zinc-400" />
              <span className="text-xs text-zinc-400">{idea.time}</span>
            </div>
            <span className="ml-auto text-xs text-zinc-400">❤️ {idea.likes}</span>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-100 p-5 bg-zinc-50 flex flex-col gap-4">
          {/* Ảnh to hơn khi expand */}
          {idea.image && (
            <div className="relative h-52 w-full rounded-xl overflow-hidden">
              <Image src={idea.image} alt={idea.title} fill className="object-cover" unoptimized />
            </div>
          )}

          <p className="text-sm text-zinc-700 leading-relaxed">{idea.description}</p>

          {idea.materials_needed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-600 mb-2">🔧 Cần chuẩn bị:</p>
              <div className="flex flex-wrap gap-1.5">
                {idea.materials_needed.map((m, i) => (
                  <span key={i} className="rounded-full bg-white border border-zinc-200 px-3 py-1 text-xs text-zinc-600">{m}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {idea.tags.map((t) => (
              <span key={t} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">#{t}</span>
            ))}
          </div>

          {idea.tutorialUrl && (
            <a
              href={idea.tutorialUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              <ExternalLink size={14} />
              {idea.tutorialLabel || "Xem hướng dẫn"}
            </a>
          )}
        </div>
      )}

      <div className="flex justify-center pb-1.5 cursor-pointer" onClick={onToggle}>
        {expanded ? <ChevronUp size={13} className="text-zinc-300" /> : <ChevronDown size={13} className="text-zinc-300" />}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

export default function RecycleHub() {
  // Forum state
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Tất cả");
  const [filterDiff, setFilterDiff] = useState("Tất cả");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  // AI scanner state
  const [imageBase64, setImageBase64] = useState("");
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [imagePreview, setImagePreview] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [aiIdeas, setAiIdeas] = useState<RecycleIdea[]>([]);
  const [aiExpandedId, setAiExpandedId] = useState<string | null>(null);
  const [scanError, setScanError] = useState("");

  // Filter forum ideas
  const filtered = FORUM_IDEAS.filter((idea) => {
    const matchSearch = search === "" ||
      idea.title.toLowerCase().includes(search.toLowerCase()) ||
      idea.tags.some((t) => t.includes(search.toLowerCase())) ||
      idea.clothingType.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCat === "Tất cả" || idea.category === filterCat;
    const matchDiff = filterDiff === "Tất cả" || idea.difficulty === filterDiff;
    return matchSearch && matchCat && matchDiff;
  }).sort((a, b) => b.likes - a.likes);

  // AI scan
  const handleScan = async () => {
    if (!imageBase64) return;
    setIsScanning(true);
    setScanError("");
    setAiIdeas([]);

    try {
      const res = await fetch("/api/scan-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: imageMime }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // Convert scan result thành RecycleIdea cards
      const ideas: RecycleIdea[] = (result.data?.recycleSuggestions || []).map(
        (s: { title: string; category: string; difficulty: string; time: string; description: string; materials_needed: string[] }, i: number) => ({
          id: `ai-${i}`,
          title: s.title,
          category: s.category || "Tái chế",
          difficulty: s.difficulty || "Dễ",
          time: s.time || "30 phút",
          description: s.description,
          materials_needed: s.materials_needed || [],
          clothingType: [],
          tags: ["AI gợi ý"],
          likes: 0,
        })
      );
      setAiIdeas(ideas);
      if (ideas.length > 0) setAiExpandedId("ai-0");
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Lỗi scan");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

      {/* ── CỘT TRÁI: FORUM Ý TƯỞNG ── */}
      <div className="flex flex-col gap-4 lg:col-span-3">
        <div>
          <h3 className="font-bold text-zinc-900 text-lg">♻️ Kho ý tưởng tái chế</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Browse {FORUM_IDEAS.length} ý tưởng — không cần chụp ảnh</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm ý tưởng, loại đồ, tag..."
            className="w-full rounded-xl border border-zinc-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
        </div>

        {/* Filter toggle */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition w-fit"
          >
            <Filter size={13} />
            Lọc theo danh mục & độ khó
            {showFilter ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showFilter && (
            <div className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setFilterCat(c)}
                    className={cn("rounded-full px-3 py-1 text-xs font-medium transition",
                      filterCat === c ? "bg-green-600 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-green-400"
                    )}>{c}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button key={d} onClick={() => setFilterDiff(d)}
                    className={cn("rounded-full px-3 py-1 text-xs font-medium transition",
                      filterDiff === d ? "bg-green-600 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-green-400"
                    )}>{d}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-400">{filtered.length} ý tưởng</p>

        {/* Ideas list */}
        <div className="flex flex-col gap-3 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-zinc-400 text-sm">Không tìm thấy ý tưởng phù hợp</div>
          ) : (
            filtered.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                expanded={expandedId === idea.id}
                onToggle={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── CỘT PHẢI: AI HỖ TRỢ ── */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div>
          <h3 className="font-bold text-zinc-900 text-lg">🤖 AI Hỗ trợ thiết kế</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Chụp sản phẩm → AI gợi ý ý tưởng tái chế cá nhân hóa</p>
        </div>

        {/* Upload */}
        <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={15} className="text-green-600" />
            <p className="text-sm font-semibold text-zinc-700">Chụp sản phẩm muốn tái chế</p>
          </div>

          <ImageUploader
            label=""
            hint="Chụp áo cũ, quần jeans, hoặc tem thành phần"
            previewUrl={imagePreview}
            onImageChange={(b64, mime, preview) => {
              setImageBase64(b64);
              setImageMime(mime);
              setImagePreview(preview);
            }}
          />

          <button
            onClick={handleScan}
            disabled={!imageBase64 || isScanning}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {isScanning
              ? <><Loader2 size={15} className="animate-spin" /> AI đang phân tích...</>
              : <><Sparkles size={15} /> Tìm ý tưởng tái chế</>}
          </button>
        </div>

        {scanError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">⚠️ {scanError}</div>
        )}

        {/* AI results */}
        {aiIdeas.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Leaf size={14} className="text-green-500" />
              <p className="text-sm font-semibold text-zinc-700">
                ✨ {aiIdeas.length} ý tưởng AI gợi ý cho bạn
              </p>
            </div>
            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {aiIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  expanded={aiExpandedId === idea.id}
                  onToggle={() => setAiExpandedId(aiExpandedId === idea.id ? null : idea.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isScanning && aiIdeas.length === 0 && !scanError && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 py-10">
            <div className="rounded-full bg-green-50 p-4">
              <Recycle size={24} className="text-green-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-500">Chưa có gợi ý AI</p>
              <p className="text-xs text-zinc-400 mt-1">Chụp sản phẩm để AI tạo ý tưởng riêng cho bạn</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
