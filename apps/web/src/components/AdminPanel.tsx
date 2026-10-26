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
  ExternalLink,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  Search,
  Database,
  Eye,
  Sliders,
} from "lucide-react";
import type { Wallpaper } from "@shared/index";
import {
  ADMIN_CREDENTIALS,
  isAdminAuthenticated,
  setAdminAuthenticated,
  saveWallpapersToBin,
  fetchWallpapersFromBin,
  JSONBIN_CONFIG,
} from "../services/jsonbin";

interface AdminPanelProps {
  wallpapers: Wallpaper[];
  onWallpapersUpdated: (updated: Wallpaper[]) => void;
  onNotice: (msg: string) => void;
}

export function AdminPanel({ wallpapers, onWallpapersUpdated, onNotice }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState<boolean>(isAdminAuthenticated);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<"add" | "manage" | "info">("add");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // New wallpaper form state
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("Nature");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [width, setWidth] = useState("2160");
  const [height, setHeight] = useState("3840");
  const [featured, setFeatured] = useState(false);
  const [license, setLicense] = useState("Free for personal use");
  const [previewLoaded, setPreviewLoaded] = useState(false);

  // Edit modal state
  const [editingWallpaper, setEditingWallpaper] = useState<Wallpaper | null>(null);

  const categories = [
    "Nature",
    "Landscapes",
    "Ocean",
    "Cars",
    "Architecture",
    "Space",
    "AMOLED",
    "Cyberpunk",
    "Anime",
    "Abstract",
    "Minimal",
    "Boshqa...",
  ];

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
      tags: finalTags.length ? finalTags : ["wallpaper"],
      width: parseInt(width) || 2160,
      height: parseInt(height) || 3840,
      featured,
      license: license.trim() || "Free for personal use",
      createdAt: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const updatedList = [newWallpaper, ...wallpapers];
      await saveWallpapersToBin(updatedList);
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
      await saveWallpapersToBin(updatedList);
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
      await saveWallpapersToBin(updatedList);
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
      await saveWallpapersToBin(updatedList);
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

  async function handleSyncWithJsonBin() {
    setSyncing(true);
    try {
      const remote = await fetchWallpapersFromBin();
      onWallpapersUpdated(remote);
      onNotice(`JSONBin.io bilan sinxronlandi! (${remote.length} ta rasm)`);
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
              <span>WALLORA ADMIN PORTAL</span>
            </div>

            <h2>Admin Panelga Kirish</h2>
            <p className="admin-login-subtitle">
              Rasmlarni boshqarish va JSONBin.io ga yangi fon rasmlari yuklash uchun tizimga kiring.
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
                <strong>Belgilangan hisob:</strong> Login: <code>admin1234</code> | Parol:{" "}
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
            ADMIN BOSHQARUV PANEL
          </div>
          <h1>
            Wallpaper & JSONBin Boshqaruvi<span className="heading-period">.</span>
          </h1>
          <p>Rasmlar to'plamini JSONBin.io bulut omboriga yuklang va tahrirlang.</p>
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
                    placeholder="Yangi toifa nomi"
                    required
                  />
                </div>
              )}

              <div className="form-field">
                <label>Rasm to'liq havolasi (Image URL) *</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... yoki to'g'ridan-to'g'ri rasm linki"
                  required
                />
                <small className="field-hint">
                  To'g'ridan-to'g'ri JPG, PNG, WebP havolasi (Unsplash, Pexels, Imgur yoki o'zingizning serveringiz)
                </small>
              </div>

              <div className="form-field">
                <label>Kichik rasm (Thumbnail URL - ixtiyoriy)</label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Kiritilmasa, asosiy rasm ishlatiladi"
                />
              </div>

              <div className="form-field">
                <label>Tavsif (Description)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rasm haqida qisqacha ma'lumot..."
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Teglar (vergul bilan ajrating)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="neon, city, 4k, dark"
                  />
                </div>
                <div className="form-field">
                  <label>Litsenziya</label>
                  <input
                    type="text"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    placeholder="Free for personal use"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Kenglik (Width px)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="2160"
                  />
                </div>
                <div className="form-field">
                  <label>Balandlik (Height px)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="3840"
                  />
                </div>
              </div>

              <div className="form-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  <span>Tanlangan rasm (Featured - Bosh sahifada yuqorida ko'rsatish)</span>
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

      {/* Tab 2: Manage Existing Wallpapers */}
      {activeTab === "manage" && (
        <div className="admin-manage-section">
          <div className="admin-manage-toolbar">
            <div className="admin-search-box">
              <Search size={16} />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Nomi, toifasi yoki tegi bo'yicha qidirish..."
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
                        className="action-icon-btn edit-btn"
                        onClick={() => setEditingWallpaper({ ...w })}
                        title="Tahrirlash"
                      >
                        <Edit2 size={15} />
                      </button>
                      <a
                        href={w.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="action-icon-btn view-btn"
                        title="Rasmni ochish"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button
                        className="action-icon-btn delete-btn"
                        onClick={() => handleDeleteWallpaper(w.id, w.title)}
                        title="O'chirish"
                        disabled={saving}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: JSONBin Configuration info */}
      {activeTab === "info" && (
        <div className="admin-info-section">
          <div className="admin-card">
            <div className="admin-card-head">
              <h2><Database size={18} /> JSONBin.io Konfiguratsiyasi va Ma'lumotlari</h2>
              <p>Loyiha fon rasmlari saqlanayotgan JSONBin ma'lumotlari:</p>
            </div>

            <div className="info-grid">
              <div className="info-tile">
                <span className="info-label">Bin ID</span>
                <code className="info-value">{JSONBIN_CONFIG.binId}</code>
              </div>
              <div className="info-tile">
                <span className="info-label">API Endpoint</span>
                <code className="info-value">{JSONBIN_CONFIG.baseUrl}/{JSONBIN_CONFIG.binId}</code>
              </div>
              <div className="info-tile">
                <span className="info-label">API Key</span>
                <code className="info-value">{JSONBIN_CONFIG.apiKey.substring(0, 14)}...</code>
              </div>
              <div className="info-tile">
                <span className="info-label">Ombordagi jami rasmlar soni</span>
                <span className="info-value highlight">{wallpapers.length} ta rasm</span>
              </div>
            </div>

            <div className="admin-json-viewer">
              <h3>Hozirgi JSON Bin ko'rinishi:</h3>
              <pre>
                {JSON.stringify({ wallpapers }, null, 2)}
              </pre>
            </div>
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
                <input
                  type="text"
                  value={editingWallpaper.category}
                  onChange={(e) =>
                    setEditingWallpaper({ ...editingWallpaper, category: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label>Tavsif</label>
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
