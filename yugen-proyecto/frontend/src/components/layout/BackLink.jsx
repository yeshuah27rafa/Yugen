// Enlace de retorno contextual con un destino alternativo seguro.
import { Link, useLocation } from "react-router-dom";

export default function BackLink({ to = "/catalogo", children = "Volver", className = "back-link" }) {
  const location = useLocation();
  const candidate = location.state && typeof location.state.returnTo === "string"
    ? location.state.returnTo
    : "";
  const safeReturn = candidate.startsWith("/") && candidate.startsWith("//") === false
    ? candidate
    : to;

  return <Link className={className} to={safeReturn}>{children}</Link>;
}
