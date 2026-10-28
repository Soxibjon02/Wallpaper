import { useState, useEffect } from "react";
import { X, ImagePlus, User, Sparkles, AlertCircle, Eye, Tag, FileText } from "lucide-react";
import type { Wallpaper } from "@shared/index";
import { saveWallpapersToBin } from "../services/jsonbin";

interface UserUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  wallpapers: Wallpaper[];
  onWallpaperUploaded: (newWallpaper: Wallpaper) => void;
  onNotice: (msg: string) => void;
}

export function UserUploadModal({
  isOpen,
  onClose,
  categories,
  wallpapers,
  onWallpaperUploaded,
  onNotice,
}: UserUploadModalProps) {
  // Author name persisted in localStorage
  const [authorName, setAuthorName] = useState<string>(() => {
    try {
      return localStorage.getItem("wallora:author_name") || "";
    } catch {
      return "";
    }
  });

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState("");
  const [width, setWidth] = useState(2160);
  const [height, setHeight] = useState(3840);
  const [loading, setLoading] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Set default category when categories list loads
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  // Image preloading & dimension auto-detection
  useEffect(() => {
    if (!imageUrl || !imageUrl.startsWith("http")) {
      setPreviewLoaded(false);
      setPreviewError(false);
      return;
    }

    setPreviewError(false);
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setPreviewLoaded(true);
      setPreviewError(false);
      if (img.naturalWidth && img.naturalHeight) {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      }
    };
    img.onerror = () => {
      setPreviewLoaded(false);
      setPreviewError(true);
    };
  }, [imageUrl]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const trimmedAuthor = authorName.trim();
    if (!trimmedAuthor) {
      setErrorMsg("Iltimos, o'zingizning ismingiz yoki taxallusingizni kiriting!");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMsg("Rasm sarlavhasini kiriting!");
      return;
    }

    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl || !trimmedUrl.startsWith("http")) {
      setErrorMsg("Yaroqli to'liq rasm havolasini (URL) kiriting!");
      return;
    }

    const selectedCategory = category || (categories[0] ?? "Nature");
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    // Save author name to localStorage for future uploads
    try {
      localStorage.setItem("wallora:author_name", trimmedAuthor);
    } catch {
      // ignore
    }

    const newWallpaper: Wallpaper = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: trimmedTitle,
      description: description.trim() || undefined,
      imageUrl: trimmedUrl,
      thumbnailUrl: trimmedUrl,
      category: selectedCategory,
      tags: parsedTags.length > 0 ? parsedTags : [selectedCategory.toLowerCase(), "wallpaper"],
      width,
      height,
      featured: false,
      license: "Uploaded by community",
      createdAt: new Date().toISOString(),
      authorName: trimmedAuthor,
    };

    setLoading(true);
    try {
      const updatedList = [newWallpaper, ...wallpapers];
      await saveWallpapersToBin(updatedList, categories);
      onWallpaperUploaded(newWallpaper);
      onNotice(`"${newWallpaper.title}" muvaffaqiyatli yuklandi va ${trimmedAuthor} nomidan qo'shildi!`);
      
      // Reset form
      setTitle("");
      setImageUrl("");
      setDescription("");
      setTags("");
      setPreviewLoaded(false);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg((err as Error).message || "Rasmni yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="upload-modal-wrapper">
        <div className="upload-modal-card">
          <button
            className="modal-close icon-button"
            onClick={onClose}
            disabled={loading}
            aria-label="Yopish"
          >
            <X size={20} />
          </button>

          <div className="upload-modal-header">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              HAMJAMOYAT BILAN BO'LISHING
            </div>
            <h2>Wallpaper Yuklash<span className="heading-period">.</span></h2>
            <p>
              Har bir foydalanuvchi o'z nomidan wallpaper joylashi mumkin. Rasm havolasi, izoh va super admin yaratgan kategoriyani tanlang.
            </p>
          </div>

          {errorMsg && (
            <div className="admin-error-box">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="upload-grid-layout">
            {/* Form Side */}
            <form onSubmit={handleSubmit} className="upload-form">
              {/* Author name field */}
              <div className="form-field">
                <label>
                  <User size={14} className="text-accent" /> Sizning ismingiz / Taxallusingiz *
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Masalan: Soxibjon yoki Ali Valiyev"
                  required
                />
                <span className="field-hint">
                  Ushbu nom rasm kartochkasida va rasm ma'lumotlarida muallif sifatida ko'rsatiladi.
                </span>
              </div>

              {/* Image URL */}
              <div className="form-field">
                <label>
                  <ImagePlus size={14} className="text-accent" /> Rasm havolasi (URL link) *
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  required
                />
                <span className="field-hint">
                  Unsplash, Pexels yoki to'g'ridan-to'g'ri rasm linkini joylang (HTTPS bo'lishi lozim).
                </span>
              </div>

              {/* Title & Category Row */}
              <div className="form-row">
                <div className="form-field">
                  <label>Rasm nomi / Sarlavha *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masalan: Tungi Toshkent"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Kategoriya (Toifa) *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className="field-hint">
                    Kategoriyalar super admin tomonidan boshqariladi.
                  </span>
                </div>
              </div>

              {/* Description / Caption */}
              <div className="form-field">
                <label>
                  <FileText size={14} className="text-accent" /> Rasm izohi (Tavsif)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ushbu rasm haqida fikringiz yoki qisqacha izoh qoldiring..."
                />
              </div>

              {/* Tags */}
              <div className="form-field">
                <label>
                  <Tag size={14} /> Teglar (vergul bilan ajrating)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="shahar, tungi, chiroqlar, arxitektura"
                />
              </div>

              <div className="upload-modal-actions">
                <button
                  type="button"
                  className="outline-button"
                  onClick={onClose}
                  disabled={loading}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading || !imageUrl || !title}
                >
                  {loading ? (
                    "Yuklanmoqda..."
                  ) : (
                    <>
                      <Sparkles size={16} /> O'z nomimdan yuklash
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Live Card Preview */}
            <div className="upload-preview-pane">
              <div className="preview-sticky-wrap">
                <div className="preview-pane-title">
                  <Eye size={15} /> Rasmning ko'rinishi (Live Preview)
                </div>

                {previewLoaded ? (
                  <div className="preview-card-box">
                    <div className="preview-img-container">
                      <img src={imageUrl} alt={title || "Preview"} />
                      <span className="image-category">{category || "General"}</span>
                      <span className="preview-res-badge">{width} × {height}</span>
                    </div>

                    <div className="preview-card-info">
                      <div className="preview-card-header">
                        <h4>{title || "Sarlavha kiritilmagan"}</h4>
                        <span className="preview-author-badge">
                          <User size={12} /> {authorName.trim() || "Sizning ismingiz"}
                        </span>
                      </div>
                      {description && (
                        <p className="preview-caption">"{description}"</p>
                      )}
                    </div>
                  </div>
                ) : previewError ? (
                  <div className="preview-empty-state preview-has-error">
                    <AlertCircle size={28} />
                    <strong>Rasmni yuklab bo'lmadi</strong>
                    <p>Havola to'g'riligini va rasm ochiq internetda mavjudligini tekshiring.</p>
                  </div>
                ) : (
                  <div className="preview-empty-state">
                    <ImagePlus size={36} />
                    <strong>Havola kiritilishini kutmoqda...</strong>
                    <p>Yuqoridagi maydonga rasm URL havolasini kiritganingizda, bu yerda jonli ko'rinish paydo bo'ladi.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
