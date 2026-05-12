"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Recycle,
  Clock,
  Wrench,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Sparkles,
  Camera,
  Filter,
  ExternalLink,
  Leaf,
  Plus,
  Trash2,
  BookmarkPlus,
} from "lucide-react";
import ImageUploader from "./ImageUploader";
import { cn } from "@/lib/utils";
import SmartImage from "./SmartImage";

interface Idea {
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
  searchQuery: string;
  tutorialUrl?: string;
  tutorialLabel?: string;
  /** ý tưởng do người dùng thêm — lưu localStorage (chỉ trên máy) */
  createdAt?: number;
}

const CUSTOM_IDEAS_STORAGE_KEY = "fitai-recycle-custom-ideas";

function splitToList(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function loadCustomIdeasFromStorage(): Idea[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_IDEAS_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((x): x is Idea => {
      if (!x || typeof x !== "object") return false;
      const o = x as Idea;
      return (
        typeof o.id === "string" &&
        o.id.startsWith("custom-") &&
        typeof o.title === "string" &&
        o.title.length > 0 &&
        typeof o.description === "string"
      );
    }) as Idea[];
  } catch {
    return [];
  }
}

function saveCustomIdeasToStorage(ideas: Idea[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_IDEAS_STORAGE_KEY, JSON.stringify(ideas));
}

function isBuiltinId(id: string) {
  return /^\d+$/.test(id);
}

function isLocalCustomId(id: string) {
  return id.startsWith("custom-");
}

function isCommunityId(id: string) {
  return !isBuiltinId(id) && !isLocalCustomId(id);
}

