// hooks/useCatalogFilters.js
// Los filtros viven en la URL (?category=pin&q=...). Así se pueden compartir, usar el botón atrás
// y recibir enlaces desde la portada sin lógica adicional.
import { useSearchParams } from "react-router-dom";
import { DEFAULT_SORT } from "../utils/catalogOptions.js";

const FILTER_KEYS = ["category", "work", "availability", "sort", "q"];

export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    category: searchParams.get("category") || "",
    work: searchParams.get("work") || "",
    availability: searchParams.get("availability") || "",
    sort: searchParams.get("sort") || DEFAULT_SORT,
    q: searchParams.get("q") || ""
  };

  // Cambia un filtro y conserva los demás. Los valores vacíos o por defecto se quitan de la URL.
  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    const isDefault = value === "" || (key === "sort" && value === DEFAULT_SORT);
    if (isDefault) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  // Query que se envía a la API: solo los filtros con valor.
  const query = new URLSearchParams();
  FILTER_KEYS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) query.set(key, value);
  });

  const hasActiveFilters = filters.category !== ""
    || filters.work !== ""
    || filters.availability !== ""
    || filters.q !== ""
    || filters.sort !== DEFAULT_SORT;

  return {
    filters,
    updateFilter,
    clearFilters,
    queryString: query.toString(),
    hasActiveFilters
  };
}
