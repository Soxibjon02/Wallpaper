import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Search, Download, Plus, LayoutGrid, Compass, FolderHeart, Settings, Menu, X, SlidersHorizontal, ArrowUpRight, ImagePlus, MonitorSmartphone, Shuffle, Check, Sparkles, ShieldCheck } from "lucide-react";
import { demoWallpapers, type Wallpaper, type WallpaperCollection } from "@shared/index";
import { AdminPanel } from "./components/AdminPanel";
import { fetchWallpapersFromBin } from "./services/jsonbin";

type Section = "Home" | "Explore" | "Categories" | "My Collection" | "Downloads" | "Settings" | "Admin";
const sections: {name: Section; icon: typeof LayoutGrid}[] = [
  {name:"Home",icon:LayoutGrid},{name:"Explore",icon:Compass},{name:"Categories",icon:SlidersHorizontal},
  {name:"My Collection",icon:FolderHeart},{name:"Downloads",icon:Download},{name:"Settings",icon:Settings},
  {name:"Admin",icon:ShieldCheck}
];
const categories = ["All","Nature","Landscapes","Ocean","Cars","Architecture","Space","AMOLED","Cyberpunk","Anime","Abstract","Minimal"];
const read = <T,>(key:string, fallback:T):T => { try { const v=localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } };
const id = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function App() {
  const [wallpapers,setWallpapers] = useState<Wallpaper[]>(demoWallpapers);
  const [section,setSection] = useState<Section>("Home");
  const [query,setQuery] = useState("");
  const [category,setCategory] = useState("All");
  const [sort,setSort] = useState("featured");
  const [favorites,setFavorites] = useState<string[]>(()=>read("wallora:favorites",[]));
  const [collections,setCollections] = useState<WallpaperCollection[]>(()=>read("wallora:collections",[{id:"favorites",name:"My Favorites",wallpaperIds:[],createdAt:new Date().toISOString()}]));
  const [downloads,setDownloads] = useState<string[]>(()=>read("wallora:downloads",[]));
  const [selected,setSelected] = useState<Wallpaper|null>(null);
  const [activeCollection,setActiveCollection] = useState<string|null>(null);
  const [notice,setNotice] = useState("");
  const [mobileMenu,setMobileMenu] = useState(false);
  const [showNewCollection,setShowNewCollection] = useState(false);
  const [newName,setNewName] = useState("");
  const [slideshowCollection,setSlideshowCollection] = useState("favorites");
  const [interval,setIntervalValue] = useState("60");
  const [playMode,setPlayMode] = useState<"sequential"|"random">("sequential");
  const [slideshowActive,setSlideshowActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(()=>{ localStorage.setItem("wallora:favorites",JSON.stringify(favorites)); },[favorites]);
  useEffect(()=>{ localStorage.setItem("wallora:collections",JSON.stringify(collections)); },[collections]);
  useEffect(()=>{ localStorage.setItem("wallora:downloads",JSON.stringify(downloads)); },[downloads]);
  useEffect(()=>{ localStorage.setItem("wallora:slideshow",JSON.stringify({slideshowCollection,interval,playMode})); },[slideshowCollection,interval,playMode]);
  useEffect(()=>{
    let cancelled=false;
    // Load from JSONBin remote catalogue
    fetchWallpapersFromBin()
      .then(data => {
        if(!cancelled && Array.isArray(data) && data.length) {
          setWallpapers(data);
        }
      })
      .catch(()=>{});
    return ()=>{cancelled=true;};
  },[]);
  useEffect(()=>{ if(notice){const t=window.setTimeout(()=>setNotice(""),2800);return()=>window.clearTimeout(t);} },[notice]);

  const visible = useMemo(()=>{
    let list=[...wallpapers];
    if(section==="My Collection"){
      if(activeCollection==="favorites" || (!activeCollection && !collections.some(c=>c.id!=="favorites" && c.id===activeCollection))) {
        list=list.filter(w=>favorites.includes(w.id) || collections.find(c=>c.id==="favorites")?.wallpaperIds.includes(w.id));
      } else if(activeCollection) list=list.filter(w=>collections.find(c=>c.id===activeCollection)?.wallpaperIds.includes(w.id));
      else list=list.filter(w=>favorites.includes(w.id));
    }
    if(section==="Downloads") list=list.filter(w=>downloads.includes(w.id));
    if(category!=="All" && (section==="Explore" || section==="Categories" || section==="Home")) list=list.filter(w=>w.category===category);
    const q=query.trim().toLowerCase();
    if(q) list=list.filter(w=>`${w.title} ${w.description??""} ${w.category} ${w.tags.join(" ")}`.toLowerCase().includes(q));
    if(sort==="newest") list.sort((a,b)=>(b.createdAt??"").localeCompare(a.createdAt??""));
    if(sort==="popular") list.sort((a,b)=>Number(b.featured)-Number(a.featured));
    if(sort==="featured") list.sort((a,b)=>Number(b.featured)-Number(a.featured));
    return list;
  },[wallpapers,section,activeCollection,collections,favorites,downloads,category,query,sort]);

  function toggleFavorite(w:Wallpaper) {
    setFavorites(old=>old.includes(w.id)?old.filter(x=>x!==w.id):[...old,w.id]);
    setNotice(favorites.includes(w.id)?"Removed from favorites":"Added to favorites");
  }
  function addToCollection(w:Wallpaper, collectionId:string) {
    setCollections(old=>old.map(c=>c.id===collectionId?{...c,wallpaperIds:c.wallpaperIds.includes(w.id)?c.wallpaperIds:[...c.wallpaperIds,w.id]}:c));
    setNotice("Added to collection");
  }
  async function downloadWallpaper(w:Wallpaper) {
    try {
      const response=await fetch(w.imageUrl);
      if(!response.ok) throw new Error("download failed");
      const blob=await response.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download=`wallora-${w.id}.jpg`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      setDownloads(old=>old.includes(w.id)?old:[...old,w.id]);setNotice("Download started");
    } catch { window.open(w.imageUrl,"_blank","noopener,noreferrer"); setNotice("Opened original image — use Save image"); }
  }
  function createCollection() {
    const name=newName.trim();if(!name)return;
    setCollections(old=>[...old,{id:id(),name,wallpaperIds:[],createdAt:new Date().toISOString()}]);
    setNewName("");setShowNewCollection(false);setNotice("Collection created");
  }
  async function importImage(event:React.ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0];if(!file)return;
    if(!file.type.startsWith("image/")){setNotice("Choose a valid image file");return;}
    const imageUrl=URL.createObjectURL(file);
    const imported:Wallpaper={id:`local-${id()}`,title:file.name.replace(/\.[^.]+$/,""),description:"Imported from your device",imageUrl,thumbnailUrl:imageUrl,category:"My Images",tags:["imported"],width:0,height:0,license:"Personal image"};
    setWallpapers(old=>[imported,...old]);
    const target=activeCollection && activeCollection!=="favorites"?activeCollection:(collections.find(c=>c.id!=="favorites")?.id ?? "favorites");
    if(target==="favorites") setFavorites(old=>[...old,imported.id]); else addToCollection(imported,target);
    setNotice("Image imported for this browser session");
    event.target.value="";
  }
  const title = section==="Home"?"Find your next wallpaper":section==="Explore"?"Explore wallpapers":section==="Categories"?"Browse categories":section==="My Collection"?"Your personal space":section==="Downloads"?"Your downloads":section==="Admin"?"Admin Control Panel":"Preferences";

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu?"sidebar-open":""}`}>
      <div className="brand"><div className="brand-mark"><Sparkles size={21}/></div><span>WALLORA</span><button className="icon-button mobile-close" onClick={()=>setMobileMenu(false)} aria-label="Close menu"><X size={19}/></button></div>
      <div className="side-label">WORKSPACE</div>
      <nav>{sections.map(item=><button key={item.name} className={`nav-item ${section===item.name?"nav-active":""}`} onClick={()=>{setSection(item.name);setMobileMenu(false);setActiveCollection(null);if(item.name!=="Categories")setCategory("All");}}><item.icon size={18}/><span>{item.name}</span>{item.name==="My Collection"&&<span className="nav-count">{collections.length}</span>}{item.name==="Admin"&&<span className="nav-count" style={{background: "#2a371c", color: "#c4f56b"}}>JSONBin</span>}</button>)}</nav>
      <div className="side-divider"/>
      <div className="side-label side-label-row"><span>YOUR COLLECTIONS</span><button className="tiny-icon" onClick={()=>setShowNewCollection(true)} aria-label="Create collection"><Plus size={16}/></button></div>
      <div className="collection-nav">
        {collections.map(c=><button key={c.id} className={`collection-link ${activeCollection===c.id?"collection-active":""}`} onClick={()=>{setSection("My Collection");setActiveCollection(c.id);setMobileMenu(false);}}><span className="collection-dot"/><span className="collection-name">{c.name}</span><span className="collection-total">{c.wallpaperIds.length}</span></button>)}
      </div>
      <div className="sidebar-bottom"><div className="profile-orb">W</div><div><strong>Personal space</strong><span>Stored on this device</span></div><span className="online-dot"/></div>
    </aside>
    {mobileMenu&&<button className="scrim" onClick={()=>setMobileMenu(false)} aria-label="Close navigation"/>}
    <main className="main-area">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={()=>setMobileMenu(true)} aria-label="Open menu"><Menu size={20}/></button>
        <div className="breadcrumbs">WALLORA <span>/</span> <strong>{section}</strong></div>
        <div className="top-actions">
          <div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search wallpapers..." aria-label="Search wallpapers"/><kbd>⌘ K</kbd></div>
          <button className={`outline-button small ${section==="Admin"?"primary-button":""}`} onClick={()=>setSection("Admin")}>
            <ShieldCheck size={14}/> Admin
          </button>
          <button className="avatar" title="Settings" onClick={()=>setSection("Settings")}>W</button>
        </div>
      </header>
      <div className="page-content">
        {section==="Settings"?<SettingsPage interval={interval} setIntervalValue={setIntervalValue} slideshowCollection={slideshowCollection} setSlideshowCollection={setSlideshowCollection} collections={collections} playMode={playMode} setPlayMode={setPlayMode} active={slideshowActive} setActive={setSlideshowActive} notice={setNotice}/>:section==="Admin"?<AdminPanel wallpapers={wallpapers} onWallpapersUpdated={setWallpapers} onNotice={setNotice}/>:<>
          <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>{section==="Home"?"CURATED FOR YOU":section==="My Collection"?"YOUR PERSONAL LIBRARY":section==="Downloads"?"AVAILABLE OFFLINE":"DISCOVER SOMETHING NEW"}</div><h1>{title}<span className="heading-period">.</span></h1><p>{section==="Home"?"A little inspiration for every screen in your life.":section==="My Collection"?"All the images you have saved, gathered in one place.":section==="Downloads"?"Your saved wallpapers, ready when you are.":"Explore handpicked visuals for your screen."}</p></div><button className="outline-button" onClick={()=>fileInput.current?.click()}><ImagePlus size={17}/> Import image</button><input ref={fileInput} type="file" accept="image/*" hidden onChange={importImage}/></section>
          {section==="Home"&&<section className="hero-banner"><img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=90" alt="Snow-covered mountain peaks"/><div className="hero-shade"/><div className="hero-content"><div className="hero-tag"><Sparkles size={13}/> EDITOR'S PICK</div><h2>Find beauty<br/>in every pixel.</h2><p>Thoughtfully chosen wallpapers to make your screen feel like yours.</p><button className="hero-button" onClick={()=>{setSection("Explore");setCategory("All");}}>Explore collection <ArrowUpRight size={16}/></button></div><div className="hero-pagination"><span className="pagination-current"/> <span/> <span/></div></section>}
          {(section==="Home"||section==="Explore"||section==="Categories")&&<div className="filter-row"><div className="category-chips">{categories.map(c=><button key={c} className={`chip ${category===c?"chip-active":""}`} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="sort-select"><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort wallpapers"><option value="featured">Featured</option><option value="newest">Newest</option><option value="popular">Popular</option></select></label></div>}
          {section==="Categories"&&<div className="category-grid">{categories.filter(c=>c!=="All").map(c=><button key={c} className="category-tile" onClick={()=>setCategory(c)}><span>{c}</span><small>{wallpapers.filter(w=>w.category===c).length} wallpapers</small></button>)}</div>}
          {section==="My Collection"&&<div className="collection-toolbar"><div><strong>{activeCollection?collections.find(c=>c.id===activeCollection)?.name:"All collections"}</strong><span>{visible.length} wallpapers</span></div><div className="toolbar-actions"><button className="outline-button small" onClick={()=>setShowNewCollection(true)}><Plus size={15}/> New collection</button><button className="outline-button small" onClick={()=>fileInput.current?.click()}><ImagePlus size={15}/> Import</button></div></div>}
          {section==="Downloads"&&<div className="collection-toolbar"><div><strong>{visible.length} downloaded wallpapers</strong><span>Downloads are tracked on this browser</span></div></div>}
          <div className="gallery-heading"><div><h2>{section==="Home"?"Trending wallpapers":section==="My Collection"?"Saved wallpapers":section==="Downloads"?"Downloaded images":"All wallpapers"}</h2><span>{visible.length} results</span></div><button className="view-toggle" title="Grid view"><LayoutGrid size={17}/></button></div>
          {visible.length===0?<div className="empty-state"><div className="empty-icon"><FolderHeart size={25}/></div><h3>Nothing here yet</h3><p>{section==="Downloads"?"Download a wallpaper and it will appear here.":"Try another search, or add a wallpaper to this collection."}</p><button className="outline-button" onClick={()=>{setSection("Explore");setCategory("All");setQuery("");}}>Explore wallpapers</button></div>:<div className="wallpaper-grid">{visible.map((w,i)=><article className={`wallpaper-card card-${i%4}`} key={w.id}><button className="wallpaper-image" onClick={()=>setSelected(w)} aria-label={`Preview ${w.title}`}><img src={w.thumbnailUrl||w.imageUrl} loading="lazy" alt={w.title}/><span className="image-overlay"/><span className="image-category">{w.category}</span><span className="quick-view">View wallpaper <ArrowUpRight size={15}/></span></button><div className="card-meta"><div className="card-copy"><h3>{w.title}</h3><span>{w.width&&w.height?`${w.width} × ${w.height}`:w.tags.slice(0,2).join(" · ")}</span></div><button className={`favorite-button ${favorites.includes(w.id)?"favorited":""}`} onClick={()=>toggleFavorite(w)} aria-label={favorites.includes(w.id)?"Remove favorite":"Add favorite"}><Heart size={18} fill={favorites.includes(w.id)?"currentColor":"none"}/></button><button className="download-mini" onClick={()=>void downloadWallpaper(w)} aria-label="Download wallpaper"><Download size={16}/></button></div></article>)}</div>}
          <footer className="page-footer"><span>© 2026 WALLORA</span><span>Make your screen yours <span className="footer-heart">♥</span></span><span>{wallpapers.length} wallpapers in library</span></footer>
        </>}
      </div>
    </main>
    {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><div className="detail-modal"><button className="modal-close icon-button" onClick={()=>setSelected(null)} aria-label="Close preview"><X size={20}/></button><div className="detail-image"><img src={selected.imageUrl} alt={selected.title}/></div><div className="detail-info"><div className="eyebrow"><span className="eyebrow-line"/>{selected.category.toUpperCase()}</div><h2>{selected.title}</h2><p>{selected.description||"A carefully selected wallpaper for your device."}</p><div className="detail-specs"><div><span>RESOLUTION</span><strong>{selected.width&&selected.height?`${selected.width} × ${selected.height}`:"Original"}</strong></div><div><span>FORMAT</span><strong>Image</strong></div><div><span>ORIENTATION</span><strong>{(selected.height??0)> (selected.width??0)?"Portrait":"Original"}</strong></div></div><div className="tag-row">{selected.tags.map(t=><span key={t}>#{t}</span>)}</div><div className="detail-actions"><button className="primary-button" onClick={()=>void downloadWallpaper(selected)}><Download size={17}/> Download</button><button className={`outline-button ${favorites.includes(selected.id)?"favorited":""}`} onClick={()=>toggleFavorite(selected)}><Heart size={17} fill={favorites.includes(selected.id)?"currentColor":"none"}/>{favorites.includes(selected.id)?"Saved":"Favorite"}</button><select className="collection-select" defaultValue="" onChange={e=>{if(e.target.value)addToCollection(selected,e.target.value);e.target.value="";}} aria-label="Add to collection"><option value="" disabled>+ Collection</option>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="platform-note"><MonitorSmartphone size={17}/><span>To set this as a phone wallpaper, download it and use your device's wallpaper settings. Native Android setting is available in the Android app.</span></div></div></div></div>}
    {showNewCollection&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowNewCollection(false);}}><div className="small-modal"><button className="modal-close icon-button" onClick={()=>setShowNewCollection(false)} aria-label="Close"><X size={19}/></button><div className="eyebrow"><span className="eyebrow-line"/>PERSONAL LIBRARY</div><h2>Create collection</h2><p>Give your wallpapers a place to belong.</p><form onSubmit={e=>{e.preventDefault();createCollection();}}><input autoFocus value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Dream Cars" maxLength={40}/><button className="primary-button" type="submit" disabled={!newName.trim()}><Plus size={16}/> Create collection</button></form></div></div>}
    {notice&&<div className="toast"><Check size={16}/>{notice}</div>}
  </div>;
}

function SettingsPage({interval,setIntervalValue,slideshowCollection,setSlideshowCollection,collections,playMode,setPlayMode,active,setActive,notice}:{interval:string;setIntervalValue:(v:string)=>void;slideshowCollection:string;setSlideshowCollection:(v:string)=>void;collections:WallpaperCollection[];playMode:"sequential"|"random";setPlayMode:(v:"sequential"|"random")=>void;active:boolean;setActive:(v:boolean)=>void;notice:(v:string)=>void}) {
  const intervals=[["60","1 minute"],["300","5 minutes"],["900","15 minutes"],["1800","30 minutes"],["3600","1 hour"],["21600","6 hours"],["43200","12 hours"],["86400","24 hours"]];
  return <section className="settings-page"><div className="eyebrow"><span className="eyebrow-line"/>PREFERENCES</div><h1>Settings<span className="heading-period">.</span></h1><p className="settings-intro">Tune WALLORA to fit your screens and your habits.</p><div className="settings-card"><div className="settings-card-heading"><div><h2><Shuffle size={18}/> Automatic slideshow</h2><p>Choose a collection and rotation preference for supported platforms.</p></div><span className={`status-pill ${active?"status-on":""}`}><span/>{active?"Configured":"Inactive"}</span></div><div className="setting-field"><label>Source collection</label><select value={slideshowCollection} onChange={e=>setSlideshowCollection(e.target.value)}>{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="setting-field"><label>Change wallpaper every</label><select value={interval} onChange={e=>setIntervalValue(e.target.value)}>{intervals.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div><div className="setting-field"><label>Playback mode</label><div className="mode-toggle"><button className={playMode==="sequential"?"mode-active":""} onClick={()=>setPlayMode("sequential")}>Sequential</button><button className={playMode==="random"?"mode-active":""} onClick={()=>setPlayMode("random")}>Random</button></div></div><div className="settings-warning"><MonitorSmartphone size={18}/><div><strong>Platform capability matters</strong><p>This web app cannot change your system wallpaper in the background. Android's WorkManager has a 15-minute minimum and inexact timing. One- and five-minute schedules cannot be guaranteed. iOS does not allow third-party apps to autonomously rotate Lock Screen wallpaper.</p></div></div><button className="primary-button settings-main-button" onClick={()=>{setActive(false);notice("Saved preferences. Native scheduling requires the Android app.");}}><Check size={16}/> Save preferences</button><div className="settings-divider"/><div className="settings-card-heading"><div><h2><MonitorSmartphone size={18}/> Application</h2><p>Local-first storage. No account is required.</p></div></div><div className="settings-row"><div><strong>Personal collections</strong><span>Stored in this browser's local storage</span></div><span className="status-pill status-on">Enabled</span></div><div className="settings-row"><div><strong>Remote catalogue</strong><span>Uses secure server proxy when configured</span></div><span className="status-pill">Optional</span></div></div></section>;
}
