/**
 * Default fallback images for projects based on category or rotation,
 * with full Admin Settings configuration support.
 */

export const DEFAULT_PROJECT_IMAGE_KEY = "share-project:default-project-image";
export const CATEGORY_DEFAULT_IMAGES_KEY = "share-project:category-default-images";
export const DEFAULT_IMAGE_CHANGED_EVENT = "share-project:default-image-changed";

export const BASE_GLOBAL_DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85";

export const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  "commercial real estate":
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
  "hotel & resort":
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
  "renewable energy":
    "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=85",
  technology:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85",
  transport:
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85",
  agriculture:
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=85",
  residential:
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85",
};

export const FALLBACK_PROJECT_IMAGES = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85",
];

export const PRESET_DEFAULT_IMAGES = [
  {
    id: "commercial-tower",
    title: { bn: "আধুনিক বাণিজ্যিক টাওয়ার", en: "Modern Commercial Tower" },
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
    category: "commercial real estate",
  },
  {
    id: "luxury-resort",
    title: { bn: "লাক্সারি হোটেল ও রিসোর্ট", en: "Luxury Hotel & Resort" },
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
    category: "hotel & resort",
  },
  {
    id: "green-energy",
    title: { bn: "নবায়নযোগ্য ক্লিন এনার্জি পার্ক", en: "Renewable Clean Energy Park" },
    url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=85",
    category: "renewable energy",
  },
  {
    id: "smart-tech-hub",
    title: { bn: "হাইটেক টেকনোলজি হাব", en: "Hi-Tech Innovation Hub" },
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85",
    category: "technology",
  },
  {
    id: "modern-residence",
    title: { bn: "প্রিমিয়াম আবাসিক প্রজেক্ট", en: "Premium Residential Plaza" },
    url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=85",
    category: "residential",
  },
  {
    id: "metro-transport",
    title: { bn: "পরিবহন ও লজিস্টিকস হাব", en: "Transport & Logistics Terminal" },
    url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85",
    category: "transport",
  },
];

/**
 * Returns admin-configured custom global default image if set.
 */
export function getAdminCustomDefaultImage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const custom = localStorage.getItem(DEFAULT_PROJECT_IMAGE_KEY);
    return custom && custom.trim() ? custom.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Returns admin-configured category default images map.
 */
export function getAdminCategoryDefaultImages(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CATEGORY_DEFAULT_IMAGES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Main function to get the default image for any project across the entire application.
 * Priority:
 * 1. Admin Category Override (if configured)
 * 2. Admin Global Default Image (if configured)
 * 3. Built-in Category Default Image
 * 4. Fallback Rotation Image
 */
export function getProjectDefaultImage(category?: string, index: number = 0): string {
  const cat = String(category || "").toLowerCase().trim();

  // 1. Check admin category override
  const customCatMap = getAdminCategoryDefaultImages();
  for (const [key, url] of Object.entries(customCatMap)) {
    if (cat.includes(key.toLowerCase()) && url) return url;
  }

  // 2. Check admin global default image
  const globalCustom = getAdminCustomDefaultImage();
  if (globalCustom) return globalCustom;

  // 3. Check built-in category mapping
  for (const [key, url] of Object.entries(CATEGORY_DEFAULT_IMAGES)) {
    if (cat.includes(key)) return url;
  }

  // 4. Default fallback rotation
  return FALLBACK_PROJECT_IMAGES[index % FALLBACK_PROJECT_IMAGES.length] || BASE_GLOBAL_DEFAULT_IMAGE;
}

/**
 * Updates the admin custom global default image.
 */
export function setAdminCustomDefaultImage(url: string): void {
  if (typeof window === "undefined") return;
  try {
    if (url && url.trim()) {
      localStorage.setItem(DEFAULT_PROJECT_IMAGE_KEY, url.trim());
    } else {
      localStorage.removeItem(DEFAULT_PROJECT_IMAGE_KEY);
    }
    window.dispatchEvent(new Event(DEFAULT_IMAGE_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Updates category-specific default images.
 */
export function setAdminCategoryDefaultImages(map: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CATEGORY_DEFAULT_IMAGES_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(DEFAULT_IMAGE_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Resets all default images to system defaults.
 */
export function resetAdminDefaultImages(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEFAULT_PROJECT_IMAGE_KEY);
    localStorage.removeItem(CATEGORY_DEFAULT_IMAGES_KEY);
    window.dispatchEvent(new Event(DEFAULT_IMAGE_CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Compresses an uploaded image file to a lightweight JPEG data URL (< ~80KB)
 * so project thumbnails load fast and never bloat database payloads.
 */
export function compressImageFileToDataUrl(file: File, maxWidth = 960, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Invalid image file"));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result || ""));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}
