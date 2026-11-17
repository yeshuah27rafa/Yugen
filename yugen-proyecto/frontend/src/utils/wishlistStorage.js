// Lista de deseos local para visitantes. Las cuentas sincronizan sus identificadores con la API.
const KEY = "yugen_lista_deseos";
export const WISHLIST_EVENT = "yugen-wishlist-changed";

export function readWishlist() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    return parsed.filter((item) => {
      if (!item || typeof item.id !== "string" || item.id.trim() === "" || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 200);
  } catch {
    return [];
  }
}

export function clearWishlist() {
  try { window.localStorage.removeItem(KEY); } catch { /* El almacenamiento puede estar bloqueado. */ }
}

export function writeWishlist(items) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // La lista sigue disponible durante esta visita si el navegador bloquea el almacenamiento.
  }
  window.dispatchEvent(new Event(WISHLIST_EVENT));
}
