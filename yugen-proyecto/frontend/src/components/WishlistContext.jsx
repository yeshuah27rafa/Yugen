// Estado compartido de deseos: local para visitantes y persistente en la cuenta del cliente.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { clienteGet, clientePut, setCustomerCsrfToken } from "../api/client.js";
import { clearWishlist, readWishlist, WISHLIST_EVENT, writeWishlist } from "../utils/wishlistStorage.js";

const WishlistContext = createContext(null);
export const WISHLIST_OPEN_EVENT = "yugen-wishlist-open";
export function openWishlistDrawer() {
  window.dispatchEvent(new Event(WISHLIST_OPEN_EVENT));
}

function normalizeProduct(product) {
  const id = String(product?._id || product?.id || product?.productId || "");
  if (!id) return null;
  const mainImage = product.mainImage || (Array.isArray(product.images) ? product.images.find((image) => image?.isMain) || product.images[0] : null) || null;
  return {
    id,
    _id: id,
    name: String(product.name || "Pieza guardada"),
    slug: String(product.slug || ""),
    category: String(product.category || "otro"),
    price: product.price === null || product.price === undefined ? null : Number(product.price),
    availability: String(product.availability || "en_stock"),
    mainImage,
    images: Array.isArray(product.images) ? product.images : [],
    work: product.work || null,
    contexto: String(product.contexto || "")
  };
}

function uniqueProducts(products) {
  const map = new Map();
  products.forEach((product) => {
    const normalized = normalizeProduct(product);
    if (normalized && !map.has(normalized.id)) map.set(normalized.id, normalized);
  });
  return [...map.values()].slice(0, 200);
}

export function WishlistProvider({ children }) {
  const location = useLocation();
  const [items, setItems] = useState(() => uniqueProducts(readWishlist()));
  const [account, setAccount] = useState(false);
  const [syncError, setSyncError] = useState("");

  // Detecta inicio/cierre de sesión al cambiar de página y fusiona los deseos del navegador con la cuenta.
  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        const session = await clienteGet("/cuenta/me");
        if (!active) return;
        setCustomerCsrfToken(session.csrfToken);
        const remote = await clienteGet("/cuenta/favoritos");
        const guest = readWishlist();
        const remoteProducts = uniqueProducts(remote.products || []);
        const remoteIds = new Set(remoteProducts.map((item) => item.id));
        const missingGuest = guest.filter((item) => !remoteIds.has(item.id));
        let normalized = remoteProducts;
        if (missingGuest.length > 0) {
          const merged = uniqueProducts([...remoteProducts, ...missingGuest]);
          const saved = await clientePut("/cuenta/favoritos", { productIds: merged.map((item) => item.id) });
          normalized = uniqueProducts(saved.products || []);
        }
        if (!active) return;
        setAccount(true);
        setItems(normalized);
        setSyncError("");
        clearWishlist();
      } catch (failure) {
        if (!active) return;
        if (failure.status === 401) {
          setCustomerCsrfToken("");
          setAccount(false);
          setItems(uniqueProducts(readWishlist()));
        } else {
          // Un error de red no debe vaciar una lista que ya se había cargado desde la cuenta.
          setSyncError(failure.message || "No pudimos sincronizar tu lista de deseos.");
        }
      }
    }
    hydrate();
    return () => { active = false; };
  }, [location.pathname]);

  useEffect(() => {
    if (account) return undefined;
    function refresh() { setItems(uniqueProducts(readWishlist())); }
    window.addEventListener(WISHLIST_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [account]);

  const update = useCallback(async (nextItems) => {
    const normalized = uniqueProducts(nextItems);
    const previous = items;
    setItems(normalized);
    setSyncError("");
    if (!account) {
      writeWishlist(normalized);
      return { ok: true };
    }
    try {
      const response = await clientePut("/cuenta/favoritos", { productIds: normalized.map((item) => item.id) });
      const fresh = uniqueProducts(response.products || []);
      setItems(fresh);
      return { ok: true };
    } catch (failure) {
      if (failure.status === 401) {
        // Conserva la acción del cliente en el navegador para fusionarla al volver a entrar.
        setCustomerCsrfToken("");
        setAccount(false);
        setItems(normalized);
        writeWishlist(normalized);
      } else {
        setItems(previous);
      }
      setSyncError(failure.message || "No pudimos actualizar tu lista de deseos.");
      return { ok: false, message: failure.message };
    }
  }, [account, items]);

  const toggle = useCallback((product) => {
    const normalized = normalizeProduct(product);
    if (!normalized) return Promise.resolve({ ok: false });
    const exists = items.some((item) => item.id === normalized.id);
    return update(exists ? items.filter((item) => item.id !== normalized.id) : [...items, normalized]);
  }, [items, update]);

  const remove = useCallback((id) => update(items.filter((item) => item.id !== String(id))), [items, update]);
  const isSaved = useCallback((id) => items.some((item) => item.id === String(id)), [items]);
  const value = useMemo(() => ({ items, count: items.length, account, syncError, toggle, remove, isSaved }), [items, account, syncError, toggle, remove, isSaved]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist debe utilizarse dentro de WishlistProvider.");
  return value;
}
