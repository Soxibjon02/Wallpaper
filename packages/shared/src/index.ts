export type Wallpaper = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: string;
  tags: string[];
  width?: number;
  height?: number;
  featured?: boolean;
  license?: string;
  createdAt?: string;
  authorName?: string;
  authorAvatar?: string;
  userId?: string;
};

export type WallpaperCollection = {
  id: string;
  name: string;
  wallpaperIds: string[];
  createdAt: string;
};

export const defaultCategories: string[] = [
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
];

export const demoWallpapers: Wallpaper[] = [
  { id: "mountain-serenity", title: "Mountain Serenity", description: "Layered peaks under a quiet morning sky.", imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85", thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=75", category: "Nature", tags: ["mountain", "landscape", "mist"], width: 2160, height: 3840, featured: true, license: "Unsplash license", authorName: "Wallora Curators" },
  { id: "ocean-blue", title: "Ocean Blue", description: "Deep blue ocean texture from above.", imageUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1800&q=85", thumbnailUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=700&q=75", category: "Ocean", tags: ["ocean", "blue", "water"], width: 2160, height: 3840, license: "Unsplash license", authorName: "Wallora Curators" },
  { id: "night-drive", title: "Night Drive", description: "A cinematic road and dramatic light.", imageUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=85", thumbnailUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=75", category: "Cars", tags: ["night", "road", "cinematic"], width: 2160, height: 3840, license: "Unsplash license", authorName: "Wallora Curators" },
  { id: "desert-dunes", title: "Desert Dunes", description: "Minimal warm dunes with sculptural shadows.", imageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1800&q=85", thumbnailUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=700&q=75", category: "Landscapes", tags: ["desert", "minimal", "sand"], width: 2160, height: 3840, license: "Unsplash license", authorName: "Wallora Curators" },
  { id: "architecture-lines", title: "Architecture Lines", description: "Clean geometry and modern architecture.", imageUrl: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1800&q=85", thumbnailUrl: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=700&q=75", category: "Architecture", tags: ["architecture", "geometry", "minimal"], width: 2160, height: 3840, license: "Unsplash license", authorName: "Wallora Curators" },
  { id: "space-orbit", title: "Orbit", description: "A deep-space view for a dark home screen.", imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1800&q=85", thumbnailUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=75", category: "Space", tags: ["space", "planet", "dark"], width: 2160, height: 3840, license: "Unsplash license", authorName: "Wallora Curators" },
  { id: "forest-path", title: "Forest Path", description: "A green forest path with soft natural light.", imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1800&q=85", thumbnailUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=700&q=75", category: "Nature", tags: ["forest", "green", "trees"], width: 2160, height: 3840, license: "Unsplash license", authorName: "Wallora Curators" },
  { id: "amoled-black", title: "Black Void", description: "Near-black abstract texture for AMOLED screens.", imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1800&q=85", thumbnailUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=700&q=85", category: "AMOLED", tags: ["black", "dark", "stars"], width: 2160, height: 3840, license: "Unsplash license", authorName: "Wallora Curators" }
];

