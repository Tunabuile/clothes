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
import { useI18n, type Lang } from "@/lib/i18n";

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

// ─── IDEAS (Vietnamese) ────────────────────────────────────────
const IDEAS_VI: Idea[] = [
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

// ─── IDEAS (English) ──────────────────────────────────────────
const IDEAS_EN: Idea[] = [
  { id:"1", title:"Tote bag from old t-shirt", category:"Recycle", difficulty:"Very Easy", time:"20 min",
    description:"Cut off sleeves, sew the bottom — you've got a cute tote bag. No sewing machine needed.",
    materials_needed:["Scissors","Needle & thread or fabric glue"], clothingType:["T-shirt"], tags:["bag","quick"], likes:234,
    searchQuery:"fabric tote bag handmade",
    tutorialUrl:"https://www.youtube.com/results?search_query=t-shirt+tote+bag+no+sew+diy", tutorialLabel:"Watch YouTube" },
  { id:"2", title:"Crop top from oversized shirt", category:"Upcycle", difficulty:"Easy", time:"15 min",
    description:"Cut the bottom of an oversized shirt, finish with zigzag scissors or leave raw hem for style.",
    materials_needed:["Scissors","Ruler"], clothingType:["T-shirt"], tags:["crop","trendy"], likes:312,
    searchQuery:"crop top fashion woman shirt",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+crop+top+oversized+shirt", tutorialLabel:"Watch YouTube" },
  { id:"3", title:"Body pillow from jeans", category:"Recycle", difficulty:"Medium", time:"45 min",
    description:"Use a jeans leg, sew one end, stuff with filling. Makes a unique cylindrical pillow.",
    materials_needed:["Needle & thread","Filling","Scissors"], clothingType:["Jeans"], tags:["pillow","jeans"], likes:156,
    searchQuery:"denim pillow cushion sofa",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=denim+jeans+pillow+diy", tutorialLabel:"See Pinterest" },
  { id:"4", title:"Plant pot from jeans", category:"Recycle", difficulty:"Easy", time:"30 min",
    description:"Cut pants leg, sew bottom, line with plastic bag inside, add soil. Super cool decor.",
    materials_needed:["Scissors","Needle & thread","Potting soil"], clothingType:["Jeans"], tags:["plant","decor"], likes:201,
    searchQuery:"plant pot garden green indoor",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=denim+jeans+planter+diy", tutorialLabel:"See Pinterest" },
  { id:"5", title:"Mini wallet from jeans pocket", category:"Upcycle", difficulty:"Medium", time:"40 min",
    description:"Remove jeans pocket, add a zipper, turn into super cute coin purse.",
    materials_needed:["Scissors","Zipper","Needle & thread"], clothingType:["Jeans"], tags:["wallet","accessory"], likes:143,
    searchQuery:"small wallet purse handmade leather",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+wallet+jeans+pocket", tutorialLabel:"Watch YouTube" },
  { id:"7", title:"Headband from t-shirt", category:"Upcycle", difficulty:"Very Easy", time:"5 min",
    description:"Cut a 5-8cm wide horizontal strip from t-shirt body. Stretch gently to curl.",
    materials_needed:["Scissors"], clothingType:["T-shirt"], tags:["accessory","hair"], likes:345,
    searchQuery:"hair headband woman accessory",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+headband+tshirt", tutorialLabel:"Watch YouTube" },
  { id:"8", title:"Pillow cover from shirt", category:"Recycle", difficulty:"Easy", time:"25 min",
    description:"Shirt already has buttons — stuff a pillow in, button up. No sewing needed.",
    materials_needed:["Pillow"], clothingType:["Shirt"], tags:["pillow","bedroom"], likes:289,
    searchQuery:"pillow cushion white bedroom cozy",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=shirt+pillowcase+diy", tutorialLabel:"See Pinterest" },
  { id:"9", title:"Woven basket from sweater", category:"Recycle", difficulty:"Medium", time:"50 min",
    description:"Cut sweater into strips, weave into a round basket. Use for toys, books.",
    materials_needed:["Scissors","Crochet hook"], clothingType:["Sweater"], tags:["basket","weave"], likes:122,
    searchQuery:"woven basket storage knit handmade",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+basket+old+sweater", tutorialLabel:"Watch YouTube" },
  { id:"10", title:"Denim jacket from jeans", category:"Upcycle", difficulty:"Hard", time:"120 min",
    description:"Unstitch jeans, cut and sew back into a unique denim jacket.",
    materials_needed:["Sewing machine","Scissors","Denim thread"], clothingType:["Jeans"], tags:["jacket","denim"], likes:198,
    searchQuery:"denim jacket street style fashion",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+denim+jacket+from+jeans", tutorialLabel:"Watch YouTube" },
  { id:"11", title:"Shorts from long pants", category:"Upcycle", difficulty:"Easy", time:"20 min",
    description:"Cut long pants into shorts, leave raw hem. Quick and trendy.",
    materials_needed:["Scissors","Ruler"], clothingType:["Jeans","Chinos"], tags:["shorts","summer"], likes:267,
    searchQuery:"denim jeans scissors cutting fabric DIY",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+cut+off+shorts+jeans", tutorialLabel:"Watch YouTube" },
  { id:"12", title:"Drawstring bag from old shirt", category:"Recycle", difficulty:"Easy", time:"30 min",
    description:"Sew shirt opening closed, add drawstring at collar. Great for shoes or gym gear.",
    materials_needed:["Needle & thread","Drawstring","Scissors"], clothingType:["T-shirt"], tags:["bag","gym"], likes:134,
    searchQuery:"drawstring bag gym sports backpack",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=tshirt+drawstring+bag+diy", tutorialLabel:"See Pinterest" },
  { id:"13", title:"Hair scrunchie from t-shirt fabric", category:"Upcycle", difficulty:"Very Easy", time:"10 min",
    description:"Cut a strip along t-shirt body (stretchy), tie it around a hair elastic. Quick, no sewing.",
    materials_needed:["Scissors","Hair elastic"], clothingType:["T-shirt","Dress"], tags:["hair","accessory"], likes:298,
    searchQuery:"scrunchie hair tie fabric DIY",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+scrunchie+from+t+shirt", tutorialLabel:"Watch YouTube" },
  { id:"14", title:"Kitchen apron from old shirt", category:"Upcycle", difficulty:"Easy", time:"35 min",
    description:"Use shirt body as apron, reuse collar as neck strap or add waist ties. Oil-repellent fabric.",
    materials_needed:["Scissors","Needle & thread","Ruler"], clothingType:["Shirt"], tags:["kitchen","apron"], likes:176,
    searchQuery:"apron kitchen DIY shirt upcycle",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+apron+from+shirt", tutorialLabel:"Watch YouTube" },
  { id:"16", title:"Planter cozy from old socks", category:"Recycle", difficulty:"Very Easy", time:"5 min",
    description:"Pull wool socks over a small pot for a warm plant layer, or cut the bottom for a hydroponic sleeve.",
    materials_needed:["Scissors","Pot or bottle"], clothingType:["Socks"], tags:["plant","decor"], likes:189,
    searchQuery:"sock planter cozy plant pot DIY",
    tutorialUrl:"https://www.youtube.com/results?search_query=sock+planter+DIY", tutorialLabel:"Watch YouTube" },
  { id:"17", title:"Patchwork blanket from old clothes", category:"Recycle", difficulty:"Hard", time:"180 min",
    description:"Cut equal squares from t-shirts, shirts, thin jeans; sew into a sofa blanket or picnic mat.",
    materials_needed:["Scissors","Sewing machine","Backing fabric"], clothingType:["T-shirt","Shirt","Jeans"], tags:["blanket","patchwork"], likes:223,
    searchQuery:"patchwork quilt old clothes blanket",
    tutorialUrl:"https://www.youtube.com/results?search_query=memory+quilt+old+tshirts", tutorialLabel:"Watch YouTube" },
  { id:"18", title:"Fabric bookmark from collar/hem", category:"Upcycle", difficulty:"Very Easy", time:"8 min",
    description:"Cut stiff fabric strip from shirt collar or pants hem, glue or sew edges, add a string hole.",
    materials_needed:["Scissors","Fabric glue"], clothingType:["Shirt","Jeans"], tags:["book","small"], likes:156,
    searchQuery:"fabric bookmark handmade reading",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=fabric+bookmark+diy", tutorialLabel:"See Pinterest" },
  { id:"20", title:"Gardening gloves from thick wool socks", category:"Upcycle", difficulty:"Easy", time:"12 min",
    description:"Cut toe section for short gloves, or use whole long sock to protect arms while gardening.",
    materials_needed:["Scissors"], clothingType:["Socks"], tags:["garden","soil"], likes:134,
    searchQuery:"garden gloves DIY socks",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+garden+gloves+socks", tutorialLabel:"Watch YouTube" },
  { id:"21", title:"Laptop/book sleeve from hoodie", category:"Upcycle", difficulty:"Medium", time:"55 min",
    description:"Sew hoodie body into a zippered pouch with thin padding. Use front kangaroo pocket.",
    materials_needed:["Scissors","Sewing machine","Zipper","Padding"], clothingType:["Hoodie"], tags:["bag","tech"], likes:301,
    searchQuery:"hoodie laptop sleeve DIY sewing",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+laptop+sleeve+hoodie", tutorialLabel:"Watch YouTube" },
  { id:"22", title:"Friendship bracelet from fabric", category:"Upcycle", difficulty:"Very Easy", time:"12 min",
    description:"Braid or twist colorful t-shirt fabric strips, tie around wrist. Handmade gift.",
    materials_needed:["Scissors"], clothingType:["T-shirt"], tags:["jewelry","wrist"], likes:421,
    searchQuery:"fabric bracelet braided handmade",
    tutorialUrl:"https://www.youtube.com/results?search_query=fabric+scrap+bracelet+diy", tutorialLabel:"Watch YouTube" },
  { id:"23", title:"Reusable wipes from flannel/soft shirt", category:"Recycle", difficulty:"Easy", time:"20 min",
    description:"Cut flannel or baby shirt into squares, finish edges. Use with baby wipes solution or makeup remover.",
    materials_needed:["Scissors","Sewing machine"], clothingType:["Shirt","Sweater"], tags:["baby","skincare"], likes:198,
    searchQuery:"reusable wipes cloth baby DIY",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=reusable+fabric+wipes+diy", tutorialLabel:"See Pinterest" },
  { id:"24", title:"Bow / hair clip from old tie", category:"Upcycle", difficulty:"Easy", time:"18 min",
    description:"Unstitch tie, fold into bow tie shape or attach to a hair clip with alligator clip.",
    materials_needed:["Scissors","Needle & thread","Hair clip"], clothingType:["Tie","Shirt"], tags:["hair","office"], likes:167,
    searchQuery:"bow tie hair clip DIY necktie",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+bow+from+necktie", tutorialLabel:"Watch YouTube" },
  { id:"25", title:"Coaster from sweater sleeve", category:"Recycle", difficulty:"Very Easy", time:"10 min",
    description:"Cut sweater sleeve into circles, sew edges closed — protects tables from scratches.",
    materials_needed:["Scissors","Needle & thread"], clothingType:["Sweater"], tags:["table","decor"], likes:244,
    searchQuery:"cozy mug sweater sleeve DIY",
    tutorialUrl:"https://www.pinterest.com/search/pins/?q=sweater+mug+cozy", tutorialLabel:"See Pinterest" },
  { id:"26", title:"Makeup pouch from jacket sleeve", category:"Upcycle", difficulty:"Medium", time:"40 min",
    description:"Cut two jacket sleeves, sew bottom and sides into a small case; use cuff as handle.",
    materials_needed:["Scissors","Sewing machine","Small zipper"], clothingType:["Jacket","Hoodie"], tags:["travel","beauty"], likes:212,
    searchQuery:"cosmetic pouch DIY sleeve sewing",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+makeup+bag+from+sleeve", tutorialLabel:"Watch YouTube" },
  { id:"28", title:"Infinity scarf from scarf / thin top", category:"Upcycle", difficulty:"Easy", time:"20 min",
    description:"Cut a long strip from an old square scarf or chiffon dress, fringe edges — lightweight infinity scarf.",
    materials_needed:["Scissors"], clothingType:["Scarf","Dress"], tags:["winter","layer"], likes:276,
    searchQuery:"infinity scarf DIY lightweight fabric",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+infinity+scarf+from+shirt", tutorialLabel:"Watch YouTube" },
  { id:"29", title:"Office chair cushion from hoodie", category:"Recycle", difficulty:"Medium", time:"50 min",
    description:"Stuff foam or fabric scraps into hoodie body, sew closed — comfy cushion for gaming chair or car.",
    materials_needed:["Scissors","Sewing machine","Foam scraps"], clothingType:["Hoodie"], tags:["office","ergonomic"], likes:188,
    searchQuery:"seat cushion DIY hoodie upcycle",
    tutorialUrl:"https://www.youtube.com/results?search_query=diy+seat+cushion+old+sweatshirt", tutorialLabel:"Watch YouTube" },
  { id:"30", title:"Cable / headphone tie from t-shirt strip", category:"Upcycle", difficulty:"Very Easy", time:"6 min",
    description:"Cut a stretchy vertical strip from t-shirt, stretch to curl — tidy up charger cables in backpack.",
    materials_needed:["Scissors"], clothingType:["T-shirt"], tags:["tech","organize"], likes:331,
    searchQuery:"cable organizer fabric tie DIY",
    tutorialUrl:"https://www.youtube.com/results?search_query=t+shirt+yarn+cord+diy", tutorialLabel:"Watch YouTube" },
];

const CAT_COLORS: Record<string, string> = {
  "Tái chế": "bg-green-100 text-green-700 border-green-200",
  "Upcycle": "bg-violet-100 text-violet-700 border-violet-200",
  "Recycle": "bg-green-100 text-green-700 border-green-200",
};
const DIFF_COLORS: Record<string, string> = {
  "Rất dễ": "text-green-600", "Dễ": "text-blue-600",
  "Trung bình": "text-yellow-600", "Khó": "text-red-500",
  "Very Easy": "text-green-600", "Easy": "text-blue-600",
  "Medium": "text-yellow-600", "Hard": "text-red-500",
};

function IdeaCard({
  idea,
  expanded,
  onToggle,
  isLocalIdea,
  isCommunityIdea,
  onDelete,
  t,
}: {
  idea: Idea;
  expanded: boolean;
  onToggle: () => void;
  isLocalIdea?: boolean;
  isCommunityIdea?: boolean;
  onDelete?: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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
                    {t("recycle.community_label")}
                  </p>
                )}
                {isLocalIdea && (
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700/90">
                    {t("recycle.local_label")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-start gap-1">
                {isLocalIdea && onDelete && (
                  <button
                    type="button"
                    title={t("recycle.delete_tooltip")}
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
              <p className="text-xs font-semibold text-zinc-600 mb-2">{t("recycle.materials_label")}</p>
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
              <ExternalLink size={14} />{idea.tutorialLabel || t("recycle.tutorial_default_label")}
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
  const { t, lang } = useI18n();
  const IDEAS = lang === "en" ? IDEAS_EN : IDEAS_VI;

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterDiff, setFilterDiff] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [imageBase64, setImageBase64] = useState("");
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [imagePreview, setImagePreview] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [mindmapImage, setMindmapImage] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [clothingInfo, setClothingInfo] = useState("");
  const [aiIdeas, setAiIdeas] = useState<
    { title: string; category: string; difficulty: string; time: string; description: string }[]
  >([]);

  const [customIdeas, setCustomIdeas] = useState<Idea[]>([]);
  const [communityIdeas, setCommunityIdeas] = useState<Idea[]>([]);
  const [communityApiReady, setCommunityApiReady] = useState<boolean | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<"Tái chế" | "Upcycle" | "Recycle" | "Upcycle">("Upcycle");
  const [formDifficulty, setFormDifficulty] = useState("Easy");
  const [formTime, setFormTime] = useState("30 min");
  const [formMaterials, setFormMaterials] = useState("");
  const [formClothingTypes, setFormClothingTypes] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formSearchQuery, setFormSearchQuery] = useState("");
  const [formTutorialUrl, setFormTutorialUrl] = useState("");
  const [formTutorialLabel, setFormTutorialLabel] = useState("Tutorial link");

  // Derive category/difficulty values and labels based on language
  const CATEGORIES = useMemo(() => {
    const cats = ["all", "recycle", "upcycle"];
    return cats.map((v) => ({
      value: v,
      label: v === "all" ? t("recycle.category_all") : t(`recycle.category_${v}`),
    }));
  }, [lang, t]);

  const DIFFICULTIES = useMemo(() => {
    const diffs = ["all", "easy", "medium", "hard", "expert"];
    return diffs.map((v) => ({
      value: v,
      label: v === "all" ? t("recycle.difficulty_all") : t(`recycle.difficulty_${v}`),
    }));
  }, [lang, t]);

  // Mapping from category/difficulty value to the localized string used in Idea data
  const catValueToLocalized = useMemo(() => {
    if (lang === "en") {
      return { all: "", recycle: "Recycle", upcycle: "Upcycle" } as Record<string, string>;
    }
    return { all: "", recycle: "Tái chế", upcycle: "Upcycle" } as Record<string, string>;
  }, [lang]);

  const diffValueToLocalized = useMemo(() => {
    if (lang === "en") {
      return { all: "", easy: "Very Easy", medium: "Easy", hard: "Medium", expert: "Hard" } as Record<string, string>;
    }
    return { all: "", easy: "Rất dễ", medium: "Dễ", hard: "Trung bình", expert: "Khó" } as Record<string, string>;
  }, [lang]);

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
    setFormDifficulty("Easy");
    setFormTime("30 min");
    setFormMaterials("");
    setFormClothingTypes("");
    setFormTags("");
    setFormSearchQuery("");
    setFormTutorialUrl("");
    setFormTutorialLabel("Tutorial link");
  }, []);

  const handleDeleteCustom = useCallback((id: string) => {
    if (!confirm(t("recycle.delete_confirm"))) return;
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
  }, [t]);

  const handleSaveLocalOnly = useCallback(() => {
    setFormError("");
    const title = formTitle.trim();
    const description = formDescription.trim();
    if (!title) {
      setFormError(t("recycle.form_error_title"));
      return;
    }
    if (!description) {
      setFormError(t("recycle.form_error_desc"));
      return;
    }
    const materials = splitToList(formMaterials);
    const clothingType = splitToList(formClothingTypes);
    const tags = splitToList(formTags);
    const searchQuery =
      formSearchQuery.trim() || `${title} DIY handmade upcycle`;
    const url = formTutorialUrl.trim();
    const catLocalized = catValueToLocalized[formCategory] || formCategory;
    const diffLocalized = diffValueToLocalized[formDifficulty] || formDifficulty;
    const newIdea: Idea = {
      id: `custom-${crypto.randomUUID()}`,
      title,
      description,
      category: catLocalized,
      difficulty: diffLocalized,
      time: formTime.trim() || "30 min",
      materials_needed: materials,
      clothingType: clothingType.length ? clothingType : lang === "en" ? ["Old clothes"] : ["Quần áo cũ"],
      tags: tags.length ? tags : ["my idea"],
      likes: 0,
      searchQuery,
      createdAt: Date.now(),
      ...(url
        ? {
            tutorialUrl: url,
            tutorialLabel: formTutorialLabel.trim() || "Tutorial link",
          }
        : {}),
    };
    const next = [newIdea, ...customIdeas];
    try {
      saveCustomIdeasToStorage(next);
    } catch {
      setFormError(t("recycle.form_error_storage"));
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
    lang,
    catValueToLocalized,
    diffValueToLocalized,
    t,
  ]);

  const handlePublishCommunity = useCallback(async () => {
    setFormError("");
    const title = formTitle.trim();
    const description = formDescription.trim();
    if (!title) {
      setFormError(t("recycle.form_error_title"));
      return;
    }
    if (!description) {
      setFormError(t("recycle.form_error_desc"));
      return;
    }
    const materials = splitToList(formMaterials);
    const clothingType = splitToList(formClothingTypes);
    const tags = splitToList(formTags);
    const searchQuery =
      formSearchQuery.trim() || `${title} DIY handmade upcycle`;
    const url = formTutorialUrl.trim();
    const catLocalized = catValueToLocalized[formCategory] || formCategory;
    const diffLocalized = diffValueToLocalized[formDifficulty] || formDifficulty;
    setIsPublishing(true);
    try {
      const res = await fetch("/api/recycle-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category: catLocalized,
          difficulty: diffLocalized,
          time: formTime.trim() || "30 min",
          materials_needed: materials,
          clothingType: clothingType.length ? clothingType : lang === "en" ? ["Old clothes"] : ["Quần áo cũ"],
          tags: tags.length ? tags : ["community"],
          searchQuery,
          tutorialUrl: url || undefined,
          tutorialLabel: url ? formTutorialLabel.trim() || "Tutorial link" : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(typeof data.error === "string" ? data.error : t("recycle.form_error_publish"));
        return;
      }
      const idea = data.idea as Idea;
      setCommunityIdeas((prev) => [idea, ...prev.filter((x) => x.id !== idea.id)]);
      setCommunityApiReady(true);
      setShowAddModal(false);
      resetAddForm();
      setExpandedId(idea.id);
    } catch {
      setFormError(t("recycle.form_error_network"));
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
    lang,
    catValueToLocalized,
    diffValueToLocalized,
    t,
  ]);

  const filtered = useMemo(() => {
    const combined = [...IDEAS, ...communityIdeas, ...customIdeas];
    const q = search.toLowerCase();
    const catFilter = catValueToLocalized[filterCat];
    const diffFilter = diffValueToLocalized[filterDiff];
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
        (filterCat === "all" || idea.category === catFilter) &&
        (filterDiff === "all" || idea.difficulty === diffFilter)
      );
    });
    return list.sort((a, b) => {
      const ka = isLocalCustomId(a.id) ? 2 : isCommunityId(a.id) ? 1 : 0;
      const kb = isLocalCustomId(b.id) ? 2 : isCommunityId(b.id) ? 1 : 0;
      if (ka !== kb) return ka - kb;
      if (ka === 0) return b.likes - a.likes;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });
  }, [search, filterCat, filterDiff, customIdeas, communityIdeas, IDEAS, catValueToLocalized, diffValueToLocalized]);

  const totalCount = IDEAS.length + customIdeas.length + communityIdeas.length;

  const handleScan = async () => {
    if (!imageBase64) return;
    setIsScanning(true);
    setScanError("");
    setAiIdeas([]);
    setMindmapImage("");
    setAiDescription("");
    setClothingInfo("");
    try {
      const res = await fetch("/api/scan-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: imageMime, lang }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      const d = result.data;

      if (d.mindmapImage) {
        setMindmapImage(`data:image/png;base64,${d.mindmapImage}`);
      }
      if (d.description) setAiDescription(d.description);

      const parts = [
        d.clothingType || (lang === "en" ? "Clothing" : "Quần áo"),
        d.material,
        d.condition,
        d.colorTone ? `${lang === "en" ? "Color" : "Màu"}: ${d.colorTone}` : "",
        d.pattern ? `${lang === "en" ? "Pattern" : "Hoa văn"}: ${d.pattern}` : "",
      ].filter(Boolean);
      setClothingInfo(parts.join(" · "));

      setAiIdeas(d.ideas || []);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : (lang === "en" ? "Scan error" : "Lỗi scan"));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="flex flex-col gap-4 lg:col-span-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 text-lg">{t("recycle.ideas.hub.title")}</h3>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
              {t("recycle.ideas.hub.desc", { builtin: IDEAS.length })}
              {communityApiReady === null && ` · ${t("recycle.ideas.loading")}`}
              {communityApiReady === false &&
                ` · ${t("recycle.ideas.not_configured")}`}
              {communityApiReady === true &&
                ` · ${t("recycle.ideas.community", { count: communityIdeas.length })}`}
              {customIdeas.length > 0
                ? ` · ${t("recycle.ideas.local", { count: customIdeas.length })}`
                : ""}
              {" "}— {t("recycle.ideas.image_hint", { total: totalCount })}.
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
            {t("recycle.add_idea")}
          </button>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("recycle.search")}
            className="w-full rounded-xl border border-zinc-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 transition w-fit">
            <Filter size={13} />{t("recycle.filter_title")}
            {showFilter ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {showFilter && (
            <div className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button key={c.value} onClick={() => setFilterCat(c.value)}
                    className={cn("rounded-full px-3 py-1 text-xs font-medium transition",
                      filterCat === c.value ? "bg-green-600 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-green-400")}>{c.label}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button key={d.value} onClick={() => setFilterDiff(d.value)}
                    className={cn("rounded-full px-3 py-1 text-xs font-medium transition",
                      filterDiff === d.value ? "bg-green-600 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-green-400")}>{d.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-400">{t("recycle.ideas_count", { count: filtered.length })}</p>
        <div className="flex flex-col gap-3">
          {filtered.length === 0
            ? <div className="text-center py-10 text-zinc-400 text-sm">{t("recycle.no_results")}</div>
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
                t={t}
              />
            ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-2">
        <div>
          <h3 className="font-bold text-zinc-900 text-lg">{t("recycle.ai_assist_title")}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t("recycle.ai_assist_desc")}
          </p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={15} className="text-green-600" />
            <p className="text-sm font-semibold text-zinc-700">{t("recycle.scan_label")}</p>
          </div>
          <ImageUploader label="" hint={t("recycle.scan_hint")}
            previewUrl={imagePreview}
            onImageChange={(b64, mime, preview) => { setImageBase64(b64); setImageMime(mime); setImagePreview(preview); }} />
          <button onClick={handleScan} disabled={!imageBase64 || isScanning}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
            {isScanning ? (
              <>
                <Loader2 size={15} className="animate-spin" /> {t("recycle.scanning_status")}
              </>
            ) : (
              <>
                <Sparkles size={15} /> {t("recycle.scan_button")}
              </>
            )}
          </button>
        </div>
        {scanError && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{t("recycle.scan_error_prefix")}{scanError}</div>}
        {isScanning && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-green-600" />
            <p className="text-sm font-semibold text-green-800 text-center">{t("recycle.scanning_status")}</p>
            <p className="text-xs text-green-600 text-center">{lang === "en" ? "Analyzing colors & patterns, then GPT Image generates mindmap" : "Phân tích màu & hoa văn, sau đó GPT Image vẽ ảnh"}</p>
          </div>
        )}

        {mindmapImage && !isScanning && (
          <div className="rounded-2xl border border-green-200 bg-white overflow-hidden">
            <div className="p-3 border-b border-green-100 bg-green-50">
              <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                <Leaf size={14} /> {t("recycle.mindmap_label")}
              </p>
              {clothingInfo && (
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{clothingInfo}</p>
              )}
            </div>
            <div className="relative aspect-square w-full">
              <img src={mindmapImage} alt="Mindmap tái chế" className="w-full h-full object-contain" />
            </div>
            {aiDescription && (
              <div className="p-4 border-t border-green-100">
                <p className="text-xs font-semibold text-zinc-600 mb-2">{t("recycle.ai_ideas_detail")}</p>
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{aiDescription}</p>
              </div>
            )}
            {aiIdeas.length > 0 && (
              <div className="p-4 border-t border-zinc-100 flex flex-col gap-2">
                {aiIdeas.map((idea, i) => (
                  <div key={i} className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-zinc-800">{i + 1}. {idea.title}</p>
                      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium", CAT_COLORS[idea.category] || "bg-zinc-100 text-zinc-600")}>
                        {idea.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">{idea.description}</p>
                    <p className="text-[11px] text-zinc-400 mt-1">{idea.difficulty} {t("recycle.ai_idea_separator")} {idea.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isScanning && !mindmapImage && !scanError && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 py-10">
            <div className="rounded-full bg-green-50 p-4"><Recycle size={24} className="text-green-300" /></div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-500">{t("recycle.not_scanned")}</p>
              <p className="text-xs text-zinc-400 mt-1">{t("recycle.not_scanned_hint")}</p>
            </div>
          </div>
        )}
      </div>
    </div>

    {showAddModal && (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-10 sm:pt-16">
        <button
          type="button"
          aria-label={lang === "en" ? "Close" : "Đóng"}
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
          <h4 className="text-base font-bold text-zinc-900">{t("recycle.modal_title")}</h4>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: t("recycle.modal_desc")
                .replace(/\{bold_publish\}(.*?)\{\/bold\}/g, '<strong class="text-zinc-700">$1</strong>')
                .replace(/\{bold_save\}(.*?)\{\/bold\}/g, '<strong class="text-zinc-700">$1</strong>')
            }}
          />
          {communityApiReady === false && (
            <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
              {t("recycle.modal_not_configured")}
            </p>
          )}
          <div className="mt-4 flex max-h-[min(70vh,540px)] flex-col gap-3 overflow-y-auto pr-1">
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_title_label")}</span>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder={t("recycle.form_title_placeholder")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_desc_label")}</span>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder={t("recycle.form_desc_placeholder")}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_category_label")}</span>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as "Tái chế" | "Upcycle" | "Recycle" | "Upcycle")}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                >
                  {CATEGORIES.filter(c => c.value !== "all").map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_difficulty_label")}</span>
                <select
                  value={formDifficulty}
                  onChange={(e) => setFormDifficulty(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                >
                  {DIFFICULTIES.filter((d) => d.value !== "all").map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_time_label")}</span>
              <input
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder={t("recycle.form_time_placeholder")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_materials_label")}</span>
              <textarea
                value={formMaterials}
                onChange={(e) => setFormMaterials(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder={t("recycle.form_materials_placeholder")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_clothing_label")}</span>
              <input
                value={formClothingTypes}
                onChange={(e) => setFormClothingTypes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder={t("recycle.form_clothing_placeholder")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_tags_label")}</span>
              <input
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder={t("recycle.form_tags_placeholder")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_search_label")}</span>
              <input
                value={formSearchQuery}
                onChange={(e) => setFormSearchQuery(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder={t("recycle.form_search_placeholder")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_url_label")}</span>
              <input
                value={formTutorialUrl}
                onChange={(e) => setFormTutorialUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder={t("recycle.form_url_placeholder")}
              />
            </label>
            {formTutorialUrl.trim() && (
              <label className="block">
                <span className="text-xs font-semibold text-zinc-600">{t("recycle.form_url_button_label")}</span>
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
              {t("recycle.form_cancel")}
            </button>
            <button
              type="button"
              onClick={handleSaveLocalOnly}
              disabled={isPublishing}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
            >
              {t("recycle.form_save_local")}
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
                  {t("recycle.form_publishing")}
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {t("recycle.form_publish")}
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