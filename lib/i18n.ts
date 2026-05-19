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
    "studio.result.wait": "⏱️ Khoảng 15–30 giây",
    "studio.result.empty": "Chưa có kết quả",
    "studio.result.hint": "Upload ảnh người + quần áo bên trái",
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
    "closet.title": "👗 Tủ đồ của bạn",
    "closet.count": "món đồ",
    "closet.empty": "Tủ đồ trống",
    "closet.empty.hint": "Upload ảnh quần áo và nhấn \"Lưu vào tủ đồ\" để bắt đầu",
    "closet.add": "Thêm đồ",
    "closet.clear": "Xóa tất cả",
    "closet.confirm": "Xóa tất cả đồ trong tủ?",

    // TryOn tab
    "tryon.person.label": "📸 Ảnh của bạn (tuỳ chọn)",
    "tryon.person.hint": "Nếu có ảnh, AI tư vấn vừa vặn & dáng người tốt hơn",
    "tryon.height": "Chiều cao",
    "tryon.weight": "Cân nặng",
    "tryon.gender": "Giới tính",
    "tryon.gender.male": "Nam",
    "tryon.gender.female": "Nữ",
    "tryon.cloth.label": "👕 Ảnh quần áo",
    "tryon.cloth.hint": "Upload nhiều món cùng lúc — chọn ảnh để thử và lưu vào tủ đồ",
    "tryon.cloth.select": "Chọn món quần áo để AI nhận diện và thử",
    "tryon.cloth.select.hint": "AI chỉ xử lý ảnh có viền tím",
    "tryon.request": "Yêu cầu AI",
    "tryon.request.placeholder": "Nhập yêu cầu phong cách, dịp, màu sắc...",
    "tryon.generate": "✨ Tạo ảnh đồ bằng AI",
    "tryon.button": "✨ Phối đồ thông minh",
    "tryon.button.loading": "AI đang xử lý...",
    "tryon.save": "Lưu vào tủ đồ",
    "tryon.saving": "Đang phân tích...",
    "tryon.save.multi": "Lưu {count} món vào tủ đồ",
    "tryon.result": "🎨 Kết quả",
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
    "studio.result.wait": "⏱️ About 15–30 seconds",
    "studio.result.empty": "No result yet",
    "studio.result.hint": "Upload person + clothing images on the left",
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
    "closet.title": "👗 Your Closet",
    "closet.count": "items",
    "closet.empty": "Your closet is empty",
    "closet.empty.hint": "Upload clothing images and tap \"Save to closet\" to start",
    "closet.add": "Add items",
    "closet.clear": "Clear all",
    "closet.confirm": "Delete all items from closet?",

    // TryOn tab
    "tryon.person.label": "📸 Your Photo (optional)",
    "tryon.person.hint": "With a photo, AI gives better fit & body advice",
    "tryon.height": "Height",
    "tryon.weight": "Weight",
    "tryon.gender": "Gender",
    "tryon.gender.male": "Male",
    "tryon.gender.female": "Female",
    "tryon.cloth.label": "👕 Clothing Images",
    "tryon.cloth.hint": "Upload multiple items — select one to try on",
    "tryon.cloth.select": "Select clothing for AI to analyze and try on",
    "tryon.cloth.select.hint": "AI only processes the purple-bordered image",
    "tryon.request": "AI Request",
    "tryon.request.placeholder": "Enter style, occasion, color preferences...",
    "tryon.generate": "✨ Generate AI clothing image",
    "tryon.button": "✨ AI Smart Mix",
    "tryon.button.loading": "AI is processing...",
    "tryon.save": "Save to closet",
    "tryon.saving": "Analyzing...",
    "tryon.save.multi": "Save {count} items to closet",
    "tryon.result": "🎨 Result",
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