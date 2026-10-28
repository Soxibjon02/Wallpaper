import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Search,
  Download,
  Plus,
  LayoutGrid,
  Compass,
  FolderHeart,
  Settings,
  Menu,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  ImagePlus,
  MonitorSmartphone,
  Shuffle,
  Check,
  Sparkles,
  ShieldCheck,
  User,
  UploadCloud,
} from "lucide-react";
import { demoWallpapers, defaultCategories, type Wallpaper, type WallpaperCollection } from "@shared/index";
import { AdminPanel } from "./components/AdminPanel";
import { UserUploadModal } from "./components/UserUploadModal";
import { fetchCatalogueFromBin } from "./services/jsonbin";

type Section = "Home" | "Explore" | "Categories" | "My Collection" | "Downloads" | "Settings" | "Admin";
const sections: { name: Section; icon: typeof LayoutGrid }[] = [
  { name: "Home", icon: LayoutGrid },
  { name: "Explore", icon: Compass },
  { name: "Categories", icon: SlidersHorizontal },
  { name: "My Collection", icon: FolderHeart },
  { name: "Downloads", icon: Download },
  { name: "Settings", icon: Settings },
  { name: "Admin", icon: ShieldCheck },
];

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const id = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function App() {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>(demoWallpapers);
  const [categories, setCategories] = useState<string[]>(() => read("wallora:categories", defaultCategories));
  const [section, setSection] = useState<Section>("Home");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [favorites, setFavorites] = useState<string[]>(() => read("wallora:favorites", []));
  const [collections, setCollections] = useState<WallpaperCollection[]>(() =>
    read("wallora:collections", [
      { id: "favorites", name: "My Favorites", wallpaperIds: [], createdAt: new Date().toISOString() },
    ])
  );
  const [downloads, setDownloads] = useState<string[]>(() => read("wallora:downloads", []));
  const [selected, setSelected] = useState<Wallpaper | null>(null);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [slideshowCollection, setSlideshowCollection] = useState("favorites");
  const [interval, setIntervalValue] = useState("60");
  const [playMode, setPlayMode] = useState<"sequential" | "random">("sequential");
  const [slideshowActive, setSlideshowActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("wallora:favorites", JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem("wallora:collections", JSON.stringify(collections));
  }, [collections]);
  useEffect(() => {
    localStorage.setItem("wallora:downloads", JSON.stringify(downloads));
  }, [downloads]);
  useEffect(() => {
    localStorage.setItem("wallora:categories", JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem("wallora:slideshow", JSON.stringify({ slideshowCollection, interval, playMode }));
  }, [slideshowCollection, interval, playMode]);

  // Load cloud catalogue from JSONBin (both wallpapers and super-admin created categories)
  useEffect(() => {
    let cancelled = false;
    fetchCatalogueFromBin()
      .then((catalogue) => {
        if (!cancelled) {
          if (Array.isArray(catalogue.wallpapers) && catalogue.wallpapers.length) {
            setWallpapers(catalogue.wallpapers);
          }
          if (Array.isArray(catalogue.categories) && catalogue.categories.length) {
            setCategories(catalogue.categories);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load catalogue from JSONBin:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (notice) {
      const t = window.setTimeout(() => setNotice(""), 3200);
      return () => window.clearTimeout(t);
    }
  }, [notice]);

  const visible = useMemo(() => {
    let list = [...wallpapers];
    if (section === "My Collection") {
      if (
        activeCollection === "favorites" ||
        (!activeCollection && !collections.some((c) => c.id !== "favorites" && c.id === activeCollection))
      ) {
        list = list.filter(
          (w) => favorites.includes(w.id) || collections.find((c) => c.id === "favorites")?.wallpaperIds.includes(w.id)
        );
      } else if (activeCollection) {
        list = list.filter((w) => collections.find((c) => c.id === activeCollection)?.wallpaperIds.includes(w.id));
      } else {
        list = list.filter((w) => favorites.includes(w.id));
      }
    }
    if (section === "Downloads") list = list.filter((w) => downloads.includes(w.id));
    if (category !== "All" && (section === "Explore" || section === "Categories" || section === "Home")) {
      list = list.filter((w) => w.category === category);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((w) =>
        `${w.title} ${w.description ?? ""} ${w.category} ${w.authorName ?? ""} ${w.tags.join(" ")}`
          .toLowerCase()
          .includes(q)
      );
    }
    if (sort === "newest") list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    if (sort === "popular") list.sort((a, b) => Number(b.featured) - Number(a.featured));
    if (sort === "featured") list.sort((a, b) => Number(b.featured) - Number(a.featured));
    return list;
  }, [wallpapers, section, activeCollection, collections, favorites, downloads, category, query, sort]);

  function toggleFavorite(w: Wallpaper) {
    setFavorites((old) => (old.includes(w.id) ? old.filter((x) => x !== w.id) : [...old, w.id]));
    setNotice(favorites.includes(w.id) ? "Saralanganlardan o'chirildi" : "Saralanganlarga qo'shildi");
  }

  function addToCollection(w: Wallpaper, collectionId: string) {
    setCollections((old) =>
      old.map((c) =>
        c.id === collectionId
          ? { ...c, wallpaperIds: c.wallpaperIds.includes(w.id) ? c.wallpaperIds : [...c.wallpaperIds, w.id] }
          : c
      )
    );
    setNotice("To'plamga muvaffaqiyatli qo'shildi");
  }

  async function downloadWallpaper(w: Wallpaper) {
    try {
      const response = await fetch(w.imageUrl);
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wallora-${w.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDownloads((old) => (old.includes(w.id) ? old : [...old, w.id]));
      setNotice("Yuklab olish boshlandi");
    } catch {
      window.open(w.imageUrl, "_blank", "noopener,noreferrer");
      setNotice("Rasm ochildi — 'Save image as' orqali saqlang");
    }
  }

  function createCollection() {
    const name = newName.trim();
    if (!name) return;
    setCollections((old) => [...old, { id: id(), name, wallpaperIds: [], createdAt: new Date().toISOString() }]);
    setNewName("");
    setShowNewCollection(false);
    setNotice("To'plam yaratildi");
  }

  async function importImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Yaroqli rasm faylini tanlang");
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    const imported: Wallpaper = {
      id: `local-${id()}`,
      title: file.name.replace(/\.[^.]+$/, ""),
      description: "Qurilmangizdan yuklangan shaxsiy rasm",
      imageUrl,
      thumbnailUrl: imageUrl,
      category: "Shaxsiy",
      tags: ["imported"],
      width: 0,
      height: 0,
      license: "Personal image",
      authorName: "Siz (Mahalliy)",
    };
    setWallpapers((old) => [imported, ...old]);
    const target =
      activeCollection && activeCollection !== "favorites"
        ? activeCollection
        : collections.find((c) => c.id !== "favorites")?.id ?? "favorites";
    if (target === "favorites") setFavorites((old) => [...old, imported.id]);
    else addToCollection(imported, target);
    setNotice("Rasm brauzer sessiyasiga yuklandi");
    event.target.value = "";
  }

  const title =
    section === "Home"
      ? "Find your next wallpaper"
      : section === "Explore"
      ? "Explore wallpapers"
      : section === "Categories"
      ? "Browse categories"
      : section === "My Collection"
      ? "Your personal space"
      : section === "Downloads"
      ? "Your downloads"
      : section === "Admin"
      ? "Admin Control Panel"
      : "Preferences";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={21} />
          </div>
          <span>WALLORA</span>
          <button className="icon-button mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu">
            <X size={19} />
          </button>
        </div>

        <div className="side-label">WORKSPACE</div>
        <nav>
          {sections.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${section === item.name ? "nav-active" : ""}`}
              onClick={() => {
                setSection(item.name);
                setMobileMenu(false);
                setActiveCollection(null);
                if (item.name !== "Categories") setCategory("All");
              }}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
              {item.name === "My Collection" && <span className="nav-count">{collections.length}</span>}
              {item.name === "Admin" && (
                <span className="nav-count" style={{ background: "#2a371c", color: "#c4f56b" }}>
                  JSONBin
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="side-divider" />
        <div className="side-label side-label-row">
          <span>YOUR COLLECTIONS</span>
          <button className="tiny-icon" onClick={() => setShowNewCollection(true)} aria-label="Create collection">
            <Plus size={16} />
          </button>
        </div>
        <div className="collection-nav">
          {collections.map((c) => (
            <button
              key={c.id}
              className={`collection-link ${activeCollection === c.id ? "collection-active" : ""}`}
              onClick={() => {
                setSection("My Collection");
                setActiveCollection(c.id);
                setMobileMenu(false);
              }}
            >
              <span className="collection-dot" />
              <span className="collection-name">{c.name}</span>
              <span className="collection-total">{c.wallpaperIds.length}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="profile-orb">W</div>
          <div>
            <strong>Personal space</strong>
            <span>Stored on this device</span>
          </div>
          <span className="online-dot" />
        </div>
      </aside>

      {mobileMenu && <button className="scrim" onClick={() => setMobileMenu(false)} aria-label="Close navigation" />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileMenu(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            WALLORA <span>/</span> <strong>{section}</strong>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rasm nomi, toifa, muallif..."
                aria-label="Search wallpapers"
              />
              <kbd>⌘ K</kbd>
            </div>

            {/* Prominent Upload Button for EVERY User */}
            <button
              className="primary-button upload-header-btn"
              onClick={() => setShowUploadModal(true)}
              title="Har bir user o'z nomidan wallpaper joylashi mumkin"
            >
              <UploadCloud size={16} />
              <span>Wallpaper yuklash</span>
            </button>

            <button
              className={`outline-button small ${section === "Admin" ? "primary-button" : ""}`}
              onClick={() => setSection("Admin")}
            >
              <ShieldCheck size={14} /> Admin
            </button>
            <button className="avatar" title="Settings" onClick={() => setSection("Settings")}>
              W
            </button>
          </div>
        </header>

        <div className="page-content">
          {section === "Settings" ? (
            <SettingsPage
              interval={interval}
              setIntervalValue={setIntervalValue}
              slideshowCollection={slideshowCollection}
              setSlideshowCollection={setSlideshowCollection}
              collections={collections}
              playMode={playMode}
              setPlayMode={setPlayMode}
              active={slideshowActive}
              setActive={setSlideshowActive}
              notice={setNotice}
            />
          ) : section === "Admin" ? (
            <AdminPanel
              wallpapers={wallpapers}
              categories={categories}
              onWallpapersUpdated={setWallpapers}
              onCategoriesUpdated={setCategories}
              onNotice={setNotice}
            />
          ) : (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" />
                    {section === "Home"
                      ? "CURATED FOR YOU"
                      : section === "My Collection"
                      ? "YOUR PERSONAL LIBRARY"
                      : section === "Downloads"
                      ? "AVAILABLE OFFLINE"
                      : "DISCOVER SOMETHING NEW"}
                  </div>
                  <h1>
                    {title}
                    <span className="heading-period">.</span>
                  </h1>
                  <p>
                    {section === "Home"
                      ? "Har bir foydalanuvchi o'z nomidan wallpaper joylashi va tomosha qilishi mumkin."
                      : section === "My Collection"
                      ? "Siz saralab saqlagan barcha fon rasmlari bir joyda jamlangan."
                      : section === "Downloads"
                      ? "Yuklab olingan rasmlar shu yerda saqlanadi."
                      : "Turli toifalardagi eng sara fon rasmlari to'plami."}
                  </p>
                </div>

                <div className="heading-action-group">
                  <button className="primary-button" onClick={() => setShowUploadModal(true)}>
                    <UploadCloud size={16} /> Wallpaper yuklash
                  </button>
                  <button className="outline-button" onClick={() => fileInput.current?.click()}>
                    <ImagePlus size={16} /> Qurilmadan yuklash
                  </button>
                  <input ref={fileInput} type="file" accept="image/*" hidden onChange={importImage} />
                </div>
              </section>

              {section === "Home" && (
                <section className="hero-banner">
                  <img
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=90"
                    alt="Snow-covered mountain peaks"
                  />
                  <div className="hero-shade" />
                  <div className="hero-content">
                    <div className="hero-tag">
                      <Sparkles size={13} /> OCHIQ PLATFORMA
                    </div>
                    <h2>
                      O'z fon rasmingizni<br />
                      hamjamiyatga ulashing.
                    </h2>
                    <p>
                      Istalgan rasm havolasini kiriting, izoh qoldiring va o'z nomingizdan yuklang. Super admin yaratgan toifalardan tanlang!
                    </p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button className="hero-button" onClick={() => setShowUploadModal(true)}>
                        <UploadCloud size={16} /> Wallpaper yuklash
                      </button>
                      <button
                        className="hero-button outline"
                        onClick={() => {
                          setSection("Explore");
                          setCategory("All");
                        }}
                      >
                        Barcha rasmlar <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="hero-pagination">
                    <span className="pagination-current" /> <span /> <span />
                  </div>
                </section>
              )}

              {(section === "Home" || section === "Explore" || section === "Categories") && (
                <div className="filter-row">
                  <div className="category-chips">
                    {["All", ...categories].map((c) => (
                      <button
                        key={c}
                        className={`chip ${category === c ? "chip-active" : ""}`}
                        onClick={() => setCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <label className="sort-select">
                    <SlidersHorizontal size={15} />
                    <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort wallpapers">
                      <option value="featured">Featured</option>
                      <option value="newest">Newest</option>
                      <option value="popular">Popular</option>
                    </select>
                  </label>
                </div>
              )}

              {section === "Categories" && (
                <div className="category-grid">
                  {categories.map((c) => (
                    <button key={c} className="category-tile" onClick={() => setCategory(c)}>
                      <span>{c}</span>
                      <small>{wallpapers.filter((w) => w.category === c).length} wallpapers</small>
                    </button>
                  ))}
                </div>
              )}

              {section === "My Collection" && (
                <div className="collection-toolbar">
                  <div>
                    <strong>
                      {activeCollection ? collections.find((c) => c.id === activeCollection)?.name : "All collections"}
                    </strong>
                    <span>{visible.length} wallpapers</span>
                  </div>
                  <div className="toolbar-actions">
                    <button className="outline-button small" onClick={() => setShowNewCollection(true)}>
                      <Plus size={15} /> New collection
                    </button>
                    <button className="outline-button small" onClick={() => fileInput.current?.click()}>
                      <ImagePlus size={15} /> Import
                    </button>
                  </div>
                </div>
              )}

              {section === "Downloads" && (
                <div className="collection-toolbar">
                  <div>
                    <strong>{visible.length} downloaded wallpapers</strong>
                    <span>Downloads are tracked on this browser</span>
                  </div>
                </div>
              )}

              <div className="gallery-heading">
                <div>
                  <h2>
                    {section === "Home"
                      ? "Trending wallpapers"
                      : section === "My Collection"
                      ? "Saved wallpapers"
                      : section === "Downloads"
                      ? "Downloaded images"
                      : "All wallpapers"}
                  </h2>
                  <span>{visible.length} results</span>
                </div>
                <button className="view-toggle" title="Grid view">
                  <LayoutGrid size={17} />
                </button>
              </div>

              {visible.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <FolderHeart size={25} />
                  </div>
                  <h3>Hozircha hech narsa yo'q</h3>
                  <p>
                    {section === "Downloads"
                      ? "Fon rasmini yuklab oling va u shu yerda paydo bo'ladi."
                      : "Ushbu toifada rasm topilmadi yoki birinchi bo'lib siz fon rasmi yuklang!"}
                  </p>
                  <button className="primary-button" onClick={() => setShowUploadModal(true)}>
                    <UploadCloud size={16} /> Birinchi rasmni yuklash
                  </button>
                </div>
              ) : (
                <div className="wallpaper-grid">
                  {visible.map((w, i) => (
                    <article className={`wallpaper-card card-${i % 4}`} key={w.id}>
                      <button
                        className="wallpaper-image"
                        onClick={() => setSelected(w)}
                        aria-label={`Preview ${w.title}`}
                      >
                        <img src={w.thumbnailUrl || w.imageUrl} loading="lazy" alt={w.title} />
                        <span className="image-overlay" />
                        <span className="image-category">{w.category}</span>
                        {w.authorName && (
                          <span className="image-author-pill">
                            <User size={10} /> {w.authorName}
                          </span>
                        )}
                        <span className="quick-view">
                          Ko'rish <ArrowUpRight size={15} />
                        </span>
                      </button>
                      <div className="card-meta">
                        <div className="card-copy">
                          <h3>{w.title}</h3>
                          <div className="card-author-line">
                            <span className="card-author-badge">
                              <User size={11} /> {w.authorName || "Wallora"}
                            </span>
                            <span className="card-dim">
                              {w.width && w.height ? `${w.width}×${w.height}` : (w.tags[0] || "")}
                            </span>
                          </div>
                        </div>
                        <button
                          className={`favorite-button ${favorites.includes(w.id) ? "favorited" : ""}`}
                          onClick={() => toggleFavorite(w)}
                          aria-label={favorites.includes(w.id) ? "Remove favorite" : "Add favorite"}
                        >
                          <Heart size={18} fill={favorites.includes(w.id) ? "currentColor" : "none"} />
                        </button>
                        <button
                          className="download-mini"
                          onClick={() => void downloadWallpaper(w)}
                          aria-label="Download wallpaper"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <footer className="page-footer">
                <span>© 2026 WALLORA — Hamjamiyat fon rasmlari platformasi</span>
                <span>
                  Make your screen yours <span className="footer-heart">♥</span>
                </span>
                <span>{wallpapers.length} wallpapers in library</span>
              </footer>
            </>
          )}
        </div>
      </main>

      {/* Detail Modal with Author and Caption Info */}
      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="detail-modal">
            <button className="modal-close icon-button" onClick={() => setSelected(null)} aria-label="Close preview">
              <X size={20} />
            </button>
            <div className="detail-image">
              <img src={selected.imageUrl} alt={selected.title} />
            </div>
            <div className="detail-info">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                {selected.category.toUpperCase()}
              </div>
              <h2>{selected.title}</h2>

              {/* Author badge box showing who uploaded this wallpaper */}
              <div className="detail-author-box">
                <div className="detail-author-avatar">
                  {(selected.authorName || "W")[0].toUpperCase()}
                </div>
                <div className="detail-author-text">
                  <span className="detail-author-label">YUKLOVCHI / MUALLIF</span>
                  <strong className="detail-author-name">
                    {selected.authorName || "Wallora Hamjamiyati"}
                  </strong>
                </div>
                {selected.createdAt && (
                  <span className="detail-author-date">
                    {new Date(selected.createdAt).toLocaleDateString("uz-UZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              {/* Description / Rasm izohi */}
              <div className="detail-caption-box">
                <span className="detail-caption-label">RASM IZOHI:</span>
                <p>
                  {selected.description ||
                    "Ushbu fon rasmi foydalanuvchi tomonidan mualliflik huquqi asosida taqdim etildi."}
                </p>
              </div>

              <div className="detail-specs">
                <div>
                  <span>RESOLUTION</span>
                  <strong>
                    {selected.width && selected.height ? `${selected.width} × ${selected.height}` : "Original"}
                  </strong>
                </div>
                <div>
                  <span>KATEGORIYA</span>
                  <strong>{selected.category}</strong>
                </div>
                <div>
                  <span>ORIENTATION</span>
                  <strong>{(selected.height ?? 0) > (selected.width ?? 0) ? "Portrait" : "Landscape"}</strong>
                </div>
              </div>

              {selected.tags && selected.tags.length > 0 && (
                <div className="tag-row">
                  {selected.tags.map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                </div>
              )}

              <div className="detail-actions">
                <button className="primary-button" onClick={() => void downloadWallpaper(selected)}>
                  <Download size={17} /> Download
                </button>
                <button
                  className={`outline-button ${favorites.includes(selected.id) ? "favorited" : ""}`}
                  onClick={() => toggleFavorite(selected)}
                >
                  <Heart size={17} fill={favorites.includes(selected.id) ? "currentColor" : "none"} />
                  {favorites.includes(selected.id) ? "Saved" : "Favorite"}
                </button>
                <select
                  className="collection-select"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) addToCollection(selected, e.target.value);
                    e.target.value = "";
                  }}
                  aria-label="Add to collection"
                >
                  <option value="" disabled>
                    + Collection
                  </option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="platform-note">
                <MonitorSmartphone size={17} />
                <span>
                  Rasmni yuklab olib, qurilmangizning "Fon rasmi" (Wallpaper) sozlamalaridan bosh yoki qulflangan ekran rasmi sifatida o'rnating.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Wallpaper Upload Modal */}
      <UserUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        categories={categories}
        wallpapers={wallpapers}
        onWallpaperUploaded={(newWp) => {
          setWallpapers((old) => [newWp, ...old]);
        }}
        onNotice={setNotice}
      />

      {/* New Collection Modal */}
      {showNewCollection && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowNewCollection(false);
          }}
        >
          <div className="small-modal">
            <button
              className="modal-close icon-button"
              onClick={() => setShowNewCollection(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              PERSONAL LIBRARY
            </div>
            <h2>Create collection</h2>
            <p>Give your wallpapers a place to belong.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCollection();
              }}
            >
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Dream Cars"
                maxLength={40}
              />
              <button className="primary-button" type="submit" disabled={!newName.trim()}>
                <Plus size={16} /> Create collection
              </button>
            </form>
          </div>
        </div>
      )}

      {notice && (
        <div className="toast">
          <Check size={16} />
          {notice}
        </div>
      )}
    </div>
  );
}

function SettingsPage({
  interval,
  setIntervalValue,
  slideshowCollection,
  setSlideshowCollection,
  collections,
  playMode,
  setPlayMode,
  active,
  setActive,
  notice,
}: {
  interval: string;
  setIntervalValue: (v: string) => void;
  slideshowCollection: string;
  setSlideshowCollection: (v: string) => void;
  collections: WallpaperCollection[];
  playMode: "sequential" | "random";
  setPlayMode: (v: "sequential" | "random") => void;
  active: boolean;
  setActive: (v: boolean) => void;
  notice: (v: string) => void;
}) {
  const intervals = [
    ["60", "1 minute"],
    ["300", "5 minutes"],
    ["900", "15 minutes"],
    ["1800", "30 minutes"],
    ["3600", "1 hour"],
    ["21600", "6 hours"],
    ["43200", "12 hours"],
    ["86400", "24 hours"],
  ];
  return (
    <section className="settings-page">
      <div className="eyebrow">
        <span className="eyebrow-line" />
        PREFERENCES
      </div>
      <h1>
        Settings<span className="heading-period">.</span>
      </h1>
      <p className="settings-intro">Tune WALLORA to fit your screens and your habits.</p>
      <div className="settings-card">
        <div className="settings-card-heading">
          <div>
            <h2>
              <Shuffle size={18} /> Automatic slideshow
            </h2>
            <p>Choose a collection and rotation preference for supported platforms.</p>
          </div>
          <span className={`status-pill ${active ? "status-on" : ""}`}>
            <span />
            {active ? "Configured" : "Inactive"}
          </span>
        </div>
        <div className="setting-field">
          <label>Source collection</label>
          <select value={slideshowCollection} onChange={(e) => setSlideshowCollection(e.target.value)}>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-field">
          <label>Change wallpaper every</label>
          <select value={interval} onChange={(e) => setIntervalValue(e.target.value)}>
            {intervals.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="setting-field">
          <label>Playback mode</label>
          <div className="mode-toggle">
            <button className={playMode === "sequential" ? "mode-active" : ""} onClick={() => setPlayMode("sequential")}>
              Sequential
            </button>
            <button className={playMode === "random" ? "mode-active" : ""} onClick={() => setPlayMode("random")}>
              Random
            </button>
          </div>
        </div>
        <div className="settings-warning">
          <MonitorSmartphone size={18} />
          <div>
            <strong>Platform capability matters</strong>
            <p>
              This web app cannot change your system wallpaper in the background. Android's WorkManager has a 15-minute
              minimum and inexact timing. One- and five-minute schedules cannot be guaranteed. iOS does not allow third-party
              apps to autonomously rotate Lock Screen wallpaper.
            </p>
          </div>
        </div>
        <button
          className="primary-button settings-main-button"
          onClick={() => {
            setActive(false);
            notice("Saved preferences. Native scheduling requires the Android app.");
          }}
        >
          <Check size={16} /> Save preferences
        </button>
        <div className="settings-divider" />
        <div className="settings-card-heading">
          <div>
            <h2>
              <MonitorSmartphone size={18} /> Application
            </h2>
            <p>Local-first storage with cloud sync.</p>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <strong>Personal collections</strong>
            <span>Stored in this browser's local storage</span>
          </div>
          <span className="status-pill status-on">Enabled</span>
        </div>
        <div className="settings-row">
          <div>
            <strong>Cloud Catalogue & JSONBin</strong>
            <span>Wallpapers va toifalar real-time sinxronlanadi</span>
          </div>
          <span className="status-pill status-on">Connected</span>
        </div>
      </div>
    </section>
  );
}
