// Contexto compartido de categorías públicas: mantiene las etiquetas personalizadas
// coherentes en navegación, tarjetas y fichas sin repetir consultas por componente.
import { createContext, useContext, useMemo } from "react";

const CatalogContext = createContext([]);

export function CatalogProvider({ categories, children }) {
  const value = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalogCategories() {
  return useContext(CatalogContext);
}
