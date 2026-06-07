"use client";

import { useState, useCallback, useEffect } from "react";
import { Wand2, Plus, Shirt, Sparkles, Recycle, Palette, Trash2, Globe } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import MultiImageUploader, { UploadedImage } from "@/components/MultiImageUploader";
import BodyForm from "@/components/BodyForm";
import ClothingCard from "@/components/ClothingCard";
import TryOnResult from "@/components/TryOnResult";
import RecycleHub from "@/components/RecycleHub";
import DreaminaStudio from "@/components/DreaminaStudio";
import OutfitSuggestion from "@/components/OutfitSuggestion";
import AIStyleProfile from "@/components/AIStyleProfile";
import { ClothingItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n, type Lang } from "@/lib/i18n";

type Tab = "tryon" | "closet" | "studio" | "recycle";

const TAB_ICONS: Record<Tab, any> = { studio: Palette, tryon: Wand2, closet: Shirt, recycle: Recycle };

const TAB_COLORS: Record<Tab, { active: string; bg: string; icon: string; dot: string }> = {
  studio:  { active: "text-violet-600", bg: "bg-violet-50 border-violet-200 shadow-violet-100",   icon: "text-violet-500", dot: "bg-violet-600" },
  tryon:   { active: "text-sky-600",    bg: "bg-sky-50 border-sky-200 shadow-sky-100",             icon: "text-sky-500",    dot: "bg-sky-500" },
  closet:  { active: "text-pink-600",   bg: "bg-pink-50 border-pink-200 shadow-pink-100",          icon: "text-pink-500",   dot: "bg-pink-500" },
  recycle: { active: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200 shadow-emerald-100", icon: "text-emerald-500",dot: "bg-emerald-500" },
};

export default function Home() {
  const { t, lang, setLang } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("studio");
  const [closetSubTab, setClosetSubTab] = useState<"collection" | "stylist" | "profile">("collection");
  const [personBase64, setPersonBase64] = useState("");
  const [personPreview, setPersonPreview] = useState("");
  const [clothImages, setClothImages] = useState<UploadedImage[]>([]);
  const [selectedClothId, setSelectedClothId] = useState<string | null>(null);
  const [clothBase64, setClothBase64] = useState("");
  const [clothPreview, setClothPreview] = useState("");
  const [clothMime, setClothMime] = useState("image/jpeg");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(60);
  const [gender, setGender] = useState(lang === "vi" ? "Nam" : "Male");
  const [resultText, setResultText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [userRequest, setUserRequest] = useState("");
  const [closet, setCloset] = useState<ClothingItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleClothImagesChange = (imgs: UploadedImage[]) => setClothImages(imgs);

  // Load closet from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fitai-closet-items");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCloset(parsed);
          }
        } catch (e) {
          console.error("Error loading closet items", e);
        }
      }
    }
  }, []);

  // Save closet to localStorage on changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fitai-closet-items", JSON.stringify(closet));
    }
  }, [closet]);

  useEffect(() => {
    if (clothImages.length === 0) { setSelectedClothId(null); setClothBase64(""); setClothPreview(""); setClothMime("image/jpeg"); return; }
    const ss = selectedClothId && clothImages.some(i => i.id === selectedClothId);
    const id = ss ? selectedClothId : clothImages[0].id;
    if (!ss) setSelectedClothId(id);
    const img = clothImages.find(i => i.id === id) ?? clothImages[0];
    setClothBase64(img.base64); setClothPreview(img.previewUrl); setClothMime(img.mimeType);
  }, [clothImages, selectedClothId]);

  const handleAddToCloset = useCallback(async () => {
    const targets = clothImages.length > 0 ? clothImages : clothBase64 ? [{ id: crypto.randomUUID(), base64: clothBase64, mimeType: clothMime, previewUrl: clothPreview }] : [];
    if (!targets.length) return;
    setIsAnalyzing(true); setError("");
    try {
      for (const img of targets) {
        const r = await fetch("/api/analyze-clothing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: img.base64, mimeType: img.mimeType }) });
        const d = await r.json();
        setCloset(p => [{ id: crypto.randomUUID(), imageUrl: img.previewUrl, imageBase64: img.base64, type: d.data?.type || "Unknown", color: d.data?.color || "Unknown", material: d.data?.material || "Unknown", style: d.data?.style || "Casual", condition: d.data?.condition || "Good", addedAt: new Date(), tryOnCount: 0 }, ...p]);
      }
      setActiveTab("closet");
      setClosetSubTab("collection");
    } catch { setError("Cannot analyze image."); }
    finally { setIsAnalyzing(false); }
  }, [clothImages, clothBase64, clothMime, clothPreview]);

  const handleTryOn = useCallback(async (clothItem?: ClothingItem) => {
    const si = clothImages.find(i => i.id === selectedClothId);
    const tb = clothItem?.imageBase64 ?? si?.base64 ?? clothBase64;
    if (!tb) { setError("Need clothing image!"); return; }
    setIsProcessing(true); setResultText(""); setError("");
    try {
      const r = await fetch("/api/describe-outfit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personImageBase64: personBase64 || "", clothImageBase64: tb, height, weight, gender, userRequest, lang }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResultText(d.resultText || "");
      if (clothItem) setCloset(p => p.map(c => c.id === clothItem.id ? { ...c, tryOnCount: c.tryOnCount + 1, lastTriedAt: new Date() } : c));
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); }
    finally { setIsProcessing(false); }
  }, [personBase64, clothBase64, clothImages, selectedClothId, clothMime, height, weight, userRequest, gender, lang]);

  const handleTryOutfit = useCallback((items: ClothingItem[]) => {
    if (items.length === 0) return;
    const firstItem = items[0];
    
    // Set cloth images & select first item
    setClothPreview(firstItem.imageUrl);
    setClothBase64(firstItem.imageBase64 || "");
    setClothImages([{
      id: firstItem.id,
      base64: firstItem.imageBase64 || "",
      previewUrl: firstItem.imageUrl,
      mimeType: "image/jpeg"
    }]);
    setSelectedClothId(firstItem.id);
    setActiveTab("tryon");
    
    // Start trying on this item
    handleTryOn(firstItem);
  }, [handleTryOn]);

  const handleDeleteFromCloset = (id: string) => setCloset(p => p.filter(c => c.id !== id));
  const handleClearCloset = () => { if (confirm(t("closet.confirm"))) setCloset([]); };
  const gOpts = lang === "vi" ? [{ v: "Nam", l: "Nam" }, { v: "Nữ", l: "Nữ" }] : [{ v: "Male", l: "Male" }, { v: "Female", l: "Female" }];

  return (
    <div className="min-h-screen pb-20 sm:pb-0" style={{position:"relative", zIndex:1}}>
      {/* HEADER */}
      <div className="sticky top-0 z-30 border-b border-violet-200/40" style={{background:"rgba(255,255,255,0.82)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)"}}>
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 blur-md opacity-40" />
              <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-2xl p-2.5 shadow-lg">
                <Sparkles size={18} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight leading-none gradient-text">FitAI</h1>
              <p className="text-[10px] text-violet-400 font-semibold mt-0.5">{t("app.subtitle")}</p>
            </div>
          </div>

          {/* TABS */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white/60 rounded-2xl p-1.5 border border-violet-100/80 shadow-sm shadow-violet-50">
            {(["studio", "tryon", "closet", "recycle"] as Tab[]).map(tab => {
              const Icon = TAB_ICONS[tab];
              const isActive = activeTab === tab;
              const colors = TAB_COLORS[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 border",
                    isActive
                      ? `${colors.bg} ${colors.active} shadow-sm`
                      : "text-zinc-400 border-transparent hover:text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <Icon size={14} className={isActive ? colors.icon : ""} />
                  <span>{t(`tab.${tab}`)}</span>
                  {tab === "closet" && closet.length > 0 && (
                    <span className={cn("rounded-full text-[9px] font-black px-1.5 py-0.5 text-white", colors.dot)}>
                      {closet.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Language Switcher in Header */}
          <div className="hidden md:flex items-center gap-1 bg-white/60 p-1 rounded-xl border border-violet-100/80 shadow-sm">
            <Globe size={13} className="text-violet-300 ml-2 mr-1" />
            {(["vi", "en"] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all",
                  lang === l
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm"
                    : "text-zinc-500 hover:text-violet-700"
                )}
              >
                {l === "vi" ? "VI" : "EN"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-8">
        {activeTab === "studio" && (
          <div className="animate-fade-in">
            <div className="mb-6 rounded-2xl p-5 section-header-studio">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 shadow-lg shadow-violet-200">
                  <Palette size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold gradient-text">{t("tab.studio")}</h2>
                  <p className="text-xs text-violet-500 font-medium mt-0.5">{t("studio.title")}</p>
                </div>
                <span className="ml-auto badge-studio">FREE</span>
              </div>
            </div>
            <DreaminaStudio />
          </div>
        )}

        {activeTab === "tryon" && (
          <div className="animate-fade-in space-y-6">
            <div className="rounded-2xl p-5 section-header-tryon">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 p-2.5 shadow-lg shadow-sky-200">
                  <Wand2 size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold" style={{background:"linear-gradient(135deg,#0ea5e9,#10b981)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>{t("tryon.page.title")}</h2>
                  <p className="text-xs text-sky-500 font-medium mt-0.5">{t("tryon.page.subtitle")}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="flex flex-col gap-5 lg:col-span-1">
                {/* Person Image Upload Card */}
                <div className="card">
                  <ImageUploader
                    label={t("tryon.person.label")}
                    hint={t("tryon.person.hint")}
                    previewUrl={personPreview}
                    onImageChange={(b, _, p) => {
                      setPersonBase64(b);
                      setPersonPreview(p);
                    }}
                  />
                </div>

                {/* Body Metrics Card */}
                <BodyForm
                  height={height}
                  weight={weight}
                  onChange={(f, v) => {
                    if (f === "height") setHeight(v);
                    else setWeight(v);
                  }}
                />

                {/* Gender Select Card */}
                <div className="card">
                  <label className="block text-xs font-semibold text-zinc-500 mb-2">
                    {t("tryon.gender")}
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="input-modern"
                  >
                    {gOpts.map(o => (
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-5 lg:col-span-1">
                {/* Cloth Selection Card */}
                <div className="card">
                  <MultiImageUploader
                    label={t("tryon.cloth.label")}
                    hint={t("tryon.cloth.hint")}
                    images={clothImages}
                    onChange={handleClothImagesChange}
                    maxImages={10}
                  />
                  {clothImages.length > 0 && (
                    <div className="mt-4 border-t border-zinc-100 pt-4">
                      <p className="mb-1 text-xs font-bold text-zinc-600">{t("tryon.cloth.select")}</p>
                      <p className="mb-3 text-[11px] text-zinc-400">
                        {t("tryon.cloth.select.hint")} <span className="font-semibold text-violet-600">purple border</span>
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {clothImages.map(img => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setSelectedClothId(img.id)}
                            className={cn(
                              "relative rounded-xl overflow-hidden bg-zinc-50 aspect-square transition-all duration-200 border-2",
                              selectedClothId === img.id
                                ? "border-violet-600 ring-2 ring-violet-100"
                                : "border-zinc-200 hover:border-zinc-300"
                            )}
                          >
                            <img src={img.previewUrl} alt="" className="w-full h-full object-contain p-1" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Request Card */}
                <div className="card">
                  <label className="text-xs font-semibold text-zinc-500">{t("tryon.request")}</label>
                  <textarea
                    value={userRequest}
                    onChange={e => setUserRequest(e.target.value)}
                    placeholder={t("tryon.request.placeholder")}
                    className="input-modern mt-2 min-h-[90px] resize-none"
                  />
                </div>

                {/* Buttons container */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleTryOn()}
                    disabled={!clothBase64 || isProcessing}
                    className="btn-primary flex items-center justify-center gap-2 py-3"
                  >
                    <Wand2 size={16} />
                    {isProcessing ? t("tryon.button.loading") : t("tryon.button")}
                  </button>
                  <button
                    onClick={handleAddToCloset}
                    disabled={(!clothImages.length && !clothBase64) || isAnalyzing}
                    className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition disabled:opacity-40"
                  >
                    <Plus size={15} />
                    {isAnalyzing
                      ? t("tryon.saving")
                      : clothImages.length > 1
                      ? t("tryon.save.multi", { count: clothImages.length })
                      : t("tryon.save")}
                  </button>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    ⚠️ {error}
                  </div>
                )}
              </div>

              {/* TryOn Results column */}
              <div className="lg:col-span-1">
                <div className="card h-full min-h-[400px]">
                  <TryOnResult resultText={resultText} isLoading={isProcessing} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "closet" && (
          <div className="animate-fade-in space-y-6">
            {/* Sub-Navigation inside Closet tab */}
            <div className="flex border-b border-pink-100 gap-6 overflow-x-auto pb-px">
              {(["collection", "stylist", "profile"] as const).map(sub => (
                <button
                  key={sub}
                  onClick={() => setClosetSubTab(sub)}
                  className={cn(
                    "pb-3 text-sm font-bold border-b-2 transition-all relative shrink-0",
                    closetSubTab === sub
                      ? "border-pink-500 text-pink-600"
                      : "border-transparent text-zinc-400 hover:text-zinc-600"
                  )}
                >
                  {t(`closet.tab.${sub}`)}
                  {sub === "collection" && closet.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700 font-bold">
                      {closet.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sub-Tab 1: Collection Grid */}
            {closetSubTab === "collection" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold" style={{background:"linear-gradient(135deg,#ec4899,#f43f5e)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>{t("closet.title")}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{t("closet.subtitle")}</p>
                    <p className="mt-2 inline-flex items-center rounded-full bg-gradient-to-r from-pink-50 to-rose-50 px-3 py-1 text-xs font-bold text-pink-600 ring-1 ring-pink-200">
                      {closet.length} {t("closet.count")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {closet.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCloset}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition shadow-sm"
                      >
                        <Trash2 size={13} />
                        {t("closet.clear")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab("tryon")}
                      className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-xs"
                    >
                      <Plus size={13} />
                      {t("closet.add")}
                    </button>
                  </div>
                </div>

                {closet.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white/60 px-6 py-20 text-center">
                    <div className="mb-4 rounded-2xl bg-zinc-100 p-5 ring-1 ring-zinc-200/80">
                      <Shirt size={40} className="text-zinc-300" />
                    </div>
                    <p className="font-semibold text-zinc-600">{t("closet.empty")}</p>
                    <p className="mt-1 max-w-sm text-sm text-zinc-400">{t("closet.empty.hint")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {closet.map(item => (
                      <ClothingCard
                        key={item.id}
                        item={item}
                        onTryOn={item => {
                          setActiveTab("tryon");
                          handleTryOn(item);
                        }}
                        onDelete={handleDeleteFromCloset}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 2: AI Stylist */}
            {closetSubTab === "stylist" && (
              <div className="animate-fade-in max-w-3xl mx-auto">
                <OutfitSuggestion closet={closet} onTryOutfit={handleTryOutfit} />
              </div>
            )}

            {/* Sub-Tab 3: Machine Learning Style Profile */}
            {closetSubTab === "profile" && (
              <div className="animate-fade-in max-w-xl mx-auto">
                <AIStyleProfile />
              </div>
            )}
          </div>
        )}

        {activeTab === "recycle" && (
          <div className="animate-fade-in">
            <div className="mb-6 rounded-2xl p-5 section-header-recycle">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 shadow-lg shadow-emerald-200">
                  <Recycle size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold" style={{background:"linear-gradient(135deg,#16a34a,#0d9488)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>{t("recycle.title")}</h2>
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">{t("recycle.subtitle")}</p>
                </div>
                <span className="ml-auto badge-recycle">ECO ♻</span>
              </div>
            </div>
            <RecycleHub />
          </div>
        )}
      </main>

      {/* MOBILE NAV */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-violet-100/60 sm:hidden" style={{background:"rgba(255,255,255,0.92)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)"}}>
        <div className="flex items-center justify-around px-2 py-1.5">
          {(["studio", "tryon", "closet", "recycle"] as Tab[]).map(tab => {
            const Icon = TAB_ICONS[tab];
            const isActive = activeTab === tab;
            const colors = TAB_COLORS[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200",
                  isActive ? colors.active : "text-zinc-400"
                )}
              >
                <div className={cn("p-1.5 rounded-xl transition-all", isActive ? `${colors.bg} border` : "")}>
                  <Icon size={17} />
                </div>
                <span className={cn("text-[9px] font-bold tracking-tight", isActive ? colors.active : "text-zinc-400")}>{t(`tab.${tab}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LANGUAGE SELECTOR - sleeker float for mobile / fallback */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <div className="flex items-center gap-1 rounded-full border border-violet-200/60 shadow-lg px-2 py-1" style={{background:"rgba(255,255,255,0.95)", backdropFilter:"blur(12px)"}}>
          <Globe size={12} className="text-violet-400 ml-1" />
          {(["vi", "en"] as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-black rounded-full transition-all",
                lang === l
                  ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm"
                  : "text-zinc-500 hover:text-violet-700"
              )}
            >
              {l === "vi" ? "VI" : "EN"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}