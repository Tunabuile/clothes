"use client";

import { useState } from "react";
import { Recycle, Clock, Wrench, ChevronDown, ChevronUp, Loader2, Search, Sparkles, Camera, Filter, ExternalLink, Leaf } from "lucide-react";
import ImageUploader from "./ImageUploader";
import { cn } from "@/lib/utils";
import SmartImage from "./SmartImage";

interface Idea {
  id: string; title: string; category: string; difficulty: string; time: string;
  description: string; materials_needed: string[]; clothingType: string[];
  tags: string[]; likes: number; searchQuery: string;
  tutorialUrl?: string; tutorialLabel?: string;
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
    searchQuery:"denim shorts summer fashion",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+cut+off+shorts+jeans", tutorialLabel:"Xem YouTube" },
  { id:"12", title:"Túi dây rút từ áo cũ", category:"Tái chế", difficulty:"Dễ", time:"30 phút",
    description:"Khâu miệng áo lại, thêm dây rút ở cổ áo. Thành túi đựng giày hoặc đồ gym.",
    materials_needed:["Kim chỉ","Dây rút","Kéo"], clothingType:["Áo thun"], tags:["túi","gym"], likes:134,
    searchQuery:"drawstring bag gym sports backpack",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=tshirt+drawstring+bag+diy", tutorialLabel:"Xem Pinterest" },
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

function IdeaCard({ idea, expanded, onToggle }: { idea: Idea; expanded: boolean; onToggle: () => void }) {
  return (
    <div className={cn("rounded-2xl border bg-white overflow-hidden transition-all hover:shadow-md",
      expanded ? "border-green-300 shadow-md" : "border-zinc-200")}>
      <div className="flex cursor-pointer" onClick={onToggle}>
        <SmartImage query={idea.searchQuery} alt={idea.title} className="w-40 h-40 shrink-0" />
        <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="font-semibold text-zinc-900 text-sm leading-snug">{idea.title}</p>
              <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                CAT_COLORS[idea.category] || "bg-zinc-100 text-zinc-600 border-zinc-200")}>{idea.category}</span>
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
            {idea.tags.map((t) => <span key={t} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">#{t}</span>)}
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

  const filtered = IDEAS.filter((idea) => {
    const q = search.toLowerCase();
    const matchSearch = !q || idea.title.toLowerCase().includes(q) ||
      idea.tags.some((t) => t.includes(q)) || idea.clothingType.some((t) => t.toLowerCase().includes(q));
    return matchSearch && (filterCat === "Tất cả" || idea.category === filterCat)
      && (filterDiff === "Tất cả" || idea.difficulty === filterDiff);
  }).sort((a, b) => b.likes - a.likes);

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
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="flex flex-col gap-4 lg:col-span-3">
        <div>
          <h3 className="font-bold text-zinc-900 text-lg">♻️ Kho ý tưởng tái chế</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Browse {IDEAS.length} ý tưởng — ảnh tự động tìm theo chủ đề</p>
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
              <IdeaCard key={idea.id} idea={idea}
                expanded={expandedId === idea.id}
                onToggle={() => setExpandedId(expandedId === idea.id ? null : idea.id)} />
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
  );
}