const IDEAS: Idea[] = [
  { id:"1", title:"Túi tote từ áo thun cũ", category:"Tái chế", difficulty:"Rất dễ", time:"20 phút",
    description:"Cắt tay áo, khâu đáy lại là xong một chiếc túi tote xinh xắn. Không cần máy may.",
    materials_needed:["Kéo","Kim chỉ hoặc keo vải"], clothingType:["T-shirt"], tags:["túi","nhanh"], likes:234,
    searchQuery:"fabric tote bag handmade",
    tutorialUrl:"https://www.youtube.com/results?search_query=t-shirt+tote+bag+no+sew+diy", tutorialLabel:"Xem YouTube" },
  { id:"2", title:"Crop top từ áo rộng", category:"Upcycle", difficulty:"Dễ", time:"15 phút",
    description:"Cắt phần dưới áo oversized, viền lại bằng kéo zigzag hoặc để raw hem cho phong cách.",
    materials_needed:["Kéo","Thước"], clothingType:["Áo thun"], tags:["crop","trendy"], likes:312,
    searchQuery:"crop top fashion woman shirt",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+crop+top+oversized+shirt", tutorialLabel:"Xem YouTube" },
  { id:"3", title:"Gối ôm từ quần jeans", category:"Tái chế", difficulty:"Trung bình", time:"45 phút",
    description:"Dùng ống quần jeans, khâu một đầu, nhồi bông vào. Ra gối hình trụ độc đáo.",
    materials_needed:["Kim chỉ","Bông nhồi","Kéo"], clothingType:["Quần jeans"], tags:["gối","jeans"], likes:156,
    searchQuery:"denim pillow cushion sofa",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=denim+jeans+pillow+diy", tutorialLabel:"Xem Pinterest" },
  { id:"4", title:"Chậu cây từ quần jeans", category:"Tái chế", difficulty:"Dễ", time:"30 phút",
    description:"Cắt ống quần, khâu đáy, lót túi nilon bên trong, đổ đất trồng cây. Decor cực chất.",
    materials_needed:["Kéo","Kim chỉ","Đất trồng"], clothingType:["Quần jeans"], tags:["cây","decor"], likes:201,
    searchQuery:"plant pot garden green indoor",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=denim+jeans+planter+diy", tutorialLabel:"Xem Pinterest" },
  { id:"5", title:"Ví nhỏ từ túi quần jeans", category:"Upcycle", difficulty:"Trung bình", time:"40 phút",
    description:"Tháo túi quần jeans ra, thêm khóa kéo, thành ví đựng tiền lẻ siêu cute.",
    materials_needed:["Kéo","Khóa kéo","Kim chỉ"], clothingType:["Quần jeans"], tags:["ví","phụ kiện"], likes:143,
    searchQuery:"small wallet purse handmade leather",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+wallet+jeans+pocket", tutorialLabel:"Xem YouTube" },
  { id:"6", title:"Thảm bện từ áo cũ", category:"Tái chế", difficulty:"Trung bình", time:"60 phút",
    description:"Cắt nhiều áo cũ thành dải, bện lại thành thảm tròn. Bền và đẹp.",
    materials_needed:["Kéo","Móc đan"], clothingType:["Áo thun","Áo len"], tags:["thảm","đan"], likes:167,
    searchQuery:"braided rug colorful handmade floor",
    tutorialUrl:"https://www.youtube.com/results?search_query=braided+rug+old+clothes+diy", tutorialLabel:"Xem YouTube" },
  { id:"7", title:"Băng đô từ áo thun", category:"Upcycle", difficulty:"Rất dễ", time:"5 phút",
    description:"Cắt một dải ngang từ thân áo thun, độ rộng 5-8cm. Kéo nhẹ để cuộn lại.",
    materials_needed:["Kéo"], clothingType:["Áo thun"], tags:["phụ kiện","tóc"], likes:345,
    searchQuery:"hair headband woman accessory",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+headband+tshirt", tutorialLabel:"Xem YouTube" },
  { id:"8", title:"Bao gối từ áo sơ mi", category:"Tái chế", difficulty:"Dễ", time:"25 phút",
    description:"Áo sơ mi có sẵn hàng cúc — nhét gối vào, cài cúc lại. Không cần khâu.",
    materials_needed:["Gối"], clothingType:["Áo sơ mi"], tags:["gối","phòng ngủ"], likes:289,
    searchQuery:"pillow cushion white bedroom cozy",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=shirt+pillowcase+diy", tutorialLabel:"Xem Pinterest" },
  { id:"9", title:"Giỏ đan từ áo len", category:"Tái chế", difficulty:"Trung bình", time:"50 phút",
    description:"Cắt áo len thành dải, đan thành giỏ hình tròn. Dùng đựng đồ chơi, sách.",
    materials_needed:["Kéo","Móc đan"], clothingType:["Áo len"], tags:["giỏ","đan"], likes:122,
    searchQuery:"woven basket storage knit handmade",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+basket+old+sweater", tutorialLabel:"Xem YouTube" },
  { id:"10", title:"Áo khoác denim từ quần jeans", category:"Upcycle", difficulty:"Khó", time:"120 phút",
    description:"Tháo đường chỉ quần jeans, cắt và may lại thành áo khoác denim độc đáo.",
    materials_needed:["Máy may","Kéo","Chỉ denim"], clothingType:["Quần jeans"], tags:["áo khoác","denim"], likes:198,
    searchQuery:"denim jacket street style fashion",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+denim+jacket+from+jeans", tutorialLabel:"Xem YouTube" },
  { id:"11", title:"Quần short từ quần dài", category:"Upcycle", difficulty:"Dễ", time:"20 phút",
    description:"Cắt quần dài thành quần short, để raw hem. Nhanh và trendy.",
    materials_needed:["Kéo","Thước"], clothingType:["Quần jeans","Quần kaki"], tags:["quần short","mùa hè"], likes:267,
    searchQuery:"denim jeans scissors cutting fabric DIY",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+cut+off+shorts+jeans", tutorialLabel:"Xem YouTube" },
  { id:"12", title:"Túi dây rút từ áo cũ", category:"Tái chế", difficulty:"Dễ", time:"30 phút",
    description:"Khâu miệng áo lại, thêm dây rút ở cổ áo. Thành túi đựng giày hoặc đồ gym.",
    materials_needed:["Kim chỉ","Dây rút","Kéo"], clothingType:["Áo thun"], tags:["túi","gym"], likes:134,
    searchQuery:"drawstring bag gym sports backpack",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=tshirt+drawstring+bag+diy", tutorialLabel:"Xem Pinterest" },
  { id:"13", title:"Scrunchie cột tóc từ vải áo thun", category:"Upcycle", difficulty:"Rất dễ", time:"10 phút",
    description:"Cắt dải vải dọc theo thân áo thun (có độ giãn), buộc nút quanh chun tóc. Nhanh, không cần may.",
    materials_needed:["Kéo","Chun tóc"], clothingType:["Áo thun","Váy"], tags:["tóc","phụ kiện"], likes:298,
    searchQuery:"scrunchie hair tie fabric DIY",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+scrunchie+from+t+shirt", tutorialLabel:"Xem YouTube" },
  { id:"14", title:"Tạp dề nhà bếp từ áo sơ mi cũ", category:"Upcycle", difficulty:"Dễ", time:"35 phút",
    description:"Dùng thân áo làm tạp dề, tận dụng cổ làm vòng đeo cổ hoặc thêm dây quấn eo. Chống bắn dầu màu.",
    materials_needed:["Kéo","Kim chỉ","Thước"], clothingType:["Áo sơ mi"], tags:["bếp","tạp dề"], likes:176,
    searchQuery:"apron kitchen DIY shirt upcycle",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+apron+from+shirt", tutorialLabel:"Xem YouTube" },
  { id:"15", title:"Miếng lau bếp tái chế từ áo cotton", category:"Tái chế", difficulty:"Rất dễ", time:"15 phút",
    description:"Cắt áo cũ thành miếng vuông 25–30cm, viền zigzag hoặc để raw edge. Giặt máy được, thay giấy ăn.",
    materials_needed:["Kéo","Máy may (tuỳ chọn)"], clothingType:["Áo thun","Khăn"], tags:["bếp","zero waste"], likes:412,
    searchQuery:"unpaper towels cloth kitchen eco",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=upcycled+tshirt+rags+kitchen", tutorialLabel:"Xem Pinterest" },
  { id:"16", title:"Bọc chậu cây từ tất/vớ cũ", category:"Tái chế", difficulty:"Rất dễ", time:"5 phút",
    description:"Kéo tất len qua chậu nhỏ để tạo lớp áo ấm cho cây, hoặc cắt đáy làm ống bọc chai thủy canh.",
    materials_needed:["Kéo","Chậu hoặc chai"], clothingType:["Tất"], tags:["cây","decor"], likes:189,
    searchQuery:"sock planter cozy plant pot DIY",
    tutorialUrl:"https://www.youtube.com/results?search_query=sock+planter+DIY", tutorialLabel:"Xem YouTube" },
  { id:"17", title:"Chăn patchwork từ nhiều áo cũ", category:"Tái chế", difficulty:"Khó", time:"180 phút",
    description:"Cắt các ô vuông đồng kích thước từ áo thun, sơ mi, jeans mỏng; ghép thành chăn sofa hoặc thảm picnic.",
    materials_needed:["Kéo","Máy may","Lót vải"], clothingType:["Áo thun","Áo sơ mi","Quần jeans"], tags:["chăn","ghép vải"], likes:223,
    searchQuery:"patchwork quilt old clothes blanket",
    tutorialUrl:"https://www.youtube.com/results?search_query=memory+quilt+old+tshirts", tutorialLabel:"Xem YouTube" },
  { id:"18", title:"Bookmark vải từ dải áo/cổ áo", category:"Upcycle", difficulty:"Rất dễ", time:"8 phút",
    description:"Cắt dải vải cứng từ cổ áo sơ mi hoặc gấu quần, dán ép hoặc khâu mép, thêm lỗ xỏ dây.",
    materials_needed:["Kéo","Keo vải"], clothingType:["Áo sơ mi","Quần jeans"], tags:["sách","nhỏ"], likes:156,
    searchQuery:"fabric bookmark handmade reading",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=fabric+bookmark+diy", tutorialLabel:"Xem Pinterest" },
  { id:"19", title:"Thảm chùi chân từ ống quần jeans", category:"Tái chế", difficulty:"Dễ", time:"25 phút",
    description:"Cắt hai ống quần, khâu một đầu, lót cao su chống trượt phía dưới hoặc nhồi vải vụn cho êm.",
    materials_needed:["Kéo","Kim chỉ","Lót chống trượt"], clothingType:["Quần jeans"], tags:["cửa ra vào","thảm"], likes:267,
    searchQuery:"denim door mat DIY jeans rug",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+denim+rug+from+jeans", tutorialLabel:"Xem YouTube" },
  { id:"20", title:"Găng tay làm vườn từ tất len dày", category:"Upcycle", difficulty:"Dễ", time:"12 phút",
    description:"Cắt ngón tất thành găng ngắn, hoặc dùng nguyên tất dài để bảo vệ tay khi làm vườn.",
    materials_needed:["Kéo"], clothingType:["Tất"], tags:["vườn","làm đất"], likes:134,
    searchQuery:"garden gloves DIY socks",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+garden+gloves+socks", tutorialLabel:"Xem YouTube" },
  { id:"21", title:"Bọc laptop / sách từ áo hoodie", category:"Upcycle", difficulty:"Trung bình", time:"55 phút",
    description:"May lại thân hoodie thành túi có khóa kéo, lót mỏng chống sốc. Tận dụng túi kangaroo phía trước.",
    materials_needed:["Kéo","Máy may","Khóa kéo","Lót"], clothingType:["Áo hoodie"], tags:["túi","công nghệ"], likes:301,
    searchQuery:"hoodie laptop sleeve DIY sewing",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+laptop+sleeve+hoodie", tutorialLabel:"Xem YouTube" },
  { id:"22", title:"Vòng tay vải friendship bracelet", category:"Upcycle", difficulty:"Rất dễ", time:"12 phút",
    description:"Bện hoặc xoắn dải vải từ áo thun nhiều màu, buộc nút cổ tay. Quà tặng handmade.",
    materials_needed:["Kéo"], clothingType:["Áo thun"], tags:["trang sức","tay"], likes:421,
    searchQuery:"fabric bracelet braided handmade",
    tutorialUrl:"https://www.youtube.com/results?search_query=fabric+scrap+bracelet+diy", tutorialLabel:"Xem YouTube" },
  { id:"23", title:"Khăn ướt tái sử dụng từ flannel / áo mềm", category:"Tái chế", difficulty:"Dễ", time:"20 phút",
    description:"Cắt áo flannel hoặc áo em bé thành khăn vuông, viền kỹ. Dùng với nước lau mặt cho bé hoặc tẩy trang.",
    materials_needed:["Kéo","Máy may"], clothingType:["Áo sơ mi","Áo len"], tags:["em bé","skincare"], likes:198,
    searchQuery:"reusable wipes cloth baby DIY",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=reusable+fabric+wipes+diy", tutorialLabel:"Xem Pinterest" },
  { id:"24", title:"Nơ / cài tóc từ cà vạt cũ", category:"Upcycle", difficulty:"Dễ", time:"18 phút",
    description:"Tháo đường chỉ cà vạt, gấp thành nơ bow tie hoặc kẹp tóc phía sau bằng kẹp cá sấu.",
    materials_needed:["Kéo","Kim chỉ","Kẹp tóc"], clothingType:["Cà vạt","Áo sơ mi"], tags:["tóc","công sở"], likes:167,
    searchQuery:"bow tie hair clip DIY necktie",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+bow+from+necktie", tutorialLabel:"Xem YouTube" },
  { id:"25", title:"Ốp lót ly từ tay áo len", category:"Tái chế", difficulty:"Rất dễ", time:"10 phút",
    description:"Cắt khoanh tay áo len thành vòng tròn, khâu kín mép — lót ly chống trầy bàn.",
    materials_needed:["Kéo","Kim chỉ"], clothingType:["Áo len"], tags:["bàn","decor"], likes:244,
    searchQuery:"cozy mug sweater sleeve DIY",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=sweater+mug+cozy", tutorialLabel:"Xem Pinterest" },
  { id:"26", title:"Túi đựng mỹ phẩm từ tay áo khoác", category:"Upcycle", difficulty:"Trung bình", time:"40 phút",
    description:"Cắt hai tay áo khoác, khâu đáy và cạnh thành hộp nhỏ; dùng cổ tay làm quai xách.",
    materials_needed:["Kéo","Máy may","Khóa kéo nhỏ"], clothingType:["Áo khoác","Áo hoodie"], tags:["du lịch","làm đẹp"], likes:212,
    searchQuery:"cosmetic pouch DIY sleeve sewing",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+makeup+bag+from+sleeve", tutorialLabel:"Xem YouTube" },
  { id:"27", title:"Váy cho búp bê / thú nhồi từ vớ", category:"Tái chế", difficulty:"Dễ", time:"22 phút",
    description:"Cắt phần gót tất, may thân váy hình nón từ phần ống — trang phục cho handmade toy.",
    materials_needed:["Kéo","Kim chỉ","Búp bê"], clothingType:["Tất"], tags:["trẻ em","đồ chơi"], likes:155,
    searchQuery:"sock doll dress DIY miniature",
    tutorialUrl:"https://www.youtube.com/results?search_query=sock+doll+clothes+diy", tutorialLabel:"Xem YouTube" },
  { id:"28", title:"Khăn choàng cổ từ khăn quàng / áo mỏng", category:"Upcycle", difficulty:"Dễ", time:"20 phút",
    description:"Cắt dải dài từ khăn vuông cũ hoặc váy chiffon, fringing mép — infinity scarf nhẹ.",
    materials_needed:["Kéo"], clothingType:["Khăn","Váy"], tags:["mùa đông","layer"], likes:276,
    searchQuery:"infinity scarf DIY lightweight fabric",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+infinity+scarf+from+shirt", tutorialLabel:"Xem YouTube" },
  { id:"29", title:"Đệm ngồi ghế văn phòng từ áo hoodie", category:"Tái chế", difficulty:"Trung bình", time:"50 phút",
    description:"Nhồi mút hoặc vải vụn vào thân hoodie, khâu kín — đệm êm cho ghế gaming hoặc xe.",
    materials_needed:["Kéo","Máy may","Mút vụn"], clothingType:["Áo hoodie"], tags:["văn phòng","ergonomic"], likes:188,
    searchQuery:"seat cushion DIY hoodie upcycle",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+seat+cushion+old+sweatshirt", tutorialLabel:"Xem YouTube" },
  { id:"30", title:"Dây buộc cáp / tai nghe từ dải áo thun", category:"Upcycle", difficulty:"Rất dễ", time:"6 phút",
    description:"Cắt dải dọc áo thun có đàn hồi, kéo giãn để cuộn — buộc gọn dây sạc trong balo.",
    materials_needed:["Kéo"], clothingType:["Áo thun"], tags:["công nghệ","gọn gàng"], likes:331,
    searchQuery:"cable organizer fabric tie DIY",
    tutorialUrl:"https://www.youtube.com/results?search_query=t+shirt+yarn+cord+diy", tutorialLabel:"Xem YouTube" },
];

const CATEGORIES = ["Tất cả", "Tái chế", "Upcycle"];
const DIFFICULTIES = ["Tất cả", "Rất dễ", "Dễ", "Trung bình", "Khó"];
const CAT_COLORS: Record<string, string> = {
  "Tái chế": "bg-green-100 text-green-700 border-green-200",
  "Upcycle": "bg-violet-100 text-violet-700 border-violet-200",
};
const DIFF_COLORS: Record<string, string> = {
  "Rất dễ": "text-green-600", "Dễ": "text-blue-600",
  "Trung bình": "text-yellow-600", "Khó": "text-red-500",
};

function IdeaCard({
  idea,
  expanded,
  onToggle,
  isLocalIdea,
  isCommunityIdea,
  onDelete,
}: {
  idea: Idea;
  expanded: boolean;
  onToggle: () => void;
  isLocalIdea?: boolean;
  isCommunityIdea?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white overflow-hidden transition-all hover:shadow-md",
        expanded ? "border-green-300 shadow-md" : "border-zinc-200",
        isLocalIdea && "ring-1 ring-amber-200/80",
        isCommunityIdea && "ring-1 ring-sky-200/90"
      )}
    >
      <div className="flex cursor-pointer" onClick={onToggle}>
        <SmartImage query={idea.searchQuery} alt={idea.title} className="w-40 h-40 shrink-0" />
        <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-900 text-sm leading-snug">{idea.title}</p>
                {isCommunityIdea && (
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-700/90">
                    Cộng đồng — mọi người đều thấy
                  </p>
                )}
                {isLocalIdea && (
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700/90">
                    Chỉ lưu trên máy bạn
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-start gap-1">
                {isLocalIdea && onDelete && (
                  <button
                    type="button"
                    title="Xóa khỏi danh sách đã lưu"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-xs font-medium",
                    CAT_COLORS[idea.category] || "bg-zinc-100 text-zinc-600 border-zinc-200"
                  )}
                >
                  {idea.category}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 line-clamp-3 mb-3">{idea.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Wrench size={11} className="text-zinc-400" />
              <span className={cn("text-xs font-medium", DIFF_COLORS[idea.difficulty] || "text-zinc-500")}>{idea.difficulty}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-zinc-400" />
              <span className="text-xs text-zinc-400">{idea.time}</span>
            </div>
            <span className="ml-auto text-xs text-zinc-400">❤️ {idea.likes}</span>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-zinc-100 p-5 bg-zinc-50 flex flex-col gap-4">
          <SmartImage query={idea.searchQuery} alt={idea.title} className="h-52 w-full rounded-xl" />
          <p className="text-sm text-zinc-700 leading-relaxed">{idea.description}</p>
          {(idea.materials_needed ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-600 mb-2">🔧 Cần chuẩn bị:</p>
              <div className="flex flex-wrap gap-1.5">
                {(idea.materials_needed ?? []).map((m, i) => (
                  <span key={i} className="rounded-full bg-white border border-zinc-200 px-3 py-1 text-xs text-zinc-600">{m}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {(idea.tags ?? []).map((t) => (
              <span key={t} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">#{t}</span>
            ))}
          </div>
          {idea.tutorialUrl && (
            <a href={idea.tutorialUrl} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition">
              <ExternalLink size={14} />{idea.tutorialLabel || "Xem hướng dẫn"}
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

export default function RecycleHub() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Tất cả");
  const [filterDiff, setFilterDiff] = useState("Tất cả");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [imageBase64, setImageBase64] = useState("");
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [imagePreview, setImagePreview] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [aiIdeas, setAiIdeas] = useState<Idea[]>([]);
  const [aiExpandedId, setAiExpandedId] = useState<string | null>(null);
  const [scanError, setScanError] = useState("");

  const [customIdeas, setCustomIdeas] = useState<Idea[]>([]);
  const [communityIdeas, setCommunityIdeas] = useState<Idea[]>([]);
  const [communityApiReady, setCommunityApiReady] = useState<boolean | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<"Tái chế" | "Upcycle">("Upcycle");
  const [formDifficulty, setFormDifficulty] = useState("Dễ");
  const [formTime, setFormTime] = useState("30 phút");
  const [formMaterials, setFormMaterials] = useState("");
  const [formClothingTypes, setFormClothingTypes] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formSearchQuery, setFormSearchQuery] = useState("");
  const [formTutorialUrl, setFormTutorialUrl] = useState("");
  const [formTutorialLabel, setFormTutorialLabel] = useState("Liên kết tham khảo");

  useEffect(() => {
    setCustomIdeas(loadCustomIdeasFromStorage());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/recycle-ideas");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setCommunityIdeas([]);
          setCommunityApiReady(false);
          return;
        }
        if (data.configured && Array.isArray(data.ideas)) {
          setCommunityIdeas(data.ideas as Idea[]);
          setCommunityApiReady(true);
        } else {
          setCommunityIdeas([]);
          setCommunityApiReady(false);
        }
      } catch {
        if (!cancelled) {
          setCommunityIdeas([]);
          setCommunityApiReady(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetAddForm = useCallback(() => {
    setFormError("");
    setFormTitle("");
    setFormDescription("");
    setFormCategory("Upcycle");
    setFormDifficulty("Dễ");
    setFormTime("30 phút");
    setFormMaterials("");
    setFormClothingTypes("");
    setFormTags("");
    setFormSearchQuery("");
    setFormTutorialUrl("");
    setFormTutorialLabel("Liên kết tham khảo");
  }, []);

  const handleDeleteCustom = useCallback((id: string) => {
    if (!confirm("Xóa ý tưởng này khỏi danh sách đã lưu?")) return;
    setCustomIdeas((prev) => {
      const next = prev.filter((i) => i.id !== id);
      try {
        saveCustomIdeasToStorage(next);
      } catch {
        /* ignore */
      }
      return next;
    });
    setExpandedId((cur) => (cur === id ? null : cur));
  }, []);

  const handleSaveLocalOnly = useCallback(() => {
    setFormError("");
    const title = formTitle.trim();
    const description = formDescription.trim();
    if (!title) {
      setFormError("Nhập tên ý tưởng.");
      return;
    }
    if (!description) {
      setFormError("Nhập mô tả các bước hoặc ý tưởng.");
      return;
    }
    const materials = splitToList(formMaterials);
    const clothingType = splitToList(formClothingTypes);
    const tags = splitToList(formTags);
    const searchQuery =
      formSearchQuery.trim() || `${title} DIY handmade upcycle`;
    const url = formTutorialUrl.trim();
    const newIdea: Idea = {
      id: `custom-${crypto.randomUUID()}`,
      title,
      description,
      category: formCategory,
      difficulty: formDifficulty,
      time: formTime.trim() || "30 phút",
      materials_needed: materials,
      clothingType: clothingType.length ? clothingType : ["Quần áo cũ"],
      tags: tags.length ? tags : ["của tôi"],
      likes: 0,
      searchQuery,
      createdAt: Date.now(),
      ...(url
        ? {
            tutorialUrl: url,
            tutorialLabel: formTutorialLabel.trim() || "Liên kết tham khảo",
          }
        : {}),
    };
    const next = [newIdea, ...customIdeas];
    try {
      saveCustomIdeasToStorage(next);
    } catch {
      setFormError("Không lưu được (trình duyệt chặn hoặc hết dung lượng).");
      return;
    }
    setCustomIdeas(next);
    setShowAddModal(false);
    resetAddForm();
    setExpandedId(newIdea.id);
  }, [
    customIdeas,
    formTitle,
    formDescription,
    formCategory,
    formDifficulty,
    formTime,
    formMaterials,
    formClothingTypes,
    formTags,
    formSearchQuery,
    formTutorialUrl,
    formTutorialLabel,
    resetAddForm,
  ]);

  const handlePublishCommunity = useCallback(async () => {
    setFormError("");
    const title = formTitle.trim();
    const description = formDescription.trim();
    if (!title) {
      setFormError("Nhập tên ý tưởng.");
      return;
    }
    if (!description) {
      setFormError("Nhập mô tả các bước hoặc ý tưởng.");
      return;
    }
    const materials = splitToList(formMaterials);
    const clothingType = splitToList(formClothingTypes);
    const tags = splitToList(formTags);
    const searchQuery =
      formSearchQuery.trim() || `${title} DIY handmade upcycle`;
    const url = formTutorialUrl.trim();
    setIsPublishing(true);
    try {
      const res = await fetch("/api/recycle-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category: formCategory,
          difficulty: formDifficulty,
          time: formTime.trim() || "30 phút",
          materials_needed: materials,
          clothingType: clothingType.length ? clothingType : ["Quần áo cũ"],
          tags: tags.length ? tags : ["cộng đồng"],
          searchQuery,
          tutorialUrl: url || undefined,
          tutorialLabel: url ? formTutorialLabel.trim() || "Liên kết tham khảo" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(typeof data.error === "string" ? data.error : "Không đăng được.");
        return;
      }
      const idea = data.idea as Idea;
      setCommunityIdeas((prev) => [idea, ...prev.filter((x) => x.id !== idea.id)]);
      setCommunityApiReady(true);
      setShowAddModal(false);
      resetAddForm();
      setExpandedId(idea.id);
    } catch {
      setFormError("Lỗi mạng. Thử lại sau.");
    } finally {
      setIsPublishing(false);
    }
  }, [
    formTitle,
    formDescription,
    formCategory,
    formDifficulty,
    formTime,
    formMaterials,
    formClothingTypes,
    formTags,
    formSearchQuery,
    formTutorialUrl,
    formTutorialLabel,
    resetAddForm,
  ]);

  const filtered = useMemo(() => {
    const combined = [...IDEAS, ...communityIdeas, ...customIdeas];
    const q = search.toLowerCase();
    const list = combined.filter((idea) => {
      const materials = idea.materials_needed ?? [];
      const tags = idea.tags ?? [];
      const types = idea.clothingType ?? [];
      const matchSearch =
        !q ||
        idea.title.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        materials.some((m) => m.toLowerCase().includes(q)) ||
        tags.some((t) => t.toLowerCase().includes(q)) ||
        types.some((t) => t.toLowerCase().includes(q));
      return (
        matchSearch &&
        (filterCat === "Tất cả" || idea.category === filterCat) &&
        (filterDiff === "Tất cả" || idea.difficulty === filterDiff)
      );
    });
    return list.sort((a, b) => {
      const ka = isLocalCustomId(a.id) ? 2 : isCommunityId(a.id) ? 1 : 0;
      const kb = isLocalCustomId(b.id) ? 2 : isCommunityId(b.id) ? 1 : 0;
      if (ka !== kb) return ka - kb;
      if (ka === 0) return b.likes - a.likes;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });
  }, [search, filterCat, filterDiff, customIdeas, communityIdeas]);

  const totalCount = IDEAS.length + customIdeas.length + communityIdeas.length;

  const handleScan = async () => {
    if (!imageBase64) return;
    setIsScanning(true); setScanError(""); setAiIdeas([]);
    try {
      const res = await fetch("/api/scan-label", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: imageMime }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      const ideas: Idea[] = (result.data?.recycleSuggestions || []).map(
        (s: { title: string; category: string; difficulty: string; time: string; description: string; materials_needed: string[] }, i: number) => ({
          id: `ai-${i}`, title: s.title, category: s.category || "Tái chế",
          difficulty: s.difficulty || "Dễ", time: s.time || "30 phút",
          description: s.description, materials_needed: s.materials_needed || [],
          clothingType: [], tags: ["AI"], likes: 0,
          searchQuery: s.title + " DIY handmade",
        })
      );
      setAiIdeas(ideas);
      if (ideas.length > 0) setAiExpandedId("ai-0");
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Lỗi scan");
    } finally { setIsScanning(false); }
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="flex flex-col gap-4 lg:col-span-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 text-lg">♻️ Kho ý tưởng tái chế</h3>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
              {IDEAS.length} ý tưởng có sẵn
              {communityApiReady === null && " · Đang tải kho cộng đồng…"}
              {communityApiReady === false &&
                " · Kho cộng đồng chưa bật — thêm biến môi trường Supabase và chạy SQL `community_recycle_ideas` trong SUPABASE_SETUP.md."}
              {communityApiReady === true &&
                ` · ${communityIdeas.length} ý tưởng do mọi người đăng (lưu trên Supabase)`}
              {customIdeas.length > 0
                ? ` · ${customIdeas.length} nháp chỉ trên máy bạn (localStorage)`
                : ""}
              {" "}— ảnh minh họa tìm theo chủ đề. Tổng trong kho: {totalCount}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100 transition"
          >
            <BookmarkPlus size={16} />
            Thêm &amp; đăng ý tưởng
          </button>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm ý tưởng, loại đồ, tag..."
            className="w-full rounded-xl border border-zinc-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition w-fit">
            <Filter size={13} />Lọc theo danh mục & độ khó
            {showFilter ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showFilter && (
            <div className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setFilterCat(c)}
                    className={cn("rounded-full px-3 py-1 text-xs font-medium transition",
                      filterCat === c ? "bg-green-600 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-green-400")}>{c}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button key={d} onClick={() => setFilterDiff(d)}
                    className={cn("rounded-full px-3 py-1 text-xs font-medium transition",
                      filterDiff === d ? "bg-green-600 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-green-400")}>{d}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-400">{filtered.length} ý tưởng</p>
        <div className="flex flex-col gap-3">
          {filtered.length === 0
            ? <div className="text-center py-10 text-zinc-400 text-sm">Không tìm thấy ý tưởng phù hợp</div>
            : filtered.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                expanded={expandedId === idea.id}
                onToggle={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                isLocalIdea={isLocalCustomId(idea.id)}
                isCommunityIdea={isCommunityId(idea.id)}
                onDelete={
                  isLocalCustomId(idea.id)
                    ? () => handleDeleteCustom(idea.id)
                    : undefined
                }
              />
            ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-2">
        <div>
          <h3 className="font-bold text-zinc-900 text-lg">🤖 AI Hỗ trợ thiết kế</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Chụp sản phẩm → AI gợi ý ý tưởng tái chế cá nhân hóa</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={15} className="text-green-600" />
            <p className="text-sm font-semibold text-zinc-700">Chụp sản phẩm muốn tái chế</p>
          </div>
          <ImageUploader label="" hint="Chụp áo cũ, quần jeans, hoặc tem thành phần"
            previewUrl={imagePreview}
            onImageChange={(b64, mime, preview) => { setImageBase64(b64); setImageMime(mime); setImagePreview(preview); }} />
          <button onClick={handleScan} disabled={!imageBase64 || isScanning}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
            {isScanning ? <><Loader2 size={15} className="animate-spin" /> AI đang phân tích...</> : <><Sparkles size={15} /> Tìm ý tưởng tái chế</>}
          </button>
        </div>
        {scanError && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">⚠️ {scanError}</div>}
        {aiIdeas.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Leaf size={14} className="text-green-500" />
              <p className="text-sm font-semibold text-zinc-700">✨ {aiIdeas.length} ý tưởng AI gợi ý</p>
            </div>
            {aiIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea}
                expanded={aiExpandedId === idea.id}
                onToggle={() => setAiExpandedId(aiExpandedId === idea.id ? null : idea.id)} />
            ))}
          </div>
        )}
        {!isScanning && aiIdeas.length === 0 && !scanError && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 py-10">
            <div className="rounded-full bg-green-50 p-4"><Recycle size={24} className="text-green-300" /></div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-500">Chưa có gợi ý AI</p>
              <p className="text-xs text-zinc-400 mt-1">Chụp sản phẩm để AI tạo ý tưởng riêng cho bạn</p>
            </div>
          </div>
        )}
      </div>
    </div>

    {showAddModal && (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-10 sm:pt-16">
        <button
          type="button"
          aria-label="Đóng"
          className="fixed inset-0 cursor-default"
          onClick={() => {
            setShowAddModal(false);
            resetAddForm();
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl"
        >
          <h4 className="text-base font-bold text-zinc-900">Đăng ý tưởng tái chế</h4>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
            <strong className="text-zinc-700">Đăng cho mọi người</strong> lưu lên Supabase — ai vào app cũng thấy.
            Hoặc <strong className="text-zinc-700">chỉ lưu nháp trên máy</strong> (localStorage) nếu bạn chưa bật kho cộng đồng.
          </p>
          {communityApiReady === false && (
            <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
              Hiện chưa kết nối kho cộng đồng. Nút &quot;Đăng cho mọi người&quot; sẽ báo lỗi cho đến khi bạn cấu hình Supabase và tạo bảng theo SUPABASE_SETUP.md.
            </p>
          )}
          <div className="mt-4 flex max-h-[min(70vh,540px)] flex-col gap-3 overflow-y-auto pr-1">
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">Tên ý tưởng *</span>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Ví dụ: Túi đựng đồ từ quần jean rách"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">Mô tả / các bước *</span>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Mô tả ngắn hoặc từng bước làm..."
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-zinc-600">Danh mục</span>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as "Tái chế" | "Upcycle")}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                >
                  <option value="Tái chế">Tái chế</option>
                  <option value="Upcycle">Upcycle</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-zinc-600">Độ khó</span>
                <select
                  value={formDifficulty}
                  onChange={(e) => setFormDifficulty(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                >
                  {DIFFICULTIES.filter((d) => d !== "Tất cả").map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">Thời gian ước tính</span>
              <input
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="30 phút"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">Đồ cần chuẩn bị (dấu phẩy hoặc xuống dòng)</span>
              <textarea
                value={formMaterials}
                onChange={(e) => setFormMaterials(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Kéo, kim chỉ, ..."
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">Loại quần áo gợi ý (tuỳ chọn)</span>
              <input
                value={formClothingTypes}
                onChange={(e) => setFormClothingTypes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Áo thun, quần jeans..."
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">Tag (tuỳ chọn)</span>
              <input
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="DIY, decor..."
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">Từ khoá ảnh minh hoạ (tuỳ chọn)</span>
              <input
                value={formSearchQuery}
                onChange={(e) => setFormSearchQuery(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Để trống sẽ dùng tên ý tưởng + DIY"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">Liên kết tham khảo (tuỳ chọn)</span>
              <input
                value={formTutorialUrl}
                onChange={(e) => setFormTutorialUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </label>
            {formTutorialUrl.trim() && (
              <label className="block">
                <span className="text-xs font-semibold text-zinc-600">Nhãn nút liên kết</span>
                <input
                  value={formTutorialLabel}
                  onChange={(e) => setFormTutorialLabel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                />
              </label>
            )}
          </div>
          {formError && (
            <p className="mt-3 text-sm text-red-600">{formError}</p>
          )}
          <div className="mt-5 flex flex-col gap-2 border-t border-zinc-100 pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                resetAddForm();
              }}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:order-1"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSaveLocalOnly}
              disabled={isPublishing}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
            >
              Chỉ lưu trên máy tôi
            </button>
            <button
              type="button"
              onClick={() => void handlePublishCommunity()}
              disabled={isPublishing || communityApiReady !== true}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang đăng…
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Đăng cho mọi người
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
