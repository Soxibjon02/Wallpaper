import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  User,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  Search,
  Database,
  Eye,
  Sliders,
  FolderPlus,
  Tag,
} from "lucide-react";
import type { Wallpaper } from "@shared/index";
import {
  ADMIN_CREDENTIALS,
  isAdminAuthenticated,
  setAdminAuthenticated,
  saveCatalogueToBin,
  fetchCatalogueFromBin,
  JSONBIN_CONFIG,
} from "../services/jsonbin";

interface AdminPanelProps {
  wallpapers: Wallpaper[];
  categories: string[];
  onWallpapersUpdated: (updated: Wallpaper[]) => void;
  onCategoriesUpdated: (updatedCategories: string[]) => void;
  onNotice: (msg: string) => void;
}

export function AdminPanel({
  wallpapers,
  categories,
  onWallpapersUpdated,
  onCategoriesUpdated,
  onNotice,
}: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState<boolean>(isAdminAuthenticated);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<"add" | "manage" | "categories" | "info">("add");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // New wallpaper form state
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState(categories[0] || "Nature");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState("Super Admin");
  const [tags, setTags] = useState("");
  const [width, setWidth] = useState("2160");
  const [height, setHeight] = useState("3840");
  const [featured, setFeatured] = useState(false);
  const license = "Free for personal use";
  const [previewLoaded, setPreviewLoaded] = useState(false);

  // Categories management state
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<{ oldName: string; newName: string } | null>(null);

  // Edit modal state
  const [editingWallpaper, setEditingWallpaper] = useState<Wallpaper | null>(null);

  // Keep category in sync with available categories
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (
      username.trim() === ADMIN_CREDENTIALS.login &&
      password.trim() === ADMIN_CREDENTIALS.password
    ) {
      setAdminAuthenticated(true);
      setAuthenticated(true);
      setLoginError("");
      onNotice("Admin panelga muvaffaqiyatli kirdingiz!");
    } else {
      setLoginError("Login yoki parol noto'g'ri! Iltimos qaytadan urinib ko'ring.");
    }
  }

  function handleLogout() {
    setAdminAuthenticated(false);
    setAuthenticated(false);
    setUsername("");
    setPassword("");
    onNotice("Admin paneldan chiqildi.");
  }

  function handleAutoFillCredentials() {
    setUsername(ADMIN_CREDENTIALS.login);
    setPassword(ADMIN_CREDENTIALS.password);
  }

  // Detect image dimensions when URL is entered
  useEffect(() => {
    if (!imageUrl || !imageUrl.startsWith("http")) {
      setPreviewLoaded(false);
      return;
    }
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setPreviewLoaded(true);
      if (img.naturalWidth && img.naturalHeight) {
        setWidth(String(img.naturalWidth));
        setHeight(String(img.naturalHeight));
      }
    };
    img.onerror = () => {
      setPreviewLoaded(false);
    };
  }, [imageUrl]);

  async function handleAddWallpaper(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      onNotice("Sarlavha va rasm havolasi kiritilishi shart!");
      return;
    }

    const finalCategory = category === "Boshqa..." ? (customCategory.trim() || "General") : category;
    const finalTags = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const newWallpaper: Wallpaper = {
      id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim() || imageUrl.trim(),
      category: finalCategory,
      tags: finalTags.length ? finalTags : [finalCategory.toLowerCase(), "wallpaper"],
      width: parseInt(width) || 2160,
      height: parseInt(height) || 3840,
      featured,
      license: license.trim() || "Free for personal use",
      createdAt: new Date().toISOString(),
      authorName: authorName.trim() || "Super Admin",
    };

    setSaving(true);
    try {
      const updatedList = [newWallpaper, ...wallpapers];
      await saveCatalogueToBin(updatedList, categories);
      onWallpapersUpdated(updatedList);
      onNotice(`"${newWallpaper.title}" JSONBin.io ga muvaffaqiyatli yuklandi!`);

      // Reset form
      setTitle("");
      setImageUrl("");
      setThumbnailUrl("");
      setDescription("");
      setTags("");
      setFeatured(false);
      setCustomCategory("");
      setPreviewLoaded(false);
      setActiveTab("manage");
    } catch (err: unknown) {
      console.error(err);
      onNotice((err as Error).message || "JSONBin ga saqlashda xatolik yuz berdi!");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWallpaper(id: string, name: string) {
    if (!window.confirm(`Rostdan ham "${name}" rasmini JSONBin.io dan o'chirmoqchimisiz?`)) {
      return;
    }

    setSaving(true);
    try {
      const updatedList = wallpapers.filter((w) => w.id !== id);
      await saveCatalogueToBin(updatedList, categories);
      onWallpapersUpdated(updatedList);
      onNotice(`"${name}" JSONBin dan o'chirildi!`);
    } catch (err: unknown) {
      console.error(err);
      onNotice((err as Error).message || "O'chirishda xatolik yuz berdi!");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleFeatured(w: Wallpaper) {
    setSaving(true);
    try {
      const updatedList = wallpapers.map((item) =>
        item.id === w.id ? { ...item, featured: !item.featured } : item
      );
      await saveCatalogueToBin(updatedList, categories);
      onWallpapersUpdated(updatedList);
      onNotice(`"${w.title}" featured holati yangilandi!`);
    } catch (err: unknown) {
      console.error(err);
      onNotice((err as Error).message || "Yangilashda xatolik yuz berdi!");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingWallpaper) return;

    setSaving(true);
    try {
      const updatedList = wallpapers.map((w) =>
        w.id === editingWallpaper.id ? editingWallpaper : w
      );
      await saveCatalogueToBin(updatedList, categories);
      onWallpapersUpdated(updatedList);
      setEditingWallpaper(null);
      onNotice(`"${editingWallpaper.title}" ma'lumotlari yangilandi!`);
    } catch (err: unknown) {
      console.error(err);
      onNotice((err as Error).message || "Saqlashda xatolik yuz berdi!");
    } finally {
      setSaving(false);
    }
  }

  // --- Category Management Handlers ---
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;

    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      onNotice(`"${name}" toifasi allaqachon mavjud!`);
      return;
    }

    setSaving(true);
    try {
      const updatedCats = [...categories, name];
      await saveCatalogueToBin(wallpapers, updatedCats);
      onCategoriesUpdated(updatedCats);
      setNewCatName("");
      onNotice(`"${name}" toifasi muvaffaqiyatli yaratildi va saqlandi!`);
    } catch (err: unknown) {
      console.error(err);
      onNotice((err as Error).message || "Kategoriyani saqlashda xatolik!");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(catName: string) {
    const inUseCount = wallpapers.filter((w) => w.category === catName).length;
    let message = `Rostdan ham "${catName}" toifasini o'chirmoqchimisiz?`;
    if (inUseCount > 0) {
      message = `Diqqat! "${catName}" toifasida ${inUseCount} ta fon rasmi mavjud. Ushbu toifani o'chirishni tasdiqlaysizmi?`;
    }

    if (!window.confirm(message)) return;

    setSaving(true);
    try {
      const updatedCats = categories.filter((c) => c !== catName);
      await saveCatalogueToBin(wallpapers, updatedCats);
      onCategoriesUpdated(updatedCats);
      onNotice(`"${catName}" toifasi o'chirildi!`);
    } catch (err: unknown) {
      console.error(err);
      onNotice((err as Error).message || "Kategoriyani o'chirishda xatolik!");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEditCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCat) return;
    const { oldName, newName } = editingCat;
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === oldName) {
      setEditingCat(null);
      return;
    }

    if (
      categories.some(
        (c) => c.toLowerCase() === trimmedNew.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase()
      )
    ) {
      onNotice(`"${trimmedNew}" toifasi allaqachon mavjud!`);
      return;
    }

    setSaving(true);
    try {
      const updatedCats = categories.map((c) => (c === oldName ? trimmedNew : c));
      // Also update wallpapers that were tagged with old category
      const updatedWallpapers = wallpapers.map((w) =>
        w.category === oldName ? { ...w, category: trimmedNew } : w
      );

      await saveCatalogueToBin(updatedWallpapers, updatedCats);
      onCategoriesUpdated(updatedCats);
      onWallpapersUpdated(updatedWallpapers);
      setEditingCat(null);
      onNotice(`Toifa "${trimmedNew}" ga o'zgartirildi va tegishli rasmlar yangilandi!`);
    } catch (err: unknown) {
      console.error(err);
      onNotice((err as Error).message || "Kategoriyani yangilashda xatolik!");
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncWithJsonBin() {
    setSyncing(true);
    try {
      const remote = await fetchCatalogueFromBin();
      onWallpapersUpdated(remote.wallpapers);
      onCategoriesUpdated(remote.categories);
      onNotice(`JSONBin.io bilan sinxronlandi! (${remote.wallpapers.length} ta rasm, ${remote.categories.length} ta toifa)`);
    } catch (err: unknown) {
      console.error(err);
      onNotice("JSONBin dan qayta yuklashda xatolik!");
    } finally {
      setSyncing(false);
    }
  }

  // Filtered wallpapers for manage tab
  const filteredWallpapers = wallpapers.filter((w) => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      w.title.toLowerCase().includes(q) ||
      w.category.toLowerCase().includes(q) ||
      (w.authorName && w.authorName.toLowerCase().includes(q)) ||
      w.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  // Login view if not authenticated
  if (!authenticated) {
    return (
      <section className="admin-page">
        <div className="admin-login-wrapper">
          <div className="admin-login-card">
            <div className="admin-login-badge">
              <ShieldCheck size={18} />
              <span>WALLORA SUPER ADMIN PORTAL</span>
            </div>

            <h2>Admin Panelga Kirish</h2>
            <p className="admin-login-subtitle">
              Kategoriyalarni yaratish, barcha rasmlarni boshqarish va JSONBin.io ga fon rasmlari yuklash uchun tizimga kiring.
            </p>

            {loginError && (
              <div className="admin-error-box">
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="admin-form-group">
                <label>
                  <User size={15} /> Login
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin1234"
                  autoFocus
                  required
                />
              </div>

              <div className="admin-form-group">
                <label>
                  <Lock size={15} /> Parol
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  required
                />
              </div>

              <div className="admin-login-actions">
                <button type="submit" className="primary-button admin-submit-btn">
                  <ShieldCheck size={16} /> Kirish
                </button>
                <button
                  type="button"
                  onClick={handleAutoFillCredentials}
                  className="outline-button small"
                  title="Test login/parolni to'ldirish"
                >
                  ⚡ Avto-to'ldirish
                </button>
              </div>
            </form>

            <div className="admin-hint-card">
              <small>
                <strong>Super Admin hisobi:</strong> Login: <code>admin1234</code> | Parol:{" "}
                <code>admin123</code>
              </small>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <section className="admin-page">
      {/* Top Banner & Status */}
      <div className="admin-header-bar">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" />
            SUPER ADMIN BOSHQARUV PANEL
          </div>
          <h1>
            Wallpaper & Toifalar Boshqaruvi<span className="heading-period">.</span>
          </h1>
          <p>Yangi toifalar yarating, barcha foydalanuvchilar yuklagan rasmlarni nazorat qiling va JSONBin.io bulut omborini boshqaring.</p>
        </div>

        <div className="admin-header-actions">
          <button
            className="outline-button"
            onClick={handleSyncWithJsonBin}
            disabled={syncing}
            title="JSONBin.io dan yangilash"
          >
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Yuklanmoqda..." : "JSONBin Sync"}
          </button>
          <button className="outline-button admin-logout-btn" onClick={handleLogout}>
            <LogOut size={15} /> Chiqish
          </button>
        </div>
      </div>

      {/* JSONBin connection status badge */}
      <div className="admin-status-strip">
        <div className="admin-status-item">
          <Database size={15} className="text-accent" />
          <span>Bin ID:</span>
          <code>{JSONBIN_CONFIG.binId}</code>
        </div>
        <div className="admin-status-item">
          <span className="admin-status-dot online" />
          <span>JSONBin.io: <strong>Faol va ulangan</strong></span>
        </div>
        <div className="admin-status-item">
          <ImageIcon size={15} />
          <span>Jami rasmlar: <strong>{wallpapers.length} ta</strong></span>
        </div>
        <div className="admin-status-item">
          <Tag size={15} />
          <span>Toifalar: <strong>{categories.length} ta</strong></span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-nav-tabs">
        <button
          className={`admin-tab-btn ${activeTab === "add" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("add")}
        >
          <Plus size={16} /> Yangi rasm qo'shish
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "categories" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          <FolderPlus size={16} /> Toifalarni boshqarish ({categories.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "manage" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("manage")}
        >
          <Sliders size={16} /> Barcha rasmlarni boshqarish ({wallpapers.length})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "info" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          <Database size={16} /> JSONBin konfiguratsiyasi
        </button>
      </div>

      {/* Tab 1: Add New Wallpaper */}
      {activeTab === "add" && (
        <div className="admin-content-grid">
          <div className="admin-card">
            <div className="admin-card-head">
              <h2><Plus size={18} /> Yangi rasm ma'lumotlarini kiritish</h2>
              <p>Rasm havolasi va parametrlarini to'ldirib, to'g'ridan-to'g'ri JSONBin.io ga saqlang.</p>
            </div>

            <form onSubmit={handleAddWallpaper} className="admin-wallpaper-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Rasm nomi / Sarlavhasi *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masalan: Neon Cyberpunk City"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Toifa (Kategoriya)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Boshqa...">+ Maxsus toifa kiritish...</option>
                  </select>
                </div>
              </div>

              {category === "Boshqa..." && (
                <div className="form-field">
                  <label>Maxsus toifa nomini yozing</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Masalan: Sport, Neon, Cyber"
                  />
                </div>
              )}

              <div className="form-field">
                <label>Muallif nomi / Yuklovchi</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Super Admin"
                />
              </div>

              <div className="form-field">
                <label>Rasm URL havolasi (HTTPS) *</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  required
                />
                <span className="field-hint">
                  Unsplash, Pexels yoki to'g'ridan-to'g'ri rasm havolasini kiriting.
                </span>
              </div>

              <div className="form-field">
                <label>Thumbnail (Kichik rasm) URL (Ixtiyoriy)</label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Bo'sh qoldirilsa, asosiy rasm ishlatiladi"
                />
              </div>

              <div className="form-field">
                <label>Rasm izohi / Tavsifi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Rasm haqida qisqacha ma'lumot yoki izoh..."
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Kenglik (Width px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Balandlik (Height px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Teglar (vergul bilan ajrating)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="nature, mountain, dark, amoled"
                />
              </div>

              <div className="form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  <span>Featured (Bosh sahifada tavsiya qilingan rasm sifatida ko'rsatilsin)</span>
                </label>
              </div>

              <button
                type="submit"
                className="primary-button admin-save-btn"
                disabled={saving || !title.trim() || !imageUrl.trim()}
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> JSONBin.io ga yuklanmoqda...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> JSONBin.io ga Yuklash va Saqlash
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Preview Column */}
          <div className="admin-preview-col">
            <div className="admin-card preview-card">
              <div className="admin-card-head">
                <h2><Eye size={17} /> Jonli Ko'rib Chiqish (Preview)</h2>
                <p>Kiritilgan ma'lumotlar foydalanuvchiga qanday ko'rinadi:</p>
              </div>

              <div className="preview-display">
                {imageUrl ? (
                  <div className="preview-image-wrap">
                    <img
                      src={imageUrl}
                      alt={title || "Preview"}
                      onError={() => setPreviewLoaded(false)}
                      onLoad={() => setPreviewLoaded(true)}
                    />
                    <div className="preview-overlay">
                      <span className="preview-category">{category}</span>
                      {featured && <span className="preview-featured-badge">FEATURED</span>}
                      {previewLoaded && <span className="preview-status-badge">✓ Faol</span>}
                    </div>
                  </div>
                ) : (
                  <div className="preview-placeholder">
                    <ImageIcon size={48} />
                    <span>Rasm URL havolasini kiriting</span>
                  </div>
                )}

                <div className="preview-meta">
                  <h3>{title || "Rasm sarlavhasi"}</h3>
                  <div className="preview-author-badge" style={{ marginBottom: 6 }}>
                    <User size={12} /> {authorName || "Super Admin"}
                  </div>
                  <p>{description || "Tavsif kiritilmagan..."}</p>
                  <div className="preview-specs">
                    <span>O'lcham: {width} × {height}</span>
                    <span>Toifa: {category}</span>
                  </div>
                  {tags && (
                    <div className="preview-tags">
                      {tags.split(",").map((t) => t.trim() && (
                        <span key={t}>#{t.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Categories (SUPER ADMIN EXCLUSIVE) */}
      {activeTab === "categories" && (
        <div className="admin-categories-section">
          {/* Add Category Card */}
          <div className="admin-card">
            <div className="admin-card-head">
              <h2><FolderPlus size={18} /> Yangi Toifa (Kategoriya) Yaratish</h2>
              <p>Super admin sifatida yangi toifalar qo'shing. Ushbu toifalar barcha foydalanuvchilarga rasm yuklashda va qidirishda ko'rinadi.</p>
            </div>

            <form onSubmit={handleCreateCategory} className="admin-category-form">
              <div className="cat-input-row">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Yangi toifa nomi (Masalan: Sport, Neon, Hayvonlar, Minimalizm)..."
                  required
                />
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving || !newCatName.trim()}
                >
                  <Plus size={16} /> Toifa Qo'shish
                </button>
              </div>
            </form>
          </div>

          {/* Existing Categories List */}
          <div className="admin-card" style={{ marginTop: 20 }}>
            <div className="admin-card-head">
              <h2><Tag size={18} /> Mavjud Toifalar Ro'yxati ({categories.length})</h2>
              <p>Har bir toifani tahrirlashingiz yoki o'chirishingiz mumkin. O'zgarishlar darhol JSONBin.io bulutida saqlanadi.</p>
            </div>

            <div className="admin-cats-grid">
              {categories.map((cat) => {
                const count = wallpapers.filter((w) => w.category === cat).length;
                return (
                  <div key={cat} className="admin-cat-card">
                    <div className="admin-cat-info">
                      <strong>{cat}</strong>
                      <span>{count} ta rasm</span>
                    </div>

                    <div className="admin-cat-actions">
                      <button
                        className="action-icon-btn"
                        onClick={() => setEditingCat({ oldName: cat, newName: cat })}
                        title="Nomini tahrirlash"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="action-icon-btn delete-btn"
                        onClick={() => handleDeleteCategory(cat)}
                        title="Toifani o'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Manage Existing Wallpapers */}
      {activeTab === "manage" && (
        <div className="admin-manage-section">
          <div className="admin-manage-toolbar">
            <div className="admin-search-box">
              <Search size={16} />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Nomi, toifasi, muallifi yoki tegi bo'yicha qidirish..."
              />
            </div>
            <div className="manage-count">
              Ko'rsatilmoqda: <strong>{filteredWallpapers.length} / {wallpapers.length}</strong>
            </div>
          </div>

          <div className="admin-wallpaper-table">
            <div className="table-head">
              <span className="col-preview">Rasm</span>
              <span className="col-title">Nomi & Ma'lumot</span>
              <span className="col-author">Muallif</span>
              <span className="col-category">Toifa</span>
              <span className="col-size">O'lcham</span>
              <span className="col-featured">Featured</span>
              <span className="col-actions">Amallar</span>
            </div>

            <div className="table-body">
              {filteredWallpapers.length === 0 ? (
                <div className="empty-manage">
                  <p>Mos keluvchi rasm topilmadi.</p>
                </div>
              ) : (
                filteredWallpapers.map((w) => (
                  <div key={w.id} className="table-row">
                    <div className="col-preview">
                      <img src={w.thumbnailUrl || w.imageUrl} alt={w.title} />
                    </div>
                    <div className="col-title">
                      <strong>{w.title}</strong>
                      <small>{w.description || "Tavsifsiz"}</small>
                      <div className="row-tags">
                        {w.tags.slice(0, 3).map((t) => (
                          <span key={t}>#{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="col-author">
                      <span className="author-badge">
                        <User size={11} /> {w.authorName || "Wallora"}
                      </span>
                    </div>
                    <div className="col-category">
                      <span className="cat-badge">{w.category}</span>
                    </div>
                    <div className="col-size">
                      <span>{w.width && w.height ? `${w.width}×${w.height}` : "Original"}</span>
                    </div>
                    <div className="col-featured">
                      <button
                        className={`featured-toggle ${w.featured ? "is-featured" : ""}`}
                        onClick={() => handleToggleFeatured(w)}
                        title={w.featured ? "Featured dan chiqarish" : "Featured qilish"}
                      >
                        <Sparkles size={14} />
                        {w.featured ? "Ha" : "Yo'q"}
                      </button>
                    </div>
                    <div className="col-actions">
                      <button
                        className="action-icon-btn"
                        onClick={() => setEditingWallpaper(w)}
                        title="Tahrirlash"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="action-icon-btn delete-btn"
                        onClick={() => handleDeleteWallpaper(w.id, w.title)}
                        title="O'chirish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: JSONBin Info */}
      {activeTab === "info" && (
        <div className="admin-info-section">
          <div className="info-grid">
            <div className="info-tile">
              <span className="info-label">BULUT PROVAYDER</span>
              <span className="info-value highlight">JSONBin.io (v3 REST API)</span>
            </div>
            <div className="info-tile">
              <span className="info-label">BIN IDENTIFIKATORI</span>
              <span className="info-value"><code>{JSONBIN_CONFIG.binId}</code></span>
            </div>
            <div className="info-tile">
              <span className="info-label">JAMI RASMLAR</span>
              <span className="info-value">{wallpapers.length} ta fon rasmi</span>
            </div>
            <div className="info-tile">
              <span className="info-label">JAMI TOIFALAR</span>
              <span className="info-value">{categories.length} ta kategoriya</span>
            </div>
          </div>

          <div className="admin-json-viewer">
            <h3>JSONBin dagi hozirgi to'liq ma'lumot (Jonli JSON struktura):</h3>
            <pre>
              {JSON.stringify({ wallpapersCount: wallpapers.length, categories, sample: wallpapers[0] }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCat && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingCat(null);
          }}
        >
          <div className="small-modal edit-modal">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              SUPER ADMIN
            </div>
            <h2>Toifani Tahrirlash</h2>
            <p>"{editingCat.oldName}" toifasining yangi nomini kiriting.</p>
            <form onSubmit={handleSaveEditCategory} className="admin-edit-form">
              <div className="form-field">
                <label>Toifa nomi</label>
                <input
                  type="text"
                  value={editingCat.newName}
                  onChange={(e) => setEditingCat({ ...editingCat, newName: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="edit-modal-actions">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setEditingCat(null)}
                >
                  Bekor qilish
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  <Check size={16} /> Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Wallpaper Modal */}
      {editingWallpaper && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingWallpaper(null);
          }}
        >
          <div className="small-modal edit-modal">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              TAHRIRLASH
            </div>
            <h2>Rasmni Tahrirlash</h2>
            <form onSubmit={handleSaveEdit} className="admin-edit-form">
              <div className="form-field">
                <label>Sarlavha</label>
                <input
                  type="text"
                  value={editingWallpaper.title}
                  onChange={(e) =>
                    setEditingWallpaper({ ...editingWallpaper, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label>Muallif nomi / Yuklovchi</label>
                <input
                  type="text"
                  value={editingWallpaper.authorName || ""}
                  onChange={(e) =>
                    setEditingWallpaper({ ...editingWallpaper, authorName: e.target.value })
                  }
                  placeholder="Muallif ismini kiriting"
                />
              </div>

              <div className="form-field">
                <label>Rasm URL</label>
                <input
                  type="url"
                  value={editingWallpaper.imageUrl}
                  onChange={(e) =>
                    setEditingWallpaper({ ...editingWallpaper, imageUrl: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label>Toifa</label>
                <select
                  value={editingWallpaper.category}
                  onChange={(e) =>
                    setEditingWallpaper({ ...editingWallpaper, category: e.target.value })
                  }
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Rasm izohi (Tavsif)</label>
                <textarea
                  value={editingWallpaper.description || ""}
                  onChange={(e) =>
                    setEditingWallpaper({
                      ...editingWallpaper,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="form-field">
                <label>Teglar (vergul bilan)</label>
                <input
                  type="text"
                  value={editingWallpaper.tags.join(", ")}
                  onChange={(e) =>
                    setEditingWallpaper({
                      ...editingWallpaper,
                      tags: e.target.value.split(",").map((t) => t.trim()),
                    })
                  }
                />
              </div>

              <div className="form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={!!editingWallpaper.featured}
                    onChange={(e) =>
                      setEditingWallpaper({
                        ...editingWallpaper,
                        featured: e.target.checked,
                      })
                    }
                  />
                  <span>Featured (Bosh sahifada ko'rsatish)</span>
                </label>
              </div>

              <div className="edit-modal-actions">
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setEditingWallpaper(null)}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  <Check size={16} /> Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
