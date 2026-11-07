// components/AdminContext.jsx
// Comparte el estado de sesión administrativa entre el layout y las páginas.
import { createContext, useContext } from "react";

export const AdminContext = createContext({ isAdmin: false, setIsAdmin: () => {} });

export function useIsAdmin() {
  const value = useContext(AdminContext);
  return typeof value === "boolean" ? value : Boolean(value.isAdmin);
}

export function useSetIsAdmin() {
  const value = useContext(AdminContext);
  return typeof value === "boolean" ? () => {} : value.setIsAdmin;
}
