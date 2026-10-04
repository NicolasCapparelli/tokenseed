const loaded = new Set<string>();
const GENERIC = new Set(["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif", "serif", "Georgia", "Times New Roman", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]);

/** Loads font families from Google Fonts on demand. Unknown names fail silently and fall back. */
export function loadFonts(families: string[]) {
  for (const family of families) {
    if (!family || GENERIC.has(family) || loaded.has(family)) continue;
    loaded.add(family);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }
}
