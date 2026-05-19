"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "vi" | "en";

// ─── TRANSLATIONS ──────────────────────────────────────────────

const translations: Record<Lang, Record<string, string>> = {
  vi: {
    // Header
    "app.title": "FitAI",
    "app.subtitle": "Virtual Try-On",

    // Tabs
    "tab.studio": "Studio",
    "tab.tryon": "Phối đồ",
    "tab.closet": "Tủ đồ",
    "tab.recycle": "Tái chế",

    // Studio / Try-On
    "studio.title": "Thử đồ AI",
    "studio.free": "100% FREE",
    "studio.history": "Lịch sử",
    "studio.history.empty": "Chưa có lịch sử. Thử đồ ngay để lưu lại!",
    "studio.history.clear": "Xóa tất cả",
    "studio.person.label": "📸 Ảnh người (full body)",
    "studio.person.upload": "Upload ảnh",
    "studio.person.camera": "Chụp ảnh",
    "studio.cloth.label": "👕 Ảnh quần áo (chọn nhiều)",
    "studio.cloth.add": "Thêm ảnh",
    "studio.cloth.camera": "Chụp ảnh",
    "studio.cloth.selected": "Đã chọn",
    "studio.cloth.hint": "ảnh — chọn ảnh có viền tím để thử",
    "studio.button.tryon": "Thử đồ ngay ✨",
    "studio.button.loading": "AI đang thử đồ...",
    "studio.result.title": "Kết quả",
    "studio.result.loading": "AI đang thử đồ cho bạn...",
    "studio.result.wait": "⏱️ Khoảng 30–60 giây (AI ghép quần áo lên người)",
    "studio.result.empty": "Chưa có kết quả",
    "studio.result.hint": "Upload ảnh người + quần áo → kết quả hiện bên phải",
    "studio.result.before": "Trước",
    "studio.result.after": "Sau",
    "studio.result.free": "✅ Miễn phí",
    "studio.zoom": "Phóng to",
    "studio.download": "Tải về",
    "studio.reset": "Làm lại",
    "studio.error.upload": "Vui lòng upload cả ảnh người và ảnh quần áo",
    "studio.error.empty": "Vui lòng upload cả ảnh người và ảnh quần áo",

    // Camera
    "camera.cancel": "Hủy",
    "camera.capture": "📷 Chụp",
    "camera.ready": "Nhấn Chụp để lấy ảnh",
    "camera.loading": "Đang khởi động camera...",
    "camera.error": "Không thể truy cập camera.",
    "camera.permission": "Bạn chưa cấp quyền camera. Vui lòng cho phép camera.",

    // Closet
    "closet.title": "Tủ đồ của bạn",
    "closet.subtitle": "Quản lý và phối đồ từ bộ sưu tập cá nhân",
    "closet.count": "món đồ",
    "closet.empty": "Tủ đồ trống",
    "closet.empty.hint": "Thêm quần áo từ tab Phối đồ để lưu vào tủ",
    "closet.add": "Thêm đồ",
    "closet.clear": "Xóa tất cả",
    "closet.confirm": "Xóa tất cả đồ trong tủ?",
    "closet.tryon": "Phối đồ",
    "closet.delete": "Xóa",
    "closet.dusty": "Lâu chưa mặc",
    "closet.tried": "Đã phối {count} lần",

    // TryOn tab
    "tryon.page.title": "Phối đồ thông minh",
    "tryon.page.subtitle": "AI stylist gợi ý cách mặc — lưu món yêu thích vào tủ đồ",
    "tryon.person.label": "Ảnh của bạn",
    "tryon.person.hint": "Tuỳ chọn — giúp AI tư vấn vừa vặn & dáng người chính xác hơn",
    "tryon.height": "Chiều cao",
    "tryon.weight": "Cân nặng",
    "tryon.gender": "Giới tính",
    "tryon.gender.male": "Nam",
    "tryon.gender.female": "Nữ",
    "tryon.cloth.label": "Ảnh quần áo",
    "tryon.cloth.hint": "Upload nhiều món — chọn ảnh viền tím để phối hoặc lưu tủ",
    "tryon.cloth.select": "Chọn món để phối",
    "tryon.cloth.select.hint": "Ảnh đang chọn có viền",
    "tryon.request": "Yêu cầu thêm",
    "tryon.request.placeholder": "Ví dụ: đi làm, date, tone màu be–nâu, thoải mái...",
    "tryon.button": "Nhận tư vấn phối đồ",
    "tryon.button.loading": "AI đang phân tích...",
    "tryon.save": "Lưu vào tủ đồ",
    "tryon.saving": "Đang phân tích...",
    "tryon.save.multi": "Lưu {count} món vào tủ đồ",
    "tryon.result": "Tư vấn phối đồ",
    "tryon.result.subtitle": "Gợi ý từ AI stylist",
    "tryon.result.empty": "Chưa có tư vấn",
    "tryon.result.empty.hint": "Chọn quần áo và nhấn \"Nhận tư vấn phối đồ\"",
    "tryon.result.loading.hint": "Đang phân tích ảnh và sở thích của bạn...",
    "tryon.error": "Cần ảnh quần áo!",

    // Recycle
    "recycle.title": "♻️ Tái Chế & Upcycle",
    "recycle.subtitle": "Browse ý tưởng tái chế hoặc chụp sản phẩm để AI gợi ý riêng cho bạn",
    "recycle.ideas": "Kho ý tưởng tái chế",
    "recycle.ai": "AI Hỗ trợ thiết kế",
    "recycle.ai.hint": "Chụp sản phẩm → AI gợi ý ý tưởng tái chế cá nhân hóa",
    "recycle.scan": "Tìm ý tưởng tái chế",
    "recycle.scanning": "AI đang phân tích...",
    "recycle.mindmap": "Mindmap tái chế — ảnh gốc ở giữa, ý tưởng xung quanh",
    "recycle.ideas.count": "ý tưởng AI gợi ý",
    "recycle.empty": "Chưa có gợi ý AI",
    "recycle.empty.hint": "Chụp sản phẩm để AI tạo ý tưởng riêng cho bạn",
    "recycle.search": "Tìm ý tưởng, loại đồ, tag...",
    "recycle.filter": "Lọc theo danh mục & độ khó",
    "recycle.add": "Thêm & đăng ý tưởng",
    "recycle.add.title": "Đăng ý tưởng tái chế",
    "recycle.save.local": "Chỉ lưu trên máy tôi",
    "recycle.publish": "Đăng cho mọi người",

    // Language
    "lang.vi": "Tiếng Việt",
    "lang.en": "English",
  },

  en: {
    // Header
    "app.title": "FitAI",
    "app.subtitle": "Virtual Try-On",

    // Tabs
    "tab.studio": "Studio",
    "tab.tryon": "Smart Mix",
    "tab.closet": "Closet",
    "tab.recycle": "Recycle",

    // Studio / Try-On
    "studio.title": "AI Try-On",
    "studio.free": "100% FREE",
    "studio.history": "History",
    "studio.history.empty": "No history yet. Try now to save!",
    "studio.history.clear": "Clear all",
    "studio.person.label": "📸 Person Image (full body)",
    "studio.person.upload": "Upload photo",
    "studio.person.camera": "Take photo",
    "studio.cloth.label": "👕 Clothing Images (multi)",
    "studio.cloth.add": "Add image",
    "studio.cloth.camera": "Take photo",
    "studio.cloth.selected": "Selected",
    "studio.cloth.hint": "images — click the purple border one to try",
    "studio.button.tryon": "Try On Now ✨",
    "studio.button.loading": "AI is processing...",
    "studio.result.title": "Result",
    "studio.result.loading": "AI is trying on clothes for you...",
    "studio.result.wait": "⏱️ About 30–60 seconds (AI fits clothing on person)",
    "studio.result.empty": "No result yet",
    "studio.result.hint": "Upload person + clothing → result appears on the right",
    "studio.result.before": "Before",
    "studio.result.after": "After",
    "studio.result.free": "✅ Free",
    "studio.zoom": "Zoom",
    "studio.download": "Download",
    "studio.reset": "Reset",
    "studio.error.upload": "Please upload both person and clothing images",

    // Camera
    "camera.cancel": "Cancel",
    "camera.capture": "📷 Capture",
    "camera.ready": "Press Capture to take photo",
    "camera.loading": "Starting camera...",
    "camera.error": "Cannot access camera.",
    "camera.permission": "Camera permission denied. Please allow camera access.",

    // Closet
    "closet.title": "Your Closet",
    "closet.subtitle": "Manage items and get styling advice from your collection",
    "closet.count": "items",
    "closet.empty": "Your closet is empty",
    "closet.empty.hint": "Add clothing from the Smart Mix tab to save here",
    "closet.add": "Add items",
    "closet.clear": "Clear all",
    "closet.confirm": "Delete all items from closet?",
    "closet.tryon": "Style",
    "closet.delete": "Delete",
    "closet.dusty": "Unworn",
    "closet.tried": "Styled {count} times",

    // TryOn tab
    "tryon.page.title": "Smart Outfit Mix",
    "tryon.page.subtitle": "AI stylist suggestions — save favorites to your closet",
    "tryon.person.label": "Your photo",
    "tryon.person.hint": "Optional — helps AI give better fit and body advice",
    "tryon.height": "Height",
    "tryon.weight": "Weight",
    "tryon.gender": "Gender",
    "tryon.gender.male": "Male",
    "tryon.gender.female": "Female",
    "tryon.cloth.label": "Clothing images",
    "tryon.cloth.hint": "Upload multiple — purple border = selected for styling or closet",
    "tryon.cloth.select": "Select item to style",
    "tryon.cloth.select.hint": "Selected image has purple border",
    "tryon.request": "Extra notes",
    "tryon.request.placeholder": "e.g. office, date night, beige tones, comfortable...",
    "tryon.button": "Get styling advice",
    "tryon.button.loading": "AI is analyzing...",
    "tryon.save": "Save to closet",
    "tryon.saving": "Analyzing...",
    "tryon.save.multi": "Save {count} items to closet",
    "tryon.result": "Styling advice",
    "tryon.result.subtitle": "From your AI stylist",
    "tryon.result.empty": "No advice yet",
    "tryon.result.empty.hint": "Select clothing and tap \"Get styling advice\"",
    "tryon.result.loading.hint": "Analyzing images and your preferences...",
    "tryon.error": "Need clothing image!",

    // Recycle
    "recycle.title": "♻️ Recycle & Upcycle",
    "recycle.subtitle": "Browse recycling ideas or scan a product for AI personalized suggestions",
    "recycle.ideas": "Recycling Ideas Hub",
    "recycle.ai": "AI Design Assistant",
    "recycle.ai.hint": "Scan product → AI suggests personalized recycling ideas",
    "recycle.scan": "Find recycling ideas",
    "recycle.scanning": "AI is analyzing...",
    "recycle.mindmap": "Recycling mindmap — original image center, ideas around",
    "recycle.ideas.count": "AI suggested ideas",
    "recycle.empty": "No AI suggestions yet",
    "recycle.empty.hint": "Scan a product for AI to create personalized ideas",
    "recycle.search": "Search ideas, clothing types, tags...",
    "recycle.filter": "Filter by category & difficulty",
    "recycle.add": "Add & publish idea",
    "recycle.add.title": "Publish recycling idea",
    "recycle.save.local": "Save locally only",
    "recycle.publish": "Publish to community",

    // Language
    "lang.vi": "Tiếng Việt",
    "lang.en": "English",
  },
};

// ─── CONTEXT ──────────────────────────────────────────────────

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextType>({
  lang: "vi",
  setLang: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("vi");

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = translations[lang][key] || translations["vi"][key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [lang]
  );

  return React.createElement(
    I18nContext.Provider,
    { value: { lang, setLang, t } },
    children
  );
}

export function useI18n() {
  return useContext(I18nContext);
}